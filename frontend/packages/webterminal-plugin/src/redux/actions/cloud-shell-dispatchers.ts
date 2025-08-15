import { useCallback } from 'react';
import { ButtonVariant } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { useWarningModal } from '@console/shared/src/hooks/useWarningModal';
import { useIsCloudShellActive, useIsCloudShellExpanded } from '../reducers/cloud-shell-selectors';
import { setCloudShellExpanded, setCloudShellCommand } from './cloud-shell-actions';

export const useCloudShellCommandDispatch = (): ((command: string | null) => void) => {
  const dispatch = useDispatch();
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
  const dispatch = useDispatch();
  const { t } = useTranslation('webterminal-plugin');
  const confirmClose = useWarningModal({
    title: t('Close terminal?'),
    children: t(
      'This will close the terminal session. Content in the terminal will not be restored on next session.',
    ),
    confirmButtonVariant: ButtonVariant.danger,
    confirmButtonLabel: t('Yes'),
    cancelButtonLabel: t('No'),
    onConfirm: () => dispatch(setCloudShellExpanded(false)),
    ouiaId: 'WebTerminalCloseConfirmation',
  });

  return useCallback(() => {
    if (isExpanded && isActive) {
      confirmClose();
    } else {
      dispatch(setCloudShellExpanded(!isExpanded));
    }
  }, [dispatch, isExpanded, isActive, confirmClose]);
};
