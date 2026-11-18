import type { FC, ReactNode } from 'react';
import { useCallback } from 'react';
import * as UIActions from '@console/internal/actions/ui';
import { isNotificationDrawerExpanded } from '@console/internal/reducers/ui';
import { useConsoleDispatch } from '@console/shared/src/hooks/useConsoleDispatch';
import { useConsoleSelector } from '@console/shared/src/hooks/useConsoleSelector';
import { InternalToastProvider } from './InternalToastProvider';

interface ToastProviderProps {
  children?: ReactNode;
}

export const ToastProvider: FC<ToastProviderProps> = ({ children }) => {
  const dispatch = useConsoleDispatch();
  const isDrawerExpanded = useConsoleSelector(isNotificationDrawerExpanded);

  const onNotificationDrawerOpen = useCallback(() => {
    if (!isDrawerExpanded) {
      dispatch(UIActions.notificationDrawerToggleExpanded());
    }
  }, [dispatch, isDrawerExpanded]);

  return (
    <InternalToastProvider
      isNotificationDrawerExpanded={isDrawerExpanded}
      onNotificationDrawerOpen={onNotificationDrawerOpen}
    >
      {children}
    </InternalToastProvider>
  );
};
