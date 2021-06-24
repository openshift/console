import * as React from 'react';
import { Button, PageHeaderToolsItem } from '@patternfly/react-core';
import { TerminalIcon } from '@patternfly/react-icons';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import { RootState } from '@console/internal/redux';
import { toggleCloudShellExpanded } from '../../redux/actions/cloud-shell-actions';
import { isCloudShellExpanded } from '../../redux/reducers/cloud-shell-selectors';
import isMultiClusterEnabled from '../../utils/isMultiClusterEnabled';
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

  const { t } = useTranslation();

  if (!terminalAvailable || isMultiClusterEnabled()) {
    return null;
  }

  return (
    <PageHeaderToolsItem>
      <Button
        variant="plain"
        aria-label={t('cloudshell~Command line terminal')}
        onClick={onClick}
        className={open ? 'pf-m-selected' : undefined}
        data-tour-id="tour-cloud-shell-button"
        data-quickstart-id="qs-masthead-cloudshell"
      >
        <TerminalIcon className="co-masthead-icon" />
      </Button>
    </PageHeaderToolsItem>
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
