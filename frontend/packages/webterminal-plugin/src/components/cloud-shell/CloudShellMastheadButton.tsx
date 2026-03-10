import type { FC } from 'react';
import { Button, Tooltip } from '@patternfly/react-core';
import { TerminalIcon } from '@patternfly/react-icons';
import { css } from '@patternfly/react-styles';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@console/internal/components/ThemeProvider';
import { useTelemetry } from '@console/shared/src/hooks/useTelemetry';
import { useToggleCloudShellExpanded } from '../../redux/actions/cloud-shell-dispatchers';
import { useIsCloudShellExpanded } from '../../redux/reducers/cloud-shell-selectors';
import { useCloudShellAvailable } from './useCloudShellAvailable';

export const CloudShellMastheadButton: FC = () => {
  const terminalAvailable = useCloudShellAvailable();
  const fireTelemetryEvent = useTelemetry();
  const open = useIsCloudShellExpanded();
  const toggleCloudShellExpanded = useToggleCloudShellExpanded();

  const { redHat } = useTheme();

  const { t } = useTranslation('webterminal-plugin');

  if (!terminalAvailable) {
    return null;
  }

  const openCloudshell = () => {
    toggleCloudShellExpanded();
    fireTelemetryEvent('Web Terminal Initiated');
  };

  return (
    <Tooltip content={t('OpenShift command line')} position="bottom" enableFlip>
      <Button
        icon={<TerminalIcon />}
        variant="plain"
        isCircle={redHat}
        aria-label={t('Command line terminal')}
        onClick={openCloudshell}
        className={css({ 'pf-m-selected': open }, 'co-masthead-button')}
        data-tour-id="tour-cloud-shell-button"
        data-quickstart-id="qs-masthead-cloudshell"
      />
    </Tooltip>
  );
};
