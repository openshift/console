import { QuickStart, QuickStartStatus, AllQuickStartStates } from './quick-start-types';
import { allQuickStarts } from '../data/quick-start-data';

export const getQuickStarts = (): QuickStart[] => allQuickStarts;

export const getQuickStartByName = (name: string): QuickStart =>
  allQuickStarts.find((quickStart) => quickStart.metadata.name === name);

export const getQuickStartStatus = (
  allQuickStartStates: AllQuickStartStates,
  quickStartID: string,
): QuickStartStatus =>
  (allQuickStartStates?.[quickStartID]?.status as QuickStartStatus) ?? QuickStartStatus.NOT_STARTED;
