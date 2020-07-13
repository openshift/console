import * as React from 'react';
import { connect, Dispatch } from 'react-redux';
import { getActivePerspective } from '@console/internal/reducers/ui';
import { RootState } from '@console/internal/redux';
import * as UIActions from '@console/internal/actions/ui';
import PerspectiveDetector from './PerspectiveDetector';

type OwnProps = {
  children: React.ReactNode;
};

type StateProps = {
  activePerspective: string;
};

type DispatchProps = {
  setActivePerspective: (string) => void;
};

type DetectPerspectiveProps = OwnProps & StateProps & DispatchProps;

const DetectPerspective: React.FC<DetectPerspectiveProps> = ({
  activePerspective,
  children,
  setActivePerspective,
}) =>
  activePerspective ? (
    <>{children}</>
  ) : (
    <PerspectiveDetector setActivePerspective={setActivePerspective} />
  );

const mapStateToProps = (state: RootState) => ({
  activePerspective: getActivePerspective(state),
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
  setActivePerspective: (perspective) => dispatch(UIActions.setActivePerspective(perspective)),
});

// For testing
export const InternalDetectPerspective = DetectPerspective;

export default connect<StateProps, DispatchProps, OwnProps>(
  mapStateToProps,
  mapDispatchToProps,
)(DetectPerspective);
