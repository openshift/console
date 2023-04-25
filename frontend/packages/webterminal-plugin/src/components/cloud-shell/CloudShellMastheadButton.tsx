import * as React from 'react';
import { Button } from '@patternfly/react-core';
import { TerminalIcon } from '@patternfly/react-icons';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import isMultiClusterEnabled from '@console/app/src/utils/isMultiClusterEnabled';
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

const ClouldShellMastheadButton: React.FC<Props> = ({ onClick, open }) => {
  const terminalAvailable = useCloudShellAvailable();
  const fireTelemetryEvent = useTelemetry();

  const { t } = useTranslation();

  // TODO remove multicluster
  if (!terminalAvailable || isMultiClusterEnabled()) {
    return null;
  }

  const openCloudshell = () => {
    onClick();
    fireTelemetryEvent('Web Terminal Initiated');
  };

  return (
    <Button
      variant="plain"
      aria-label={t('webterminal-plugin~Command line terminal')}
      onClick={openCloudshell}
      className={open ? 'pf-m-selected' : undefined}
      data-tour-id="tour-cloud-shell-button"
      data-quickstart-id="qs-masthead-cloudshell"
    >
      <TerminalIcon className="co-masthead-icon" />
    </Button>
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
