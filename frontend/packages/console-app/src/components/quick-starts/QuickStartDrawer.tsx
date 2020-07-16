import * as React from 'react';
import { Dispatch } from 'redux';
import { connect } from 'react-redux';
import { RootState } from '@console/internal/redux';
import QuickStartDrawerComponent from './QuickStartDrawerComponent';
import {
  getActiveQuickStartID,
  isQuickStartDrawerExpanded,
} from '../../redux/reducers/quick-start-reducer';
import { setActiveQuickStart } from '../../redux/actions/quick-start-actions';
import { getQuickStart } from './utils/quick-start-utils';

type StateProps = {
  isExpanded: boolean;
  activeQuickStartID: string;
};

type DispatchProps = {
  onClose: () => void;
};

type QuickStartDrawerProps = StateProps & DispatchProps;

const QuickStartDrawer: React.FC<QuickStartDrawerProps> = ({
  isExpanded,
  activeQuickStartID,
  onClose,
  children,
}) => {
  const quickStart = getQuickStart(activeQuickStartID);
  // TODO: Add check for tour completed status and send complete alert based on that
  // const tourCompleteAlert = (
  //   <Alert variant="success" isInline title="This tour has already been completed" />
  // );

  return (
    <QuickStartDrawerComponent expanded={isExpanded} quickStart={quickStart} onClose={onClose}>
      {children}
    </QuickStartDrawerComponent>
  );
};

const mapStateToProps = (state: RootState): StateProps => ({
  isExpanded: isQuickStartDrawerExpanded(state),
  activeQuickStartID: getActiveQuickStartID(state),
});

const mapDispatchToProps = (dispatch: Dispatch): DispatchProps => ({
  onClose: () => dispatch(setActiveQuickStart('')),
});

export default connect<StateProps, DispatchProps>(
  mapStateToProps,
  mapDispatchToProps,
)(QuickStartDrawer);
