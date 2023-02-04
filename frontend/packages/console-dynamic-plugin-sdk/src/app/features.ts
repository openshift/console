import { Map as ImmutableMap } from 'immutable';

export type FeatureState = ImmutableMap<string, boolean>;

export type FeatureSubStore = {
  FLAGS: FeatureState;
};
