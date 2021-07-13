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

export type ConnectToFlags = <P extends WithFlagsProps>(
  ...flags: (FLAGS | string)[]
) => (
  C: React.ComponentType<P>,
) => React.ComponentType<Omit<P, keyof WithFlagsProps>> & {
  WrappedComponent: React.ComponentType<P>;
};

export const connectToFlags: ConnectToFlags = (...flags) =>
  connect((state: RootState) => stateToProps(state.FLAGS, flags), null, null, {
    areStatePropsEqual: _.isEqual,
  });
