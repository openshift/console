import * as React from 'react';
import { connect } from 'react-redux';
import { connectToFlags, WithFlagsProps } from '@console/internal/reducers/connectToFlags';
import { RootState } from '@console/internal/redux';
import { FLAG_DEVWORKSPACE } from '../../consts';
import { toggleCloudShellExpanded } from '../../redux/actions/cloud-shell-actions';
import { isCloudShellExpanded } from '../../redux/reducers/cloud-shell-selectors';
import CloudShellDrawer from './CloudShellDrawer';
import CloudShellTerminal from './CloudShellTerminal';

type StateProps = {
  open: boolean;
};

type DispatchProps = {
  onClose: () => void;
};

type CloudShellProps = WithFlagsProps & StateProps & DispatchProps;

const CloudShell: React.FC<CloudShellProps> = ({ flags, open, onClose }) => {
  if (!flags[FLAG_DEVWORKSPACE]) {
    return null;
  }
  return open ? (
    <CloudShellDrawer onClose={onClose}>
      <CloudShellTerminal onCancel={onClose} />
    </CloudShellDrawer>
  ) : null;
};

const stateToProps = (state: RootState): StateProps => ({
  open: isCloudShellExpanded(state),
});

const dispatchToProps = (dispatch): DispatchProps => ({
  onClose: () => dispatch(toggleCloudShellExpanded()),
});

export default connect<StateProps, DispatchProps>(
  stateToProps,
  dispatchToProps,
)(connectToFlags(FLAG_DEVWORKSPACE)(CloudShell));
