import * as React from 'react';
import { connect } from 'react-redux';
import { connectToFlags, WithFlagsProps } from '@console/internal/reducers/connectToFlags';
import { RootState } from '@console/internal/redux';
import { FLAG_DEVWORKSPACE } from '../../const';
import { toggleCloudShellExpanded } from '../../redux/actions/cloud-shell-actions';
import { isCloudShellExpanded } from '../../redux/reducers/cloud-shell-selectors';
import CloudShellDrawer from './CloudShellDrawer';

type StateProps = {
  open: boolean;
};

type DispatchProps = {
  onClose: () => void;
};

type CloudShellProps = React.PropsWithChildren<WithFlagsProps & StateProps & DispatchProps>;

const CloudShell: React.FCC<CloudShellProps> = ({ flags, open, onClose, children }) => {
  if (!flags[FLAG_DEVWORKSPACE]) {
    return <>{children}</>;
  }
  return (
    <CloudShellDrawer onClose={onClose} open={open}>
      {children}
    </CloudShellDrawer>
  );
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
