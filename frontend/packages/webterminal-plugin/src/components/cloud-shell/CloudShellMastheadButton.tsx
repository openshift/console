import * as React from 'react';
import { Button, Tooltip } from '@patternfly/react-core';
import { TerminalIcon } from '@patternfly/react-icons/dist/esm/icons/terminal-icon';
import { css } from '@patternfly/react-styles';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import { RootState } from '@console/internal/redux';
import { useTelemetry } from '@console/shared/src/hooks/useTelemetry';
import { toggleCloudShellExpanded } from '../../redux/actions/cloud-shell-actions';
import { isCloudShellExpanded } from '../../redux/reducers/cloud-shell-selectors';
import useCloudShellAvailable from './useCloudShellAvailable';

type DispatchProps = {
  onClick: () => void;
};

type StateProps = {
  open?: boolean;
};

type Props = StateProps & DispatchProps;

const ClouldShellMastheadButton: React.FCC<Props> = ({ onClick, open }) => {
  const terminalAvailable = useCloudShellAvailable();
  const fireTelemetryEvent = useTelemetry();

  const { t } = useTranslation('webterminal-plugin');

  if (!terminalAvailable) {
    return null;
  }

  const openCloudshell = () => {
    onClick();
    fireTelemetryEvent('Web Terminal Initiated');
  };

  return (
    <Tooltip content={t('OpenShift command line')} position="bottom" enableFlip>
      <Button
        icon={<TerminalIcon />}
        variant="plain"
        aria-label={t('Command line terminal')}
        onClick={openCloudshell}
        className={css({ 'pf-m-selected': open }, 'co-masthead-button')}
        data-tour-id="tour-cloud-shell-button"
        data-quickstart-id="qs-masthead-cloudshell"
      />
    </Tooltip>
  );
};

const stateToProps = (state: RootState): StateProps => ({
  open: isCloudShellExpanded(state),
});

const dispatchToProps = (dispatch): DispatchProps => ({
  onClick: () => dispatch(toggleCloudShellExpanded()),
});

export default connect<StateProps, DispatchProps>(
  stateToProps,
  dispatchToProps,
)(ClouldShellMastheadButton);
