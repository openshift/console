/* eslint-disable no-undef, no-unused-vars */

import Spy = jasmine.Spy;
import { Map as ImmutableMap } from 'immutable';
import * as _ from 'lodash-es';

import k8sActions, { types } from '../../../public/module/k8s/k8s-actions';
import * as k8sResource from '../../../public/module/k8s/resource';
import { K8sResourceKind, K8sKind } from '../../../public/module/k8s';
import { PodModel, APIServiceModel } from '../../../public/models';
import { testResourceInstance } from '../../../__mocks__/k8sResourcesMocks';
import * as coFetch from '../../../public/co-fetch';

describe('watchAPIServices', () => {
  const {watchAPIServices} = k8sActions;

  const spyAndExpect = (spy: Spy) => (returnValue: any) => new Promise(resolve => spy.and.callFake((...args) => {
    resolve(args);
    return returnValue;
  }));

  it('does nothing if already watching `APIServices`', (done) => {
    const getState = jasmine.createSpy('getState').and.returnValue({k8s: ImmutableMap().set('apiservices', [])});
    const dispatch = jasmine.createSpy('dispatch').and.callFake((action) => {
      fail(`Should not dispatch action: ${JSON.stringify(action)}`);
    });

    watchAPIServices()(dispatch, getState);
    done();
  });

  it('dispatches `getResourcesInFlight` action before listing `APIServices`', (done) => {
    const getState = jasmine.createSpy('getState').and.returnValue({k8s: ImmutableMap()});
    const dispatch = jasmine.createSpy('dispatch');
    spyOn(k8sActions, 'watchK8sList').and.returnValue({});

    spyAndExpect(spyOn(k8sResource, 'k8sList'))(Promise.resolve({}))
      .then(() => {
        expect(dispatch.calls.argsFor(0)[0].type).toEqual(types.getResourcesInFlight);
        done();
      });

    watchAPIServices()(dispatch, getState);
  });

  it('attempts to list `APIServices`', (done) => {
    const getState = jasmine.createSpy('getState').and.returnValue({k8s: ImmutableMap()});
    const dispatch = jasmine.createSpy('dispatch');
    spyOn(k8sActions, 'watchK8sList');

    spyAndExpect(spyOn(k8sResource, 'k8sList'))(Promise.resolve({}))
      .then(([model]) => {
        expect(model).toEqual(APIServiceModel);
        done();
      });

    watchAPIServices()(dispatch, getState);
  });

  it('falls back to polling Kubernetes `/apis` endpoint if cannot list `APIServices`', (done) => {
    const getState = jasmine.createSpy('getState').and.returnValue({k8s: ImmutableMap()});
    const dispatch = jasmine.createSpy('dispatch');
    spyOn(k8sResource, 'k8sList').and.returnValue(Promise.reject());

    spyAndExpect(spyOn(coFetch, 'coFetchJSON'))(Promise.resolve({groups: []}))
      .then(([path]) => {
        expect(path).toEqual('api/kubernetes/apis');
        done();
      });

    watchAPIServices()(dispatch, getState);
  });
});

describe(types.watchK8sList, () => {
  const {watchK8sList} = k8sActions;
  let getState: Spy;
  let resourceList: {items: K8sResourceKind[], metadata: {resourceVersion: string, continue?: string}, kind: string, apiVersion: string};
  let model: K8sKind;

  beforeEach(() => {
    getState = jasmine.createSpy('getState').and.returnValue({UI: ImmutableMap()});
    model = _.cloneDeep({...PodModel, verbs: ['list', 'get']});
    resourceList = {
      apiVersion: testResourceInstance.apiVersion,
      kind: `${testResourceInstance.kind}List`,
      items: new Array(300).fill(testResourceInstance),
      metadata: {resourceVersion: '0'},
    };
  });

  it('dispatches `loaded` action only once after first data is received', (done) => {
    const k8sList = spyOn(k8sResource, 'k8sList').and.returnValue(Promise.resolve({...resourceList, items: new Array(10).fill(testResourceInstance)}));

    const dispatch = jasmine.createSpy('dispatch').and.callFake((action) => {
      if (action.type === types.loaded) {
        expect(k8sList.calls.count()).toEqual(1);
        done();
      } else if (action.type !== types.watchK8sList) {
        fail(`Action other than 'loaded' was dispatched: ${JSON.stringify(action)}`);
      }
    });

    watchK8sList('some-redux-id', {}, model)(dispatch, getState);
  });

  it('incrementally fetches list until `continue` token is no longer returned in response', (done) => {
    const k8sList = spyOn(k8sResource, 'k8sList').and.callFake((k8sKind, params) => {
      expect(params.limit).toEqual(250);

      if (k8sList.calls.count() === 1 || k8sList.calls.count() === 11) {
        expect(params.continue).toBeUndefined();
      } else {
        expect(params.continue).toEqual('toNextPage');
      }
      resourceList.metadata.resourceVersion = (parseInt(resourceList.metadata.resourceVersion, 10) + 1).toString();
      resourceList.metadata.continue = parseInt(resourceList.metadata.resourceVersion, 10) < 10 ? 'toNextPage' : undefined;

      return resourceList;
    });

    let returnedItems = 0;
    const dispatch = jasmine.createSpy('dispatch').and.callFake((action) => {
      if (action.type === types.bulkAddToList) {
        const bulkAddToListCalls = dispatch.calls.allArgs().filter(args => args[0].type === types.bulkAddToList);

        expect(action.k8sObjects).toEqual(resourceList.items);
        expect(bulkAddToListCalls.length).toEqual(k8sList.calls.count() - 1);

        returnedItems = returnedItems + action.k8sObjects.length;

        if (bulkAddToListCalls.length === 9) {
          expect(returnedItems).toEqual(resourceList.items.length * bulkAddToListCalls.length);
          done();
        }
      } else if (action.type === types.errored) {
        fail(action.k8sObjects);
      }
    });

    watchK8sList('another-redux-id', {}, model)(dispatch, getState);
  });

  xit('stops incrementally fetching if `stopK8sWatch` action is dispatched', () => {
    // TODO(alecmerdler)
  });
});
