import * as React from 'react';
import { Dispatch } from 'redux';
import { connect } from 'react-redux';
import { RootState } from '@console/internal/redux';
import DrawerComponent from './DrawerComponent';
import {
  getActiveTourID,
  isGuidedTourDrawerExpanded,
} from '../../redux/reducers/guided-tour-reducer';
import { setActiveGuidedTour } from '../../redux/actions/guided-tour-actions';
import { getGuidedTour } from './utils/guided-tour-utils';

type StateProps = {
  isExpanded: boolean;
  activeTourID: string;
};

type DispatchProps = {
  onClose: () => void;
};

type GuidedTourDrawerProps = StateProps & DispatchProps;

const GuidedTourDrawer: React.FC<GuidedTourDrawerProps> = ({
  isExpanded,
  activeTourID,
  onClose,
  children,
}) => {
  const guidedTour = getGuidedTour(activeTourID);
  // TODO: Add check for tour completed status and send complete alert based on that
  // const tourCompleteAlert = (
  //   <Alert variant="success" isInline title="This tour has already been completed" />
  // );

  return (
    <DrawerComponent expanded={isExpanded} guidedTour={guidedTour} onClose={onClose}>
      {children}
    </DrawerComponent>
  );
};

const mapStateToProps = (state: RootState): StateProps => ({
  isExpanded: isGuidedTourDrawerExpanded(state),
  activeTourID: getActiveTourID(state),
});

const mapDispatchToProps = (dispatch: Dispatch): DispatchProps => ({
  onClose: () => dispatch(setActiveGuidedTour('')),
});

export default connect<StateProps, DispatchProps>(
  mapStateToProps,
  mapDispatchToProps,
)(GuidedTourDrawer);
