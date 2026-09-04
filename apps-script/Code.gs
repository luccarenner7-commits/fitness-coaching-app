/**
 * Backend für die Fitness-Coaching-App.
 *
 * Läuft als Web App im Google-Konto des Coaches und ist damit die
 * "Data Access Layer": das statische Frontend (GitHub Pages) spricht nur mit
 * diesem Script, nie direkt mit Google.
 *
 * V1: kein Login, fester Testkunde (CONFIG.customerFolderId).
 * Nur Felder, die real in den Sheets/Docs stehen — Rest siehe DEVIATIONS.md.
 *
 * Deploy: siehe apps-script/README.md
 */

var CONFIG = {
  // Drive-Ordner "APP-TEST Testkunde (nicht loeschen)"
  customerFolderId: '1Mhm15ZdoFGNdEhI7l_V5RPA4BTW-h0F0',
  customerName: 'Testkunde (App)',
  fileNames: {
    trainingPlan: 'Trainingsplan',
    painDiary: 'Schmerztagebuch',
    todos: 'Checkliste',
  },
  // Optional: wenn gesetzt, muss jeder Aufruf ?token=... mitschicken
  // (im Frontend VITE_APPS_SCRIPT_TOKEN). Leer lassen = offen (nur Testdaten).
  sharedToken: '',
};

var WEEKDAYS = [
  'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag',
];

// ─── HTTP entry points ───────────────────────────────────────────────────────

function doGet(e) {
  return handle_(e, (e && e.parameter) || {});
}

function doPost(e) {
  var params = (e && e.parameter) || {};
  if (e && e.postData && e.postData.contents) {
    try {
      var body = JSON.parse(e.postData.contents);
      for (var k in body) params[k] = body[k];
    } catch (err) {
      /* ignore non-JSON bodies */
    }
  }
  return handle_(e, params);
}

function handle_(e, p) {
  var action = p.action || 'ping';
  try {
    if (CONFIG.sharedToken && action !== 'ping' && p.token !== CONFIG.sharedToken) {
      throw new Error('Nicht autorisiert');
    }
    var result;
    switch (action) {
      case 'ping':            result = { ok: true, customer: CONFIG.customerName }; break;
      case 'getCustomer':     result = getCustomer_(); break;
      case 'getWeeks':        result = getWeeks_(); break;
      case 'getTrainingPlan': result = getTrainingPlan_(p.weekId); break;
      case 'getPainDiary':    result = getPainDiary_(p.weekId); break;
      case 'getTodos':        result = getTodos_(p.weekId); break;
      case 'saveExerciseSet':
        result = saveExerciseSet_(p); break;
      case 'saveExercisePain':
        result = saveExercisePain_(p); break;
      case 'getExerciseHistory':
        result = getExerciseHistory_(p.exerciseName); break;
      case 'savePainDay':
        result = savePainDay_(p); break;
      case 'setTodoDone':
        result = setTodoDone_(p); break;
      default:
        throw new Error('Unbekannte Aktion: ' + action);
    }
    return json_({ ok: true, data: result });
  } catch (err) {
    return json_({ ok: false, error: String(err && err.message || err) });
  }
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON,
  );
}

// ─── Drive helpers ───────────────────────────────────────────────────────────

function customerFolder_() {
  return DriveApp.getFolderById(CONFIG.customerFolderId);
}

/** All "Woche N (DD.MM.-DD.MM.YY)" subfolders, parsed, newest first. */
function listWeeks_() {
  var it = customerFolder_().getFolders();
  var weeks = [];
  var re = /Woche\s*(\d+)\s*\((\d{1,2})\.(\d{1,2})\.?-\s*(\d{1,2})\.(\d{1,2})\.(\d{2,4})\)/i;
  while (it.hasNext()) {
    var f = it.next();
    var m = re.exec(f.getName());
    if (!m) continue;
    var endYear = Number(m[6].length === 2 ? '20' + m[6] : m[6]);
    var endMonth = Number(m[5]);
    var startMonth = Number(m[3]);
    var startYear = startMonth > endMonth ? endYear - 1 : endYear;
    var start = new Date(startYear, startMonth - 1, Number(m[2]));
    var end = new Date(endYear, endMonth - 1, Number(m[4]));
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    weeks.push({
      id: f.getId(),
      label: 'Woche ' + m[1],
      startDate: iso_(start),
      endDate: iso_(end),
      isCurrent: today >= start && today <= end,
      _order: start.getTime(),
    });
  }
  weeks.sort(function (a, b) { return b._order - a._order; });
  weeks.forEach(function (w) { delete w._order; });
  return weeks;
}

