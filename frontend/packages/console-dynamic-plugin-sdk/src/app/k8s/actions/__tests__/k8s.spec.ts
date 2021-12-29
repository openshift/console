import * as _ from 'lodash';
import { K8sModel } from '../../../../api/common-types';
import * as k8sResource from '../../../../utils/k8s/k8s-resource';
import * as sdkK8sActions from '../k8s';
import Spy = jasmine.Spy;

const PodModel: K8sModel = {
  apiVersion: 'v1',
  label: 'Pod',
  labelKey: 'public~Pod',
  plural: 'pods',
  abbr: 'P',
  namespaced: true,
  kind: 'Pod',
  id: 'pod',
  labelPlural: 'Pods',
  labelPluralKey: 'public~Pods',
};

const testResourceInstance = {
  apiVersion: 'testapp.coreos.com/v1alpha1',
  kind: 'TestResource',
  metadata: {
    name: 'my-test-resource',
    namespace: 'default',
    uid: 'c02c0a8f-88e0-12e7-851b-081027b424ef',
    creationTimestamp: '2017-06-20T18:19:49Z',
  },
  spec: {
    selector: {
      matchLabels: {
        fizz: 'buzz',
      },
    },
  },
  status: {
    'some-filled-path': 'this is filled!',
  },
};

describe(sdkK8sActions.ActionType.StartWatchK8sList, () => {
  let getState: Spy;
  let resourceList: {
    items: any[];
    metadata: { resourceVersion: string; continue?: string };
    kind: string;
    apiVersion: string;
  };
  let model: K8sModel;

  beforeEach(() => {
    getState = jasmine.createSpy('getState').and.returnValue({ sdkCore: {} });
    model = _.cloneDeep({ ...PodModel, verbs: ['list', 'get'] });
    resourceList = {
      apiVersion: testResourceInstance.apiVersion,
      kind: `${testResourceInstance.kind}List`,
      items: new Array(300).fill(testResourceInstance),
      metadata: { resourceVersion: '0' },
    };
  });

  it('dispatches `loaded` action only once after first data is received', (done) => {
    const k8sList = spyOn(k8sResource, 'k8sList').and.returnValue(
      Promise.resolve({ ...resourceList, items: new Array(10).fill(testResourceInstance) }),
    );

    const dispatch = jasmine.createSpy('dispatch').and.callFake((action) => {
      if (action.type === sdkK8sActions.ActionType.Loaded) {
        expect(k8sList.calls.count()).toEqual(1);
        done();
      } else if (action.type !== sdkK8sActions.ActionType.StartWatchK8sList) {
        fail(`Action other than 'loaded' was dispatched: ${JSON.stringify(action)}`);
      }
    });

    sdkK8sActions.watchK8sList('some-redux-id', {}, model)(dispatch, getState);
  });

  it('incrementally fetches list until `continue` token is no longer returned in response', (done) => {
    const k8sList = spyOn(k8sResource, 'k8sList').and.callFake((k8sKind, params) => {
      expect(params.limit).toEqual(250);

      if (k8sList.calls.count() === 1 || k8sList.calls.count() === 11) {
        expect(params.continue).toBeUndefined();
      } else {
        expect(params.continue).toEqual('toNextPage');
      }
      resourceList.metadata.resourceVersion = (
        parseInt(resourceList.metadata.resourceVersion, 10) + 1
      ).toString();
      resourceList.metadata.continue =
        parseInt(resourceList.metadata.resourceVersion, 10) < 10 ? 'toNextPage' : undefined;

      return resourceList;
    });

    let returnedItems = 0;
    const dispatch = jasmine.createSpy('dispatch').and.callFake((action) => {
      if (action.type === sdkK8sActions.ActionType.BulkAddToList) {
        const bulkAddToListCalls = dispatch.calls
          .allArgs()
          .filter((args) => args[0].type === sdkK8sActions.ActionType.BulkAddToList);

        expect(action.payload.k8sObjects).toEqual(resourceList.items);
        expect(bulkAddToListCalls.length).toEqual(k8sList.calls.count() - 1);

        returnedItems += action.payload.k8sObjects.length;

        if (bulkAddToListCalls.length === 9) {
          expect(returnedItems).toEqual(resourceList.items.length * bulkAddToListCalls.length);
          done();
        }
      } else if (action.type === sdkK8sActions.ActionType.Errored) {
        fail(action.payload.k8sObjects);
      }
    });

    sdkK8sActions.watchK8sList('another-redux-id', {}, model)(dispatch, getState);
  });

  it('send partial metadata headers to k8sList when partialMetadata is true', (done) => {
    const k8sList = spyOn(k8sResource, 'k8sList').and.callFake(
      (k8sKind, params, raw, requestOptions) => {
        expect(params.limit).toEqual(250);
        expect(requestOptions.headers).toEqual(sdkK8sActions.partialObjectMetadataListHeader);

        if (k8sList.calls.count() === 1 || k8sList.calls.count() === 11) {
          expect(params.continue).toBeUndefined();
        } else {
          expect(params.continue).toEqual('toNextPage');
        }
        resourceList.metadata.resourceVersion = (
          parseInt(resourceList.metadata.resourceVersion, 10) + 1
        ).toString();
        resourceList.metadata.continue =
          parseInt(resourceList.metadata.resourceVersion, 10) < 10 ? 'toNextPage' : undefined;

        return resourceList;
      },
    );

    let returnedItems = 0;
    const dispatch = jasmine.createSpy('dispatch').and.callFake((action) => {
      if (action.type === sdkK8sActions.ActionType.BulkAddToList) {
        const bulkAddToListCalls = dispatch.calls
          .allArgs()
          .filter((args) => args[0].type === sdkK8sActions.ActionType.BulkAddToList);

        expect(action.payload.k8sObjects).toEqual(resourceList.items);
        expect(bulkAddToListCalls.length).toEqual(k8sList.calls.count() - 1);

        returnedItems += action.payload.k8sObjects.length;

        if (bulkAddToListCalls.length === 9) {
          expect(returnedItems).toEqual(resourceList.items.length * bulkAddToListCalls.length);
          done();
        }
      } else if (action.type === sdkK8sActions.ActionType.Errored) {
        fail(action.payload.k8sObjects);
      }
    });

    sdkK8sActions.watchK8sList('one-more-redux-id', {}, model, null, true)(dispatch, getState);
  });
});
