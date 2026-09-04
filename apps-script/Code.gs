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
      case 'saveExerciseResult':
        result = saveExerciseResult_(p); break;
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

function getTrainingPlan_(weekId) {
  if (!weekId) throw new Error('weekId fehlt');
  var ssFile = fileInWeek_(weekId, CONFIG.fileNames.trainingPlan);
  var ss = SpreadsheetApp.openById(ssFile.getId());
  var workouts = ss.getSheets().map(parseWorkoutSheet_).filter(function (w) {
    return w.rows.length > 0;
  });
  return { weekId: weekId, workouts: workouts };
}

function norm_(v) {
  return String(v == null ? '' : v).trim();
}

/** Parse one tab into a Workout. Tolerant of the coach's varying layouts. */
function parseWorkoutSheet_(sheet) {
  var values = sheet.getDataRange().getValues();
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
      var ex = {
        kind: 'exercise',
        exercise: {
          id: String(rr + 1),
          position: rows.filter(function (x) { return x.kind === 'exercise'; }).length + 1,
          name: name,
          sets: sets || null,
          reps: reps || null,
          startWeight: col.startWeight >= 0 ? norm_(row[col.startWeight]) || null : null,
          cue: null,
          results: col.einheiten.map(function (ci) { return norm_(row[ci]) || null; }),
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

function saveExerciseResult_(p) {
  requireAll_(p, ['weekId', 'workoutId', 'exerciseId', 'sessionIndex']);
  var ssFile = fileInWeek_(p.weekId, CONFIG.fileNames.trainingPlan);
  var ss = SpreadsheetApp.openById(ssFile.getId());
  var sheet = ss.getSheets().filter(function (s) {
    return String(s.getSheetId()) === String(p.workoutId);
  })[0];
  if (!sheet) throw new Error('Trainingsvariante nicht gefunden');

  var parsed = parseWorkoutSheet_(sheet);
  var values = sheet.getDataRange().getValues();
  var headerRow = -1, setsCol = -1;
  for (var r = 0; r < values.length && headerRow < 0; r++) {
    for (var c = 0; c < values[r].length; c++) {
      if (norm_(values[r][c]).toLowerCase() === 'sätze') { headerRow = r; setsCol = c; break; }
    }
  }
  var einheiten = [];
  for (var i = 0; i < values[headerRow].length; i++) {
    if (/^einheit\s*\d+/i.test(norm_(values[headerRow][i]))) einheiten.push(i);
  }
  var si = Number(p.sessionIndex);
  if (si < 0 || si >= einheiten.length) throw new Error('Diese Einheit gibt es im Sheet nicht');

  var rowNumber = Number(p.exerciseId); // 1-based sheet row
  sheet.getRange(rowNumber, einheiten[si] + 1).setValue(p.value == null ? '' : String(p.value));
  return { saved: true };
}

// ─── pain diary ──────────────────────────────────────────────────────────────

function locatePainDiary_(sheet) {
  var values = sheet.getDataRange().getValues();
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

    if (/^notizen/i.test(low)) { inNotes = true; continue; }
    if (inNotes) { notesParts.push(text); continue; }
    if (/aufgaben/i.test(low) && low.indexOf(':') >= 0) { heading = text; continue; }
    if (/leopirzercoaching/i.test(low)) continue;
    if (/^checkliste/i.test(low)) continue;
    if (/woche\s*:/i.test(low) || /name\s*:/i.test(low)) continue;

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
