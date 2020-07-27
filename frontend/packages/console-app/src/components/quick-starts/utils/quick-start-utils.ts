import { QuickStart } from './quick-start-types';
import { mockQuickStarts } from './quick-start-mocks';

export const getQuickStarts = (): QuickStart[] => mockQuickStarts;

export const getQuickStart = (quickStartID: string): QuickStart =>
  mockQuickStarts.find((qs) => qs.id === quickStartID);
