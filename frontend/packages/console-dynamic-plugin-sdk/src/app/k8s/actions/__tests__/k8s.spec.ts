import * as _ from 'lodash';
import type { K8sModel } from '../../../../api/common-types';
import { k8sList } from '../../../../utils/k8s/k8s-resource';
import * as sdkK8sActions from '../k8s';

jest.mock('../../../../utils/k8s/k8s-resource', () => ({
  ...jest.requireActual('../../../../utils/k8s/k8s-resource'),
  k8sList: jest.fn(),
}));

const k8sListMock = k8sList as jest.Mock;

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

describe('startWatchK8sList', () => {
  let getState: jest.Mock;
  let resourceList: {
    items: any[];
    metadata: { resourceVersion: string; continue?: string };
    kind: string;
    apiVersion: string;
  };
  let model: K8sModel;

  beforeEach(() => {
    jest.clearAllMocks();
    getState = jest.fn().mockReturnValue({ sdkCore: {} });
    model = _.cloneDeep({ ...PodModel, verbs: ['list', 'get'] });
    resourceList = {
      apiVersion: testResourceInstance.apiVersion,
      kind: `${testResourceInstance.kind}List`,
      items: new Array(300).fill(testResourceInstance),
      metadata: { resourceVersion: '0' },
    };
  });

  it('dispatches `loaded` action only once after first data is received', async () => {
    k8sListMock.mockResolvedValue({
      ...resourceList,
      items: new Array(10).fill(testResourceInstance),
    });

    const dispatch = jest.fn();
    await sdkK8sActions.watchK8sList('some-redux-id', {}, model)(dispatch, getState);

    expect(k8sListMock.mock.calls.length).toEqual(1);

    const dispatchedTypes = dispatch.mock.calls.map((args) => args[0].type);
    const unexpectedTypes = dispatchedTypes.filter(
      (type) =>
        type !== sdkK8sActions.ActionType.StartWatchK8sList &&
        type !== sdkK8sActions.ActionType.Loaded,
    );
    expect(unexpectedTypes).toEqual([]);
    expect(dispatchedTypes).toContain(sdkK8sActions.ActionType.Loaded);
  });

  it('incrementally fetches list until `continue` token is no longer returned in response', async () => {
    k8sListMock.mockImplementation(() => {
      resourceList.metadata.resourceVersion = (
        parseInt(resourceList.metadata.resourceVersion, 10) + 1
      ).toString();
      resourceList.metadata.continue =
        parseInt(resourceList.metadata.resourceVersion, 10) < 10 ? 'toNextPage' : undefined;
      return resourceList;
    });

    const dispatch = jest.fn();
    await sdkK8sActions.watchK8sList('another-redux-id', {}, model)(dispatch, getState);

    // Verify all k8sList calls have limit=250
    expect(k8sListMock).toHaveBeenCalledTimes(10);
    for (const args of k8sListMock.mock.calls) {
      expect(args[1].limit).toEqual(250);
    }

    // First call should not have continue token
    expect(k8sListMock.mock.calls[0][1].continue).toBeUndefined();
    // Remaining calls should have continue token
    for (let i = 1; i < k8sListMock.mock.calls.length; i++) {
      expect(k8sListMock.mock.calls[i][1].continue).toEqual('toNextPage');
    }

    // Verify dispatch calls
    const bulkAddCalls = dispatch.mock.calls.filter(
      (args) => args[0].type === sdkK8sActions.ActionType.BulkAddToList,
    );
    const erroredCalls = dispatch.mock.calls.filter(
      (args) => args[0].type === sdkK8sActions.ActionType.Errored,
    );

    expect(erroredCalls).toHaveLength(0);
    expect(bulkAddCalls).toHaveLength(9);

    for (const call of bulkAddCalls) {
      expect(call[0].payload.k8sObjects).toEqual(resourceList.items);
    }

    const totalItems = bulkAddCalls.reduce(
      (sum, call) => sum + call[0].payload.k8sObjects.length,
      0,
    );
    expect(totalItems).toEqual(resourceList.items.length * 9);
  });

  it('send partial metadata headers to k8sList when partialMetadata is true', async () => {
    k8sListMock.mockImplementation(() => {
      resourceList.metadata.resourceVersion = (
        parseInt(resourceList.metadata.resourceVersion, 10) + 1
      ).toString();
      resourceList.metadata.continue =
        parseInt(resourceList.metadata.resourceVersion, 10) < 10 ? 'toNextPage' : undefined;
      return resourceList;
    });

    const dispatch = jest.fn();
    await sdkK8sActions.watchK8sList(
      'one-more-redux-id',
      {},
      model,
      null,
      true,
    )(dispatch, getState);

    // Verify all k8sList calls have limit=250 and partial metadata headers
    expect(k8sListMock).toHaveBeenCalledTimes(10);
    for (const args of k8sListMock.mock.calls) {
      expect(args[1].limit).toEqual(250);
      expect(args[3].headers).toEqual(sdkK8sActions.partialObjectMetadataListHeader);
    }

    // First call should not have continue token
    expect(k8sListMock.mock.calls[0][1].continue).toBeUndefined();
    // Remaining calls should have continue token
    for (let i = 1; i < k8sListMock.mock.calls.length; i++) {
      expect(k8sListMock.mock.calls[i][1].continue).toEqual('toNextPage');
    }

    // Verify dispatch calls
    const bulkAddCalls = dispatch.mock.calls.filter(
      (args) => args[0].type === sdkK8sActions.ActionType.BulkAddToList,
    );
    const erroredCalls = dispatch.mock.calls.filter(
      (args) => args[0].type === sdkK8sActions.ActionType.Errored,
    );

    expect(erroredCalls).toHaveLength(0);
    expect(bulkAddCalls).toHaveLength(9);

    for (const call of bulkAddCalls) {
      expect(call[0].payload.k8sObjects).toEqual(resourceList.items);
    }

    const totalItems = bulkAddCalls.reduce(
      (sum, call) => sum + call[0].payload.k8sObjects.length,
      0,
    );
    expect(totalItems).toEqual(resourceList.items.length * 9);
  });
});
