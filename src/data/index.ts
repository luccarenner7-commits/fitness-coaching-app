import { createContext, useContext } from 'react';
import type { CoachingRepository } from './repository';
import { MockRepository } from './mock/MockRepository';
import { SheetsRepository } from './sheets/SheetsRepository';
import { APPS_SCRIPT_URL } from '@/lib/config';

/**
 * The single place that decides which data source is live:
 *  - VITE_APPS_SCRIPT_URL set  → live Google Sheets (via the Apps Script backend)
 *  - otherwise                 → in-memory mock data
 */
export const dataSource: 'sheets' | 'mock' = APPS_SCRIPT_URL ? 'sheets' : 'mock';

export const repository: CoachingRepository = APPS_SCRIPT_URL
  ? new SheetsRepository(APPS_SCRIPT_URL)
  : new MockRepository();

const RepositoryContext = createContext<CoachingRepository>(repository);

export const RepositoryProvider = RepositoryContext.Provider;

export function useRepository(): CoachingRepository {
  return useContext(RepositoryContext);
}

export type { CoachingRepository } from './repository';