function iso_(d) {
  return Utilities.formatDate(d, 'Europe/Berlin', 'yyyy-MM-dd');
}

// Every write into the Trainingslog tab used to call weekById_(), which calls
// listWeeks_() — an enumeration of every subfolder in the customer's Drive
// folder — just to read one week's label. That (plus assertWeekAllowed_'s own
// Drive round trip) was most of the multi-second latency on "Satz bestätigen".
// Cache the {id,label,...} tuple per weekId; a week's folder name never
// changes after it's created, so a long TTL is safe.
var WEEK_CACHE_TTL_SECONDS = 21600; // 6h — CacheService's own maximum

function getWeekCached_(weekId) {
  if (!weekId) throw new Error('weekId fehlt');
  var cache = CacheService.getScriptCache();
  var key = 'week:' + weekId;
  var cached = cache.get(key);
  if (cached) return JSON.parse(cached);
  assertWeekAllowed_(weekId);
  var week = weekById_(weekId);
  cache.put(key, JSON.stringify(week), WEEK_CACHE_TTL_SECONDS);
  return week;
}

/**
 * Apps Script can run several doPost invocations for the same user
 * concurrently, and none of the Sheets calls below are atomic on their own.
 * Every write into the Trainingslog tab does read-all-rows → decide
 * update-or-append → write, and without a lock two overlapping requests can
 * both read "no existing row" and both append — producing a duplicate row (or
 * losing one of the two writes, since appendRow resolves "the next free row"
 * at write time). Wrap the whole read+decide+write section in a script lock.
 */
function withLock_(fn) {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var result = fn();
    SpreadsheetApp.flush(); // make sure the write is committed before the next request can read
    return result;
  } finally {
    lock.releaseLock();
  }
}

/**
 * Guard against IDOR: the Web App runs as the coach, so an unchecked
 * getFolderById(weekId) would reach ANY of the coach's folders. Only allow
 * direct children of the configured customer folder.
 */
function assertWeekAllowed_(weekId) {
  if (!weekId) throw new Error('weekId fehlt');
  var parents = DriveApp.getFolderById(weekId).getParents();
  while (parents.hasNext()) {
    if (parents.next().getId() === CONFIG.customerFolderId) return;
  }
  throw new Error('Zugriff verweigert');
}

function fileInWeek_(weekId, name) {
  assertWeekAllowed_(weekId);
  var folder = DriveApp.getFolderById(weekId);
  var it = folder.getFilesByName(name);
  if (!it.hasNext()) throw new Error('Datei "' + name + '" fehlt in diesem Wochenordner');
  return it.next();
}

// ─── customer / weeks ────────────────────────────────────────────────────────

function getCustomer_() {
  return { id: 'testkunde', displayName: CONFIG.customerName };
}

function getWeeks_() {
  return listWeeks_();
}

// ─── training plan ───────────────────────────────────────────────────────────

// Training plans never get anywhere near this big; the cap protects against a
// pathologically large used-range on a copied sheet (which can hang openById-side
// reads long enough to kill the request).
var MAX_ROWS = 300;
var MAX_COLS = 16;

/** Bounded read — never pull the whole (possibly huge) used range. */
function readGrid_(sheet, maxRows, maxCols) {
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  if (lastRow < 1 || lastCol < 1) return [];
  var rows = Math.min(lastRow, maxRows || MAX_ROWS);
  var cols = Math.min(lastCol, maxCols || MAX_COLS);
  return sheet.getRange(1, 1, rows, cols).getValues();
}

