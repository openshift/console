/* eslint-disable no-undef */

import * as Immutable from 'immutable';

import { FLAGS, featureReducer, DEFAULTS_ } from '../public/features';
import { types } from '../public/module/k8s/k8s-actions';
import { ClusterServiceVersionModel } from '../public/models';

describe('featureReducer', () => {

  it('returns default values if state is uninitialized', () => {
    const newState = featureReducer(null, null);

    expect(newState).toEqual(Immutable.Map(DEFAULTS_));
  });

  it('returns updated state with new flags if `SET_FLAG` action', () => {
    const action = {type: 'SET_FLAG', flag: FLAGS.CLOUD_SERVICES, value: true};
    const initialState = Immutable.Map(DEFAULTS_);
    const newState = featureReducer(initialState, action);

    expect(newState).toEqual(initialState.merge({[action.flag]: action.value}));
  });

  it('returns state if not `SET_FLAG` action', () => {
    const action = {type: 'OTHER_ACTION'};
    const initialState = Immutable.Map(DEFAULTS_);
    const newState = featureReducer(initialState, action);

    expect(newState).toEqual(initialState);
  });

  it('set flags when it gets CRDs', () => {
    const action = {type: types.resources, resources: {models: [ClusterServiceVersionModel]}};
    const initialState = Immutable.Map(DEFAULTS_);
    const newState = featureReducer(initialState, action);

    expect(newState).toEqual(initialState.merge({
      [FLAGS.CLUSTER_UPDATES]: false,
      [FLAGS.PROMETHEUS]: false,
      [FLAGS.MULTI_CLUSTER]: false,
      [FLAGS.CHARGEBACK]: false,
    }));
  });
});
