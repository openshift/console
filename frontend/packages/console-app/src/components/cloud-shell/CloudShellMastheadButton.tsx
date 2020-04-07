import * as React from 'react';
import { Dispatch } from 'redux';
import { connect } from 'react-redux';
import { RootState } from '@console/internal/redux';
import { TerminalIcon } from '@patternfly/react-icons';
import { isCloudShellExpanded } from '../../redux/reducers/cloud-shell-reducer';
import { Button, ToolbarItem, Tooltip } from '@patternfly/react-core';
import { connectToFlags, WithFlagsProps } from '@console/internal/reducers/features';
import { FLAG_DEVWORKSPACE } from '../../consts';
import { toggleCloudShellExpanded } from '../../redux/actions/cloud-shell-actions';
import { useAccessReview } from '@console/internal/components/utils';
import { WorkspaceModel } from '../../models';
import cloudShellConfirmationModal from './cloudShellConfirmationModal';

type DispatchProps = {
  onClick: () => void;
};

type StateProps = {
  open?: boolean;
};

type Props = WithFlagsProps & StateProps & DispatchProps;

// TODO use proper namespace and resource name
const namespace = 'che-workspace-controller';
const name = 'cloudshell-userid';

const ClouldShellMastheadButton: React.FC<Props> = ({ flags, onClick, open }) => {
  const editAccess = useAccessReview({
    group: WorkspaceModel.apiGroup,
    resource: WorkspaceModel.plural,
    verb: 'create',
    name,
    namespace,
  });

  const toggleTerminal = () => {
    if (open) {
      return cloudShellConfirmationModal(onClick);
    }
    return onClick();
  };

  if (!editAccess || !flags[FLAG_DEVWORKSPACE]) {
    return null;
  }

  return (
    <ToolbarItem>
      <Tooltip content={open ? 'Close Terminal' : 'Open command line terminal'}>
        <Button variant="plain" aria-label="Command Line Terminal" onClick={toggleTerminal}>
          <TerminalIcon className="co-masthead-icon" />
        </Button>
      </Tooltip>
    </ToolbarItem>
  );
};

const cloudshellStateToProps = (state: RootState): StateProps => ({
  open: isCloudShellExpanded(state),
});

const cloudshellPropsToState = (dispatch: Dispatch): DispatchProps => ({
  onClick: () => dispatch(toggleCloudShellExpanded()),
});

export default connect<StateProps, DispatchProps>(
  cloudshellStateToProps,
  cloudshellPropsToState,
)(connectToFlags(FLAG_DEVWORKSPACE)(ClouldShellMastheadButton));
