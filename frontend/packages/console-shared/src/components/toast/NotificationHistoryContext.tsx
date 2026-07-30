import { createContext } from 'react';
import type { NotificationHistoryContextValues } from './types';

export const NotificationHistoryContext = createContext<NotificationHistoryContextValues>(
  {} as NotificationHistoryContextValues,
);
