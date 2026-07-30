import { useContext } from 'react';
import { NotificationHistoryContext } from './NotificationHistoryContext';

export const useNotificationHistory = () => useContext(NotificationHistoryContext);
