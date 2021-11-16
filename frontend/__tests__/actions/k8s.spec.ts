import Spy = jasmine.Spy;
import { Map as ImmutableMap } from 'immutable';
import * as _ from 'lodash-es';

import * as k8sActions from '../../public/actions/k8s';
import * as k8sResource from '../../public/module/k8s';
import { K8sResourceKind, K8sKind } from '../../public/module/k8s';
import { PodModel, CustomResourceDefinitionModel } from '../../public/models';
import { testResourceInstance } from '../../__mocks__/k8sResourcesMocks';
import { makeReduxID } from '../../public/components/utils';

jest.mock('@console/internal/components/utils/rbac', () => ({
  checkAccess: jest
    .fn()
    .mockReturnValueOnce(Promise.resolve({ status: { allowed: false } }))
    .mockReturnValue(Promise.resolve({ status: { allowed: true } })),
}));

describe('startAPIDiscovery', () => {
  it('falls back to polling if user cannot list CRDs', async () => {
    const dispatch = jest.fn();
    jest.useFakeTimers();
    jest.spyOn(console, 'log');
    jest.spyOn(k8sActions, 'getResources').mockImplementation(() => {});
    await k8sActions.startAPIDiscovery()(dispatch);
    expect(k8sActions.getResources).toHaveBeenCalledTimes(1);
    expect(window.setTimeout).toHaveBeenCalledTimes(1);
    expect(window.setTimeout).toHaveBeenCalledWith(
      expect.any(Function),
      k8sActions.API_DISCOVERY_POLL_INTERVAL,
    );
    // eslint-disable-next-line no-console
    expect(console.log).toHaveBeenLastCalledWith('API discovery method: Polling');
  });

  it('uses watchK8sList when user can list CRDs', async () => {
    const crdReduxID = makeReduxID(CustomResourceDefinitionModel, {});
    const dispatch = jest.fn();
    jest.spyOn(console, 'log');
    jest.spyOn(k8sActions, 'watchK8sList').mockImplementation(() => {});
    await k8sActions.startAPIDiscovery()(dispatch);
    expect(k8sActions.watchK8sList).toHaveBeenCalledTimes(1);
    expect(k8sActions.watchK8sList).toHaveBeenCalledWith(
      crdReduxID,
      {},
      CustomResourceDefinitionModel,
      expect.any(Function),
    );
    // eslint-disable-next-line no-console
    expect(console.log).toHaveBeenLastCalledWith('API discovery method: Watching');
  });
});

describe(k8sActions.ActionType.StartWatchK8sList, () => {
  const { watchK8sList } = k8sActions;
  let getState: Spy;
  let resourceList: {
    items: K8sResourceKind[];
    metadata: { resourceVersion: string; continue?: string };
    kind: string;
    apiVersion: string;
  };
  let model: K8sKind;

  beforeEach(() => {
    getState = jasmine.createSpy('getState').and.returnValue({ UI: ImmutableMap() });
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
      if (action.type === k8sActions.ActionType.Loaded) {
        expect(k8sList.calls.count()).toEqual(1);
        done();
      } else if (action.type !== k8sActions.ActionType.StartWatchK8sList) {
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
      resourceList.metadata.resourceVersion = (
        parseInt(resourceList.metadata.resourceVersion, 10) + 1
      ).toString();
      resourceList.metadata.continue =
        parseInt(resourceList.metadata.resourceVersion, 10) < 10 ? 'toNextPage' : undefined;

      return resourceList;
    });

    let returnedItems = 0;
    const dispatch = jasmine.createSpy('dispatch').and.callFake((action) => {
      if (action.type === k8sActions.ActionType.BulkAddToList) {
        const bulkAddToListCalls = dispatch.calls
          .allArgs()
          .filter((args) => args[0].type === k8sActions.ActionType.BulkAddToList);

        expect(action.payload.k8sObjects).toEqual(resourceList.items);
        expect(bulkAddToListCalls.length).toEqual(k8sList.calls.count() - 1);

        returnedItems = returnedItems + action.payload.k8sObjects.length;

        if (bulkAddToListCalls.length === 9) {
          expect(returnedItems).toEqual(resourceList.items.length * bulkAddToListCalls.length);
          done();
        }
      } else if (action.type === k8sActions.ActionType.Errored) {
        fail(action.payload.k8sObjects);
      }
    });

    watchK8sList('another-redux-id', {}, model)(dispatch, getState);
  });

  xit('stops incrementally fetching if `stopK8sWatch` action is dispatched', () => {
    // TODO(alecmerdler)
  });
});
