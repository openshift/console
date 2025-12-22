import { connect } from 'react-redux';
import * as _ from 'lodash-es';
import { createSelector } from 'reselect';
import { FLAGS } from '@console/shared/src/constants';
import type { RootState } from '../redux';
import { FeatureState, FlagsObject } from './features';

export const stateToFlagsObject = (state: FeatureState, desiredFlags: string[]): FlagsObject =>
  desiredFlags.reduce((allFlags, f) => ({ ...allFlags, [f]: state.get(f) }), {} as FlagsObject);

export type WithFlagsProps = {
  flags: FlagsObject;
};

export type ConnectToFlags = <P extends WithFlagsProps>(
  ...flags: (FLAGS | string)[]
) => (component: React.ComponentType<P>) => React.ComponentType<Omit<P, keyof WithFlagsProps>>;

// Cache selectors by flag combinations to avoid recreating them
const selectorCache = new Map<string, ReturnType<typeof createSelector>>();

const getFlagsSelector = (flags: string[]) => {
  const key = flags.join(',');
  let selector = selectorCache.get(key);

  if (!selector) {
    // Create individual selectors for each flag to maximize memoization
    const flagSelectors = flags.map((flag) => (state: RootState) => state.FLAGS.get(flag));

    selector = createSelector(flagSelectors, (...flagValues) => {
      // Only create a new object when flag values actually change
      // createSelector will handle the memoization and reference equality checks
      const flagsObj: FlagsObject = {};
      flags.forEach((flag, index) => {
        flagsObj[flag] = flagValues[index];
      });
      return { flags: flagsObj };
    });
    selectorCache.set(key, selector);
  }

  return selector;
};

export const connectToFlags: ConnectToFlags = (...flags) => {
  // Create a memoized selector for this specific set of flags
  const selector = getFlagsSelector(flags);

  return connect(selector, null, null, {
    // Still use deep equality as a safety net, but the selector should prevent
    // creating new objects when flag values haven't changed
    areStatePropsEqual: _.isEqual,
  }) as any; // Type assertion needed due to complex connect() return types
};
