import { createContext } from 'react';
import type { NotificationHistoryContextValues } from '@console/shared/src/components/toast/types';

export const NotificationHistoryContext = createContext<NotificationHistoryContextValues>(
  {} as NotificationHistoryContextValues,
);
