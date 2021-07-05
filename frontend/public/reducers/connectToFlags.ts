import { connect } from 'react-redux';
import * as _ from 'lodash-es';
import { FLAGS } from '@console/dynamic-plugin-sdk/src/shared/constants';
import { RootState } from '../redux';
import { featureReducerName, FeatureState } from './features';

export const stateToFlagsObject = (state: FeatureState, desiredFlags: string[]): FlagsObject =>
  desiredFlags.reduce((allFlags, f) => ({ ...allFlags, [f]: state.get(f) }), {} as FlagsObject);

const stateToProps = (state: FeatureState, desiredFlags: string[]): WithFlagsProps => ({
  flags: stateToFlagsObject(state, desiredFlags),
});

export const getFlagsObject = ({ [featureReducerName]: featureState }: RootState): FlagsObject =>
  featureState.toObject();

export type FlagsObject = { [key: string]: boolean };

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
  connect((state: RootState) => stateToProps(state[featureReducerName], flags), null, null, {
    areStatePropsEqual: _.isEqual,
  });

// Flag detection is not complete if the flag's value is `undefined`.
export const flagPending = (flag: boolean) => flag === undefined;
