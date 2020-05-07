import * as React from 'react';
import { Dispatch } from 'redux';
import { connect } from 'react-redux';
import { useFlag } from '@console/shared/src/hooks/flag';
import { RootState } from '@console/internal/redux-types';
import { isCloudShellExpanded } from '../../redux/reducers/cloud-shell-reducer';
import { toggleCloudShellExpanded } from '../../redux/actions/cloud-shell-actions';
import cloudShellConfirmationModal from './cloudShellConfirmationModal';
import CloudShellDrawer from './CloudShellDrawer';
import CloudShellTerminal from './CloudShellTerminal';
import { FLAG_DEVWORKSPACE } from '../../consts';

type StateProps = {
  open: boolean;
};

type DispatchProps = {
  onClose: () => void;
};

type CloudShellProps = StateProps & DispatchProps;

const CloudShell: React.FC<CloudShellProps> = ({ open, onClose }) => {
  const devWorkspaceFlag = useFlag(FLAG_DEVWORKSPACE);
  if (!devWorkspaceFlag) {
    return null;
  }
  const toggleWithModal = () => cloudShellConfirmationModal(onClose);
  return open ? (
    <CloudShellDrawer onClose={toggleWithModal}>
      <CloudShellTerminal onCancel={onClose} />
    </CloudShellDrawer>
  ) : null;
};

const stateToProps = (state: RootState): StateProps => ({
  open: isCloudShellExpanded(state),
});

const dispatchToProps = (dispatch: Dispatch): DispatchProps => ({
  onClose: () => dispatch(toggleCloudShellExpanded()),
});

export default connect<StateProps, DispatchProps>(stateToProps, dispatchToProps)(CloudShell);