function getTrainingPlan_(weekId) {
  if (!weekId) throw new Error('weekId fehlt');
  var ssFile = fileInWeek_(weekId, CONFIG.fileNames.trainingPlan);
  var ss = SpreadsheetApp.openById(ssFile.getId());
  var workouts = [];
  ss.getSheets().forEach(function (sheet) {
    if (sheet.getName() === TRAININGLOG_TAB) return;
    try {
      var w = parseWorkoutSheet_(sheet);
      if (w.rows.length > 0) workouts.push(w);
    } catch (err) {
      // one broken tab must not kill the whole plan
    }
  });
  applyLogToWorkouts_(workouts, readTrainingLogRows_(ss));
  return { weekId: weekId, workouts: workouts };
}

function norm_(v) {
  if (v == null) return '';
  // Google Sheets happily turns a rep range like "6-10" into a date value.
  // Reverse it back to "day-month" (which is what the coach originally typed).
  if (Object.prototype.toString.call(v) === '[object Date]' && !isNaN(v.getTime())) {
    return v.getDate() + '-' + (v.getMonth() + 1);
  }
  return String(v).trim();
}

/** Parse one tab into a Workout. Tolerant of the coach's varying layouts. */
function parseWorkoutSheet_(sheet) {
  var values = readGrid_(sheet, MAX_ROWS, MAX_COLS);
  var headerRow = -1;
  var col = { name: -1, sets: -1, reps: -1, startWeight: -1, einheiten: [] };

  for (var r = 0; r < values.length && headerRow < 0; r++) {
    for (var c = 0; c < values[r].length; c++) {
      if (norm_(values[r][c]).toLowerCase() === 'sätze') {
        headerRow = r;
        col.sets = c;
        break;
      }
    }
  }
  if (headerRow < 0) return { id: String(sheet.getSheetId()), name: sheet.getName(), sessionCount: 0, hasStartWeight: false, rows: [] };

  var hdr = values[headerRow];
  for (var i = 0; i < hdr.length; i++) {
    var h = norm_(hdr[i]).toLowerCase();
    if (h === 'übung' || h === 'uebung') col.name = i;
    else if (h.indexOf('wiederholung') === 0 || h === 'wdh.' || h === 'wdh') col.reps = i;
    else if (h.indexOf('startgewicht') === 0 || h === 'gewicht') col.startWeight = i;
    else if (/^einheit\s*\d+/.test(h)) col.einheiten.push(i);
  }
  if (col.name < 0) col.name = Math.max(0, col.sets - 1);
  if (col.reps < 0) col.reps = col.sets + 1;

  var titleCell = norm_(values[0] && values[0][col.name]) || norm_(values[0] && values[0][0]);
  var sessionCount = col.einheiten.length;
  var rows = [];
  var exCount = 0;
  var lastExerciseIdx = -2;

  for (var rr = headerRow + 1; rr < values.length; rr++) {
    var row = values[rr];
    var name = norm_(row[col.name]);
    var sets = norm_(row[col.sets]);
    var reps = norm_(row[col.reps]);
    var restEmpty = sets === '' && reps === '' && norm_(row[col.startWeight] || '') === '';

    if (name === '' ) continue;

    if (!restEmpty) {
      // exercise row (sheet row number is rr + 1)
      exCount += 1;
      var ex = {
        kind: 'exercise',
        exercise: {
          id: String(rr + 1),
          position: exCount,
          name: name,
          sets: sets || null,
          reps: reps || null,
          startWeight: col.startWeight >= 0 ? norm_(row[col.startWeight]) || null : null,
          cue: null,
          // filled in by applyLogToWorkouts_() from the "Trainingslog" tab
          sessionLogs: [],
        },
      };
      rows.push(ex);
      lastExerciseIdx = rr;
      continue;
    }

    // col0/name-only row: cue for the exercise right above, else a section
    var isSection = /^(warm ?up|cool ?down|kraftteil|mobility|aktivierung|abschluss)/i.test(name);
    if (!isSection && rr === lastExerciseIdx + 1 && rows.length && rows[rows.length - 1].kind === 'exercise') {
      rows[rows.length - 1].exercise.cue = name;
    } else {
      rows.push({ kind: 'section', id: 's' + rr, title: name });
      lastExerciseIdx = -2;
    }
  }

  return {
    id: String(sheet.getSheetId()),
    name: titleCell || sheet.getName(),
    sessionCount: sessionCount,
    hasStartWeight: col.startWeight >= 0,
    rows: rows,
  };
}

