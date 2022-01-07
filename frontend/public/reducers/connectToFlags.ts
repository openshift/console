import { connect } from 'react-redux';
import * as _ from 'lodash-es';
import { FLAGS } from '@console/shared/src/constants';
import { RootState } from '../redux';
import { FeatureState, FlagsObject } from './features';

export const stateToFlagsObject = (state: FeatureState, desiredFlags: string[]): FlagsObject =>
  desiredFlags.reduce((allFlags, f) => ({ ...allFlags, [f]: state.get(f) }), {} as FlagsObject);

const stateToProps = (state: FeatureState, desiredFlags: string[]): WithFlagsProps => ({
  flags: stateToFlagsObject(state, desiredFlags),
});

export type WithFlagsProps = {
  flags: FlagsObject;
};

// FIXME: Andrew Ballantyne is trying to see if there is a way to do this
// that avoids typing with any.
export type ConnectToFlags = <P extends WithFlagsProps>(
  ...flags: (FLAGS | string)[]
) => (C: React.ComponentType<P>) => any;

export const connectToFlags: ConnectToFlags = (...flags) =>
  connect((state: RootState) => stateToProps(state.FLAGS, flags), null, null, {
    areStatePropsEqual: _.isEqual,
  });
