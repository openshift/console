import { useContext } from 'react';
import { NotificationHistoryContext } from '@console/app/src/providers/toast/NotificationHistoryContext';

export const useNotificationHistory = () => useContext(NotificationHistoryContext);
