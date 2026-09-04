import { createContext, useContext } from 'react';
import type { CoachingRepository } from './repository';
import { MockRepository } from './mock/MockRepository';

/**
 * The single place that decides which data source is live.
 * V1 = mock. Phase 4 swaps this for `new SheetsRepository(APPS_SCRIPT_URL)`.
 */
export const repository: CoachingRepository = new MockRepository();

const RepositoryContext = createContext<CoachingRepository>(repository);

export const RepositoryProvider = RepositoryContext.Provider;

export function useRepository(): CoachingRepository {
  return useContext(RepositoryContext);
}

export type { CoachingRepository } from './repository';