// ─── training log ("Trainingslog" tab: Gewicht/Wdh./RIR pro Satz + Schmerz) ──

var TRAININGLOG_TAB = 'Trainingslog';
var LOG_HEADER = [
  'Datum', 'Woche', 'Workout', 'Übung', 'Einheit', 'Satz',
  'Gewicht_kg', 'Wiederholungen', 'RIR', 'Schmerz',
];
// Satz = 0 is a reserved marker row that carries only the per-exercise
// "Schmerzen bei dieser Übung" value (no set data of its own).

function trainingLogSheet_(ss, create) {
  var sh = ss.getSheetByName(TRAININGLOG_TAB);
  if (!sh && create) {
    sh = ss.insertSheet(TRAININGLOG_TAB);
    sh.getRange(1, 1, 1, LOG_HEADER.length).setValues([LOG_HEADER]);
  }
  return sh;
}

/**
 * Column A (Datum) only ever holds a plain "YYYY-MM-DD" string we wrote
 * ourselves — but Sheets auto-converts that into a real Date cell. Reading it
 * through norm_() would run it through the rep-range Date-reversal hack meant
 * for the *plan* sheet's "Wiederholungen" column ("6-10" ⇄ Date), turning a
 * valid date into garbage like "4-9". Format Dates back to ISO instead.
 */
function normLogDate_(v) {
  if (Object.prototype.toString.call(v) === '[object Date]' && !isNaN(v.getTime())) {
    return iso_(v);
  }
  return norm_(v);
}

function readTrainingLogRows_(ss) {
  var sh = trainingLogSheet_(ss, false);
  if (!sh) return [];
  var values = readGrid_(sh, 4000, LOG_HEADER.length);
  var rows = [];
  for (var r = 1; r < values.length; r++) {
    var row = values[r];
    if (!norm_(row[2]) && !norm_(row[3])) continue;
    rows.push({
      date: normLogDate_(row[0]),
      weekLabel: norm_(row[1]),
      workout: norm_(row[2]),
      exercise: norm_(row[3]),
      session: Number(row[4]) || 0,
      setNumber: Number(row[5]) || 0,
      weight: norm_(row[6]),
      reps: norm_(row[7]),
      rir: norm_(row[8]),
      pain: norm_(row[9]),
      _sheetRow: r + 1,
    });
  }
  return rows;
}

function findLogRow_(rows, workout, exercise, session, setNumber) {
  for (var i = 0; i < rows.length; i++) {
    var r = rows[i];
    if (r.workout === workout && r.exercise === exercise && r.session === session && r.setNumber === setNumber) {
      return r;
    }
  }
  return null;
}

function upsertLogRow_(sh, existing, values) {
  if (existing) {
    sh.getRange(existing._sheetRow, 1, 1, values.length).setValues([values]);
  } else {
    sh.appendRow(values);
  }
}

