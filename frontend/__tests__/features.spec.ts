/* eslint-disable no-undef */

import store from '../public/redux';
import * as Immutable from 'immutable';

import { FLAGS, featureActions, featureReducer } from '../public/features';
import { k8sBasePath } from '../public/module/k8s';
import * as coFetch from '../public/co-fetch';

describe('featureActions', () => {
  let dispatchMock: jasmine.Spy;
  let coFetchSpy: jasmine.Spy;

  beforeEach(() => {
    dispatchMock = jasmine.createSpy('dispatchSpy').and.returnValue(null);
  });

  describe('detectCloudServicesFlags', () => {
    let apiResourceList: {[key: string]: any};

    beforeEach(() => {
      apiResourceList = {
        resources: [{
          name: 'apptype-v1s'}
        ],
      };
      spyOn(store, 'getState').and.returnValue({UI: new Map()});
    });

    it('detects cloud services and updates Redux store', (done) => {
      coFetchSpy = spyOn(coFetch, 'coFetchJSON').and.returnValue(Promise.resolve(apiResourceList));

      featureActions.detectCloudServicesFlags(dispatchMock).then(() => {
        expect(coFetchSpy.calls.argsFor(0)[0]).toEqual(`${k8sBasePath}/apis/app.coreos.com/v1alpha1`);
        expect(dispatchMock.calls.argsFor(0)[0]).toEqual({flags: {[FLAGS.CLOUD_SERVICES]: {name: 'apptype-v1s'}}, type: 'SET_FLAGS'});
        done();
      });
    });

    it('handles errors', (done) => {
      coFetchSpy = spyOn(coFetch, 'coFetchJSON').and.returnValue(Promise.reject('some nasty error'));
      const handleErrSpy = spyOn(featureActions, 'handleError').and.returnValue(done());

      featureActions.detectCloudServicesFlags(dispatchMock).then().catch(() => {
        expect(handleErrSpy).toHaveBeenCalled();
      });
    });
  });
});

describe('featureReducer', () => {
  const defaults: {[name: string]: any} = {
    [FLAGS.AUTH_ENABLED]: !((window as any).SERVER_FLAGS.authDisabled),
    [FLAGS.CLUSTER_UPDATES]: undefined,
    [FLAGS.ETCD_OPERATOR]: undefined,
    [FLAGS.PROMETHEUS]: undefined,
    [FLAGS.MULTI_CLUSTER]: undefined,
    [FLAGS.SECURITY_LABELLER]: undefined,
    [FLAGS.CLOUD_SERVICES]: undefined,
    [FLAGS.CALICO]: undefined,
  };

  it('returns default values if state is uninitialized', () => {
    const newState = featureReducer(null, null);

    expect(newState).toEqual(Immutable.Map(defaults));
  });

  it('returns updated state with new flags if `SET_FLAGS` action', () => {
    const action = {type: 'SET_FLAGS', flags: {[FLAGS.CLOUD_SERVICES]: {name: 'apptypes'}}};
    const initialState = Immutable.Map(defaults);
    const newState = featureReducer(initialState, action);

    expect(newState).toEqual(initialState.merge(action.flags));
  });

  it('returns state if not `SET_FLAGS` action', () => {
    const action = {type: 'OTHER_ACTION'};
    const initialState = Immutable.Map(defaults);
    const newState = featureReducer(initialState, action);

    expect(newState).toEqual(initialState);
  });
});
