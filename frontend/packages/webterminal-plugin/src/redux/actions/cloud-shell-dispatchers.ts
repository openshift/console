import { useCallback } from 'react';
import { ButtonVariant } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { cleanupDetachedResource } from '@console/internal/module/detached-ws-registry';
import { useConsoleDispatch } from '@console/shared/src/hooks/useConsoleDispatch';
import { useWarningModal } from '@console/shared/src/hooks/useWarningModal';
import {
  useIsCloudShellActive,
  useIsCloudShellExpanded,
  useDetachedSessions,
} from '../reducers/cloud-shell-selectors';
import {
  setCloudShellExpanded,
  setCloudShellCommand,
  clearDetachedSessions,
} from './cloud-shell-actions';

export const useCloudShellCommandDispatch = (): ((command: string | null) => void) => {
  const dispatch = useConsoleDispatch();
  return useCallback(
    (command: string) => {
      dispatch(setCloudShellCommand(command));
    },
    [dispatch],
  );
};

export const useToggleCloudShellExpanded = (): (() => void) => {
  const isExpanded = useIsCloudShellExpanded();
  const isActive = useIsCloudShellActive();
  const detachedSessions = useDetachedSessions();
  const dispatch = useConsoleDispatch();
  const { t } = useTranslation('webterminal-plugin');

  const doClose = useCallback(() => {
    dispatch(setCloudShellExpanded(false));
    if (detachedSessions.length > 0) {
      detachedSessions.forEach((s) => {
        if (s.cleanup) {
          cleanupDetachedResource(s.cleanup);
        }
      });
      dispatch(clearDetachedSessions());
    }
  }, [dispatch, detachedSessions]);

  const confirmClose = useWarningModal({
    title: t('Close terminal?'),
    children: t(
      'This will close the terminal session. Content in the terminal will not be restored on next session.',
    ),
    confirmButtonVariant: ButtonVariant.danger,
    confirmButtonLabel: t('Yes'),
    cancelButtonLabel: t('No'),
    onConfirm: doClose,
    ouiaId: 'WebTerminalCloseConfirmation',
  });

  return useCallback(() => {
    if (detachedSessions.length > 0 || (isExpanded && isActive)) {
      confirmClose();
    } else {
      dispatch(setCloudShellExpanded(!isExpanded));
    }
  }, [dispatch, isExpanded, isActive, detachedSessions.length, confirmClose]);
};