/** Merge logged sets/pain from the Trainingslog tab into parsed workouts (by workout+exercise name). */
function applyLogToWorkouts_(workouts, logRows) {
  var byKey = {};
  logRows.forEach(function (row) {
    var key = row.workout + ' ' + row.exercise;
    byKey[key] = byKey[key] || {};
    var bucket = byKey[key][row.session] = byKey[key][row.session] || { sets: [], painAfter: null };
    if (row.setNumber === 0) {
      if (row.pain !== '') bucket.painAfter = Number(row.pain);
    } else if (row.weight !== '' || row.reps !== '' || row.rir !== '') {
      bucket.sets.push({
        setNumber: row.setNumber,
        weight: row.weight === '' ? null : Number(row.weight),
        reps: row.reps === '' ? null : Number(row.reps),
        rir: row.rir === '' ? null : Number(row.rir),
      });
    }
  });

  workouts.forEach(function (w) {
    w.rows.forEach(function (r) {
      if (r.kind !== 'exercise') return;
      var key = w.name + ' ' + r.exercise.name;
      var sessions = byKey[key] || {};
      var logs = [];
      for (var i = 1; i <= w.sessionCount; i++) {
        var bucket = sessions[i] || { sets: [], painAfter: null };
        bucket.sets.sort(function (a, b) { return a.setNumber - b.setNumber; });
        logs.push(bucket);
      }
      r.exercise.sessionLogs = logs;
    });
  });
}

function saveExerciseSet_(p) {
  requireAll_(p, ['weekId', 'workoutName', 'exerciseName', 'sessionIndex', 'setNumber']);
  var week = getWeekCached_(p.weekId);
  var ssFile = fileInWeek_(p.weekId, CONFIG.fileNames.trainingPlan);
  var session = Number(p.sessionIndex) + 1;
  var setNumber = Number(p.setNumber);
  var num = function (v) { return v === null || v === undefined || v === '' ? '' : Number(v); };

  return withLock_(function () {
    var ss = SpreadsheetApp.openById(ssFile.getId());
    var sh = trainingLogSheet_(ss, true);
    var rows = readTrainingLogRows_(ss);
    var existing = findLogRow_(rows, p.workoutName, p.exerciseName, session, setNumber);

    upsertLogRow_(sh, existing, [
      iso_(new Date()), week.label, p.workoutName, p.exerciseName, session, setNumber,
      num(p.weight), num(p.reps), num(p.rir),
      existing ? existing.pain : '', // never clobber a pain value saved separately
    ]);
    return { saved: true };
  });
}

function saveExercisePain_(p) {
  requireAll_(p, ['weekId', 'workoutName', 'exerciseName', 'sessionIndex']);
  var week = getWeekCached_(p.weekId);
  var ssFile = fileInWeek_(p.weekId, CONFIG.fileNames.trainingPlan);
  var session = Number(p.sessionIndex) + 1;
  var pain = p.pain === null || p.pain === undefined || p.pain === '' ? '' : Number(p.pain);

  return withLock_(function () {
    var ss = SpreadsheetApp.openById(ssFile.getId());
    var sh = trainingLogSheet_(ss, true);
    var rows = readTrainingLogRows_(ss);
    var existing = findLogRow_(rows, p.workoutName, p.exerciseName, session, 0);

    upsertLogRow_(sh, existing, [
      iso_(new Date()), week.label, p.workoutName, p.exerciseName, session, 0,
      '', '', '', pain,
    ]);
    return { saved: true };
  });
}

