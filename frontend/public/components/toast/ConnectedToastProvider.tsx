import type { FC, ReactNode } from 'react';
import { useCallback } from 'react';
import { useConsoleDispatch } from '@console/shared/src/hooks/useConsoleDispatch';
import { useConsoleSelector } from '@console/shared/src/hooks/useConsoleSelector';
import { ToastProvider } from '@console/shared/src/components/toast/ToastProvider';
import * as UIActions from '../../actions/ui';
import { isNotificationDrawerExpanded } from '../../reducers/ui';

type ConnectedToastProviderProps = {
  children?: ReactNode;
};

export const ConnectedToastProvider: FC<ConnectedToastProviderProps> = ({ children }) => {
  const dispatch = useConsoleDispatch();
  const isDrawerExpanded = useConsoleSelector(isNotificationDrawerExpanded);

  const onNotificationDrawerOpen = useCallback(() => {
    if (!isDrawerExpanded) {
      dispatch(UIActions.notificationDrawerToggleExpanded());
    }
  }, [dispatch, isDrawerExpanded]);

  return (
    <ToastProvider
      isNotificationDrawerExpanded={isDrawerExpanded}
      onNotificationDrawerOpen={onNotificationDrawerOpen}
    >
      {children}
    </ToastProvider>
  );
};
