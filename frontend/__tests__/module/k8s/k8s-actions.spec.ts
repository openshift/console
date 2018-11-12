/* eslint-disable no-undef, no-unused-vars */

import Spy = jasmine.Spy;
import { Map as ImmutableMap } from 'immutable';

import k8sActions, { types } from '../../../public/module/k8s/k8s-actions';
import * as k8sResource from '../../../public/module/k8s/resource';
import { K8sResourceKind } from '../../../public/module/k8s';
import { PodModel, APIServiceModel } from '../../../public/models';
import { testResourceInstance } from '../../../__mocks__/k8sResourcesMocks';
import * as coFetch from '../../../public/co-fetch';

describe('watchAPIServices', () => {
  const {watchAPIServices} = k8sActions;

  it('does nothing if already watching `APIServices`', () => {
    const getState = jasmine.createSpy('getState').and.returnValue({k8s: ImmutableMap().set('apiservices', [])});
    const dispatch = jasmine.createSpy('dispatch').and.callFake(() => {
      fail('Should not call `dispatch`');
    });

    watchAPIServices()(dispatch, getState);
  });

  it('attempts to list `APIServices`', (done) => {
    const getState = jasmine.createSpy('getState').and.returnValue({k8s: ImmutableMap()});
    const dispatch = jasmine.createSpy('dispatch');
    spyOn(k8sActions, 'watchK8sList').and.returnValue({});

    spyOn(k8sResource, 'k8sList').and.callFake((model) => new Promise(() => {
      expect(model).toEqual(APIServiceModel);
      done();
    }));

    watchAPIServices()(dispatch, getState);
  });

  it('falls back to polling Kubernetes `/apis` endpoint if cannot list `APIServices`', (done) => {
    const getState = jasmine.createSpy('getState').and.returnValue({k8s: ImmutableMap()});
    const dispatch = jasmine.createSpy('dispatch');
    spyOn(k8sActions, 'watchK8sList').and.returnValue({});
    spyOn(k8sResource, 'k8sList').and.returnValue(Promise.reject());
    spyOn(coFetch, 'coFetchJSON').and.callFake((path) => {
      expect(path).toEqual('api/kubernetes/apis');
      done();
    });

    watchAPIServices()(dispatch, getState);
  });
});

describe(types.watchK8sList, () => {
  const {watchK8sList} = k8sActions;
  const id = 'some-redux-id';
  let k8sList: Spy;
  let websocket: {[method: string]: Spy};
  let resourceList: {items: K8sResourceKind[], metadata: {resourceVersion: string, continue?: string}, kind: string, apiVersion: string};

  beforeEach(() => {
    websocket = {
      onclose: jasmine.createSpy('onclose'),
      ondestroy: jasmine.createSpy('ondestroy'),
      onbulkmessage: jasmine.createSpy('onbulkmessage'),
    };
    websocket.onclose.and.returnValue(websocket);
    websocket.ondestroy.and.returnValue(websocket);
    websocket.onbulkmessage.and.returnValue(websocket);

    resourceList = {
      apiVersion: testResourceInstance.apiVersion,
      kind: `${testResourceInstance.kind}List`,
      items: new Array(300).fill(testResourceInstance),
      metadata: {resourceVersion: '10000000'},
    };

    k8sList = spyOn(k8sResource, 'k8sList').and.returnValue(Promise.resolve({}));
    spyOn(k8sResource, 'k8sWatch').and.returnValue(websocket);
  });

  it('incrementally fetches lists until `continue` token is no longer returned in response', (done) => {
    k8sList.and.callFake((k8sKind, params, raw) => {
      expect(params.limit).toEqual(250);
      if (k8sList.calls.count() > 1) {
        expect(params.continue).toEqual('toNextPage');
      }

      resourceList.metadata.resourceVersion = (parseInt(resourceList.metadata.resourceVersion, 10) + 1).toString();
      resourceList.metadata.continue = parseInt(resourceList.metadata.resourceVersion, 10) > 10000005 ? null : 'toNextPage';
      return resourceList;
    });

    const dispatch = jasmine.createSpy('dispatch').and.callFake((action) => {
      switch (action.type) {
        case types.watchK8sList:
          expect(action.id).toEqual(id);
          expect(action.query).toEqual({});
          break;
        case types.bulkAddToList:
          expect(action.k8sObjects).toEqual(resourceList.items);
          expect(dispatch.calls.allArgs().filter(args => args[0].type === types.bulkAddToList).length).toEqual(k8sList.calls.count());
          break;
        case types.errored:
          fail(action.k8sObjects);
          break;
        case types.loaded:
          expect(k8sList.calls.count()).toEqual(1);
          done();
          break;
        default:
          break;
      }
    });

    watchK8sList(id, {}, PodModel)(dispatch, jasmine.createSpy('getState'));
  });

  xit('stops incrementally fetching if `stopK8sWatch` action is dispatched', () => {
    // TODO(alecmerdler)
  });
});