/** Weight-over-time for one exercise, scanning recent weeks (newest first, capped). */
function getExerciseHistory_(exerciseName) {
  if (!exerciseName) throw new Error('exerciseName fehlt');
  var weeks = listWeeks_();
  var MAX_WEEKS_SCANNED = 10;
  var points = [];

  for (var i = 0; i < weeks.length && i < MAX_WEEKS_SCANNED; i++) {
    var week = weeks[i];
    var ss;
    try {
      var file = fileInWeek_(week.id, CONFIG.fileNames.trainingPlan);
      ss = SpreadsheetApp.openById(file.getId());
    } catch (err) {
      continue; // e.g. week has no Trainingsplan file
    }

    var bySession = {};
    readTrainingLogRows_(ss).forEach(function (row) {
      if (row.exercise !== exerciseName) return;
      var bucket = bySession[row.session] = bySession[row.session] || {
        sets: [], painAfter: null, date: row.date,
      };
      if (row.date) bucket.date = row.date;
      if (row.setNumber === 0) {
        if (row.pain !== '') bucket.painAfter = Number(row.pain);
      } else if (row.weight !== '' || row.reps !== '' || row.rir !== '') {
        bucket.sets.push({
          setNumber: row.setNumber,
          weight: row.weight === '' ? null : Number(row.weight),
          reps: row.reps === '' ? null : Number(row.reps),
          rir: row.rir === '' ? null : Number(row.rir),
        });
      }
    });

    Object.keys(bySession).forEach(function (sessionKey) {
      var bucket = bySession[sessionKey];
      if (bucket.sets.length === 0 && bucket.painAfter == null) return;
      bucket.sets.sort(function (a, b) { return a.setNumber - b.setNumber; });
      points.push({
        date: bucket.date || week.startDate,
        weekLabel: week.label,
        sessionIndex: Number(sessionKey),
        sets: bucket.sets,
        painAfter: bucket.painAfter,
      });
    });
  }

  points.sort(function (a, b) { return a.date < b.date ? -1 : a.date > b.date ? 1 : 0; });
  return points;
}

// ─── pain diary ──────────────────────────────────────────────────────────────

function locatePainDiary_(sheet) {
  var values = readGrid_(sheet, 80, 12);
  var firstDayRow = -1, valueCol = -1;
  for (var r = 0; r < values.length && firstDayRow < 0; r++) {
    for (var c = 0; c < values[r].length; c++) {
      if (WEEKDAYS.indexOf(norm_(values[r][c])) >= 0) {
        firstDayRow = r;
        valueCol = c + 1;
        break;
      }
    }
  }
  if (firstDayRow < 0) throw new Error('Keine Wochentage im Schmerztagebuch gefunden');
  var noteCol = valueCol + 1;

  function labelAbove(colIdx, fallback) {
    for (var r = firstDayRow - 1; r >= 0; r--) {
      var t = norm_(values[r][colIdx]);
      if (t) return t;
    }
    return fallback;
  }

  return {
    values: values,
    dayCol: valueCol - 1,
    valueCol: valueCol,
    noteCol: noteCol,
    valueLabel: labelAbove(valueCol, 'Wert (0–10)'),
    noteLabel: labelAbove(noteCol, 'Notiz'),
    firstDayRow: firstDayRow,
  };
}

function getPainDiary_(weekId) {
  if (!weekId) throw new Error('weekId fehlt');
  var week = weekById_(weekId);
  var ssFile = fileInWeek_(weekId, CONFIG.fileNames.painDiary);
  var sheet = SpreadsheetApp.openById(ssFile.getId()).getSheets()[0];
  var loc = locatePainDiary_(sheet);

  var byWeekday = {};
  for (var r = 0; r < loc.values.length; r++) {
    var wd = norm_(loc.values[r][loc.dayCol]);
    if (WEEKDAYS.indexOf(wd) >= 0) {
      byWeekday[wd] = {
        value: norm_(loc.values[r][loc.valueCol]) || null,
        note: norm_(loc.values[r][loc.noteCol]) || null,
      };
    }
  }

  var start = new Date(week.startDate + 'T00:00:00');
  var days = WEEKDAYS.map(function (wd, i) {
    var d = new Date(start);
    d.setDate(d.getDate() + i);
    var entry = byWeekday[wd] || { value: null, note: null };
    return { weekday: wd, date: iso_(d), value: entry.value, note: entry.note };
  });

  return { weekId: weekId, valueLabel: loc.valueLabel, noteLabel: loc.noteLabel, days: days };
}

function savePainDay_(p) {
  requireAll_(p, ['weekId', 'weekday']);
  var ssFile = fileInWeek_(p.weekId, CONFIG.fileNames.painDiary);
  var sheet = SpreadsheetApp.openById(ssFile.getId()).getSheets()[0];
  var loc = locatePainDiary_(sheet);
  for (var r = 0; r < loc.values.length; r++) {
    if (norm_(loc.values[r][loc.dayCol]) === p.weekday) {
      sheet.getRange(r + 1, loc.valueCol + 1).setValue(p.value == null ? '' : String(p.value));
      sheet.getRange(r + 1, loc.noteCol + 1).setValue(p.note == null ? '' : String(p.note));
      return { saved: true };
    }
  }
  throw new Error('Tag "' + p.weekday + '" nicht im Sheet gefunden');
}

