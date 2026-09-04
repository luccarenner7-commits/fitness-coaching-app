/**
 * App configuration.
 *
 * V1 has no login: the app always runs against ONE hardcoded test customer.
 * The Drive/Sheet ids below identify that customer's weekly files and are read
 * by the backend (Google Apps Script), never by the browser directly.
 * See docs/ARCHITECTURE-DECISION.md and DEVIATIONS.md.
 */

export const APP_VERSION = '0.1.0';

/** URL of the deployed Google Apps Script Web App (set in Phase 4). */
export const APPS_SCRIPT_URL: string = import.meta.env.VITE_APPS_SCRIPT_URL ?? '';

export const TEST_CUSTOMER = {
  id: 'testkunde',
  displayName: 'Testkunde (App)',
  /** Drive folder: "APP-TEST Testkunde (nicht loeschen)". */
  driveFolderId: '1Mhm15ZdoFGNdEhI7l_V5RPA4BTW-h0F0',
} as const;
