/* eslint-disable no-undef */

import store from '../public/redux';
import * as Immutable from 'immutable';

import { FLAGS, featureReducer, CRDS_ } from '../public/features';
import { k8sBasePath } from '../public/module/k8s';
import * as coFetch from '../public/co-fetch';

import { getCRDs } from '../public/kinds';

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
        items: [
          {metadata: { name: 'clusterserviceversion-v1s.app.coreos.com'}}
        ],
      };
      spyOn(store, 'getState').and.returnValue({UI: Immutable.Map()});
    });

    xit('detects cloud services and updates Redux store', (done) => {
      coFetchSpy = spyOn(coFetch, 'coFetchJSON').and.returnValue(Promise.resolve(apiResourceList));

      getCRDs(dispatchMock).then(() => {
        expect(coFetchSpy.calls.argsFor(0)[0]).toEqual(`${k8sBasePath}/apis/apiextensions.k8s.io/v1beta1/customresourcedefinitions`);
        expect(dispatchMock.calls.argsFor(1)[0]).toEqual({kinds: [{metadata: {name: 'clusterserviceversion-v1s.app.coreos.com'}}], type: 'addCRDs'});
        done();
      });
    });
  });
});

describe('featureReducer', () => {
  const defaults: {[name: string]: any} = {
    [FLAGS.AUTH_ENABLED]: !((window as any).SERVER_FLAGS.authDisabled),
    [FLAGS.CLUSTER_UPDATES]: undefined,
    [FLAGS.PROMETHEUS]: undefined,
    [FLAGS.MULTI_CLUSTER]: undefined,
    [FLAGS.SECURITY_LABELLER]: undefined,
    [FLAGS.CLOUD_SERVICES]: undefined,
    [FLAGS.CLOUD_CATALOGS]: undefined,
    [FLAGS.CALICO]: undefined,
    [FLAGS.CHARGEBACK]: undefined,
  };

  it('returns default values if state is uninitialized', () => {
    const newState = featureReducer(null, null);

    expect(newState).toEqual(Immutable.Map(defaults));
  });

  it('returns updated state with new flags if `SET_FLAG` action', () => {
    const action = {type: 'SET_FLAG', flag: FLAGS.CLOUD_SERVICES, value:'clusterserviceversions'};
    const initialState = Immutable.Map(defaults);
    const newState = featureReducer(initialState, action);

    expect(newState).toEqual(initialState.merge({[action.flag]: action.value}));
  });

  it('returns state if not `SET_FLAG` action', () => {
    const action = {type: 'OTHER_ACTION'};
    const initialState = Immutable.Map(defaults);
    const newState = featureReducer(initialState, action);

    expect(newState).toEqual(initialState);
  });

  it('set flags when it gets CRDs', () => {
    const name = 'a.b.c';
    const flag = 'flag';
    const kinds = [ {metadata:{name}}, {metadata: {name: 'some.other.crd'}} ];

    CRDS_[name] = flag;
    const action = {type: 'addCRDs', kinds};

    const initialState = Immutable.Map(defaults);
    const newState = featureReducer(initialState, action);

    expect(newState).toEqual(initialState.merge({
      [FLAGS.CLUSTER_UPDATES]: false,
      [FLAGS.PROMETHEUS]: false,
      [FLAGS.MULTI_CLUSTER]: false,
      [FLAGS.CLOUD_SERVICES]: false,
      [FLAGS.CLOUD_CATALOGS]: false,
      [FLAGS.CHARGEBACK]: false,
      [flag]: true,
    }));
  });
});