// ─── todos (Checkliste-Doc) ──────────────────────────────────────────────────

var BOX_OPEN = '☐';   // ☐
var BOX_DONE = '☑';   // ☑
var BOX_DONE2 = '☒';  // ☒

function getTodos_(weekId) {
  if (!weekId) throw new Error('weekId fehlt');
  var docFile = fileInWeek_(weekId, CONFIG.fileNames.todos);
  var body = DocumentApp.openById(docFile.getId()).getBody();
  var n = body.getNumChildren();
  var items = [];
  var heading = null;
  var notesParts = [];
  var inNotes = false;

  for (var i = 0; i < n; i++) {
    var el = body.getChild(i);
    var type = el.getType();
    if (type !== DocumentApp.ElementType.PARAGRAPH && type !== DocumentApp.ElementType.LIST_ITEM) {
      continue;
    }
    var text = norm_(el.asText().getText());
    if (!text) continue;
    var low = text.toLowerCase();

    // boilerplate that is never a task or a note
    if (/leopirzercoaching/i.test(low)) continue;
    if (/^checkliste/i.test(low)) continue;

    if (/^notizen/i.test(low)) { inNotes = true; continue; }
    if (inNotes) { notesParts.push(text); continue; }
    if (/aufgaben/i.test(low) && low.indexOf(':') >= 0) { heading = text; continue; }

    // template field line "Name: ____  Woche: ____"
    if (/name\s*:/i.test(low) && /woche\s*:/i.test(low)) continue;

    var first = text.charAt(0);
    var isBox = first === BOX_OPEN || first === BOX_DONE || first === BOX_DONE2;
    var done = first === BOX_DONE || first === BOX_DONE2;
    var label = isBox ? norm_(text.substring(1)) : text;
    if (!label) continue;
    // skip untouched template placeholders
    if (/^aufgabe\s*\d+$/i.test(label)) continue;

    items.push({
      id: String(i),
      text: label,
      done: done,
      checkable: isBox || type === DocumentApp.ElementType.LIST_ITEM,
    });
  }

  return {
    weekId: weekId,
    heading: heading,
    items: items,
    notes: notesParts.length ? notesParts.join('\n') : null,
  };
}

function setTodoDone_(p) {
  requireAll_(p, ['weekId', 'todoId']);
  var docFile = fileInWeek_(p.weekId, CONFIG.fileNames.todos);
  var doc = DocumentApp.openById(docFile.getId());
  var el = doc.getBody().getChild(Number(p.todoId));
  if (!el) throw new Error('Aufgabe nicht gefunden');
  var t = el.asText();
  var s = t.getText();
  var first = s.charAt(0);
  var want = p.done === true || p.done === 'true';

  if (first === BOX_OPEN || first === BOX_DONE || first === BOX_DONE2) {
    t.deleteText(0, 0);
    t.insertText(0, want ? BOX_DONE : BOX_OPEN);
  } else {
    // list item without a checkbox glyph — prepend one so state is visible
    t.insertText(0, (want ? BOX_DONE : BOX_OPEN) + ' ');
  }
  doc.saveAndClose();
  return { saved: true };
}

// ─── misc ────────────────────────────────────────────────────────────────────

function weekById_(weekId) {
  var w = listWeeks_().filter(function (x) { return x.id === weekId; })[0];
  if (!w) throw new Error('Woche nicht gefunden');
  return w;
}

function requireAll_(p, keys) {
  keys.forEach(function (k) {
    if (p[k] === undefined || p[k] === null || p[k] === '') {
      throw new Error('Parameter fehlt: ' + k);
    }
  });
}
