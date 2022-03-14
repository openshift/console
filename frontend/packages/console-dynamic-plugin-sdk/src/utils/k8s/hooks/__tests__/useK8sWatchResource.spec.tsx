import * as React from 'react';
import { act, cleanup, render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { combineReducers, createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import { receivedResources } from '@console/internal/actions/k8s';
import { SDKReducers } from '../../../../app';
import { WatchK8sResource } from '../../../../extensions/console-types';
import { k8sList, k8sGet } from '../../k8s-resource';
import { setPluginStore, k8sWatch } from '../../k8s-utils';
import { useK8sWatchResource } from '../useK8sWatchResource';
import { PodModel, podData, podList } from './useK8sWatchResource.data';

// Mock network calls
jest.mock('../../k8s-resource', () => ({
  k8sList: jest.fn(() => {}),
  k8sGet: jest.fn(),
}));
jest.mock('../../k8s-utils', () => ({
  ...require.requireActual('../../k8s-utils'),
  k8sWatch: jest.fn(),
}));
const k8sListMock = k8sList as jest.Mock;
const k8sGetMock = k8sGet as jest.Mock;
const k8sWatchMock = k8sWatch as jest.Mock;

// Redux wrapper
let store;
const Wrapper: React.FC = ({ children }) => <Provider store={store}>{children}</Provider>;

// Object under test
const resourceUpdate = jest.fn();
const WatchResource: React.FC<{ initResource: WatchK8sResource }> = ({ initResource }) => {
  resourceUpdate(...useK8sWatchResource(initResource));
  return null;
};

beforeEach(() => {
  // Init k8s redux store with just one model
  setPluginStore({ getExtensionsInUse: () => [] });
  store = createStore(combineReducers(SDKReducers), {}, applyMiddleware(thunk));
  store.dispatch(
    receivedResources({
      models: [PodModel],
      adminResources: [],
      allResources: [],
      configResources: [],
      clusterOperatorConfigResources: [],
      namespacedSet: null,
      safeResources: [],
      groupVersionMap: {},
    }),
  );

  jest.useFakeTimers();
  jest.resetAllMocks();

  k8sListMock.mockReturnValue(Promise.resolve(podList));
  k8sGetMock.mockReturnValue(Promise.resolve(podData));
  const wsMock = {
    onclose: () => wsMock,
    ondestroy: () => wsMock,
    onbulkmessage: () => wsMock,
    destroy: () => wsMock,
  };
  k8sWatchMock.mockReturnValue(wsMock);
});

afterEach(async () => {
  // Ensure that there is no timer left which triggers a rerendering
  await act(async () => jest.runAllTimers());

  cleanup();

  // Ensure that there is no unexpected api calls
  expect(k8sListMock).toHaveBeenCalledTimes(0);
  expect(k8sGetMock).toHaveBeenCalledTimes(0);
  expect(k8sWatchMock).toHaveBeenCalledTimes(0);
  expect(resourceUpdate).toHaveBeenCalledTimes(0);

  jest.clearAllTimers();
  jest.useRealTimers();
});

describe('useK8sWatchResource', () => {
  it('should not fetch any data if watch parameter is null', async () => {
    const initResource: WatchK8sResource = null;
    render(
      <Wrapper>
        <WatchResource initResource={initResource} />
      </Wrapper>,
    );

    expect(resourceUpdate).toHaveBeenCalledTimes(1);
    expect(resourceUpdate.mock.calls[0]).toEqual([undefined, true, undefined]);
    resourceUpdate.mockClear();
  });

  it('should not fetch any data if watch parameter is null also when rerender and unmount', () => {
    const initResource: WatchK8sResource = null;
    const { rerender, unmount } = render(
      <Wrapper>
        <WatchResource initResource={initResource} />
      </Wrapper>,
    );
    rerender(
      <Wrapper>
        <WatchResource initResource={initResource} />
      </Wrapper>,
    );
    unmount();

    expect(resourceUpdate).toHaveBeenCalledTimes(2);
    expect(resourceUpdate.mock.calls[0]).toEqual([undefined, true, undefined]);
    expect(resourceUpdate.mock.calls[1]).toEqual([undefined, true, undefined]);
    resourceUpdate.mockClear();
  });

  it('should return an empty array and fetch data (via list+watch) for a known model (PodModel)', async () => {
    const initResource: WatchK8sResource = {
      kind: 'Pod',
      isList: true,
    };
    render(
      <Wrapper>
        <WatchResource initResource={initResource} />
      </Wrapper>,
    );

    // Get updated after the list call is fetched?
    expect(resourceUpdate).toHaveBeenCalledTimes(2);
    expect(resourceUpdate.mock.calls[0]).toEqual([[], false, undefined]);
    expect(resourceUpdate.mock.calls[1]).toEqual([[], false, '']);

    // Assert API calls
    expect(k8sListMock).toHaveBeenCalledTimes(1);
    expect(k8sListMock.mock.calls[0]).toEqual([
      PodModel,
      { cluster: 'local-cluster', limit: 250 },
      true,
      {},
      'local-cluster',
    ]);
    k8sListMock.mockClear();

    await act(async () => jest.runAllTimers());

    // Assert API calls
    expect(k8sWatchMock).toHaveBeenCalledTimes(1);
    expect(k8sWatchMock.mock.calls[0]).toEqual([
      PodModel,
      { cluster: 'local-cluster', resourceVersion: '123' },
      { timeout: 60000 },
    ]);
    k8sWatchMock.mockClear();

    expect(resourceUpdate).toHaveBeenCalledTimes(3);
    expect(resourceUpdate.mock.calls[2]).toEqual([podList.items, true, '']);
    resourceUpdate.mockClear();
  });

  it('should return an object and fetch data (via get+watch) for a known model (PodModel)', async () => {
    const initResource: WatchK8sResource = {
      kind: 'Pod',
      name: 'my-pod',
    };
    render(
      <Wrapper>
        <WatchResource initResource={initResource} />
      </Wrapper>,
    );

    // Get updated after the list call is fetched?
    expect(resourceUpdate).toHaveBeenCalledTimes(2);
    expect(resourceUpdate.mock.calls[0]).toEqual([{}, false, undefined]);
    // TODO: should this really switch from {} to null!?
    expect(resourceUpdate.mock.calls[1]).toEqual([null, false, '']);
    resourceUpdate.mockClear();

    // Assert API calls
    expect(k8sGetMock).toHaveBeenCalledTimes(1);
    expect(k8sGetMock.mock.calls[0]).toEqual([
      PodModel,
      'my-pod',
      undefined,
      { cluster: 'local-cluster' },
      {},
    ]);
    k8sGetMock.mockClear();

    await act(async () => jest.runAllTimers());

    // Assert API calls
    expect(k8sWatchMock).toHaveBeenCalledTimes(1);
    expect(k8sWatchMock.mock.calls[0]).toEqual([
      PodModel,
      { cluster: 'local-cluster', fieldSelector: 'metadata.name=my-pod' },
      { subprotocols: undefined },
    ]);
    k8sWatchMock.mockClear();

    // expect(resourceUpdate).toHaveBeenCalledTimes(3);
    // expect(resourceUpdate.mock.calls[2]).toEqual([podList.items, true, '']);
    resourceUpdate.mockClear();
  });

  it('should return an error state when fetching a list that fails', async () => {
    k8sListMock.mockReturnValue(Promise.reject(new Error('Network issue')));

    const initResource: WatchK8sResource = {
      kind: 'Pod',
      isList: true,
    };
    render(
      <Wrapper>
        <WatchResource initResource={initResource} />
      </Wrapper>,
    );

    // Get updated after the list call failed
    expect(resourceUpdate).toHaveBeenCalledTimes(2);
    expect(resourceUpdate.mock.calls[0]).toEqual([[], false, undefined]);
    expect(resourceUpdate.mock.calls[1]).toEqual([[], false, '']);

    await act(async () => jest.runAllTimers());

    // Assert API calls
    expect(k8sListMock).toHaveBeenCalledTimes(1);
    expect(k8sListMock.mock.calls[0]).toEqual([
      PodModel,
      { cluster: 'local-cluster', limit: 250 },
      true,
      {},
      'local-cluster',
    ]);
    k8sListMock.mockClear();

    expect(resourceUpdate.mock.calls[2]).toEqual([[], false, new Error('Network issue')]);
    resourceUpdate.mockClear();
  });

  it('should return an error state when fetching a single item that fails', async () => {
    k8sGetMock.mockReturnValue(Promise.reject(new Error('Network issue')));

    const initResource: WatchK8sResource = {
      kind: 'Pod',
      name: 'my-pod',
    };
    render(
      <Wrapper>
        <WatchResource initResource={initResource} />
      </Wrapper>,
    );

    // Get updated after the list call failed
    expect(resourceUpdate).toHaveBeenCalledTimes(2);
    expect(resourceUpdate.mock.calls[0]).toEqual([{}, false, undefined]);
    expect(resourceUpdate.mock.calls[1]).toEqual([null, false, '']);

    await act(async () => jest.runAllTimers());

    // Assert API calls
    expect(k8sGetMock).toHaveBeenCalledTimes(1);
    expect(k8sGetMock.mock.calls[0]).toEqual([
      PodModel,
      'my-pod',
      undefined,
      { cluster: 'local-cluster' },
      {},
    ]);
    k8sGetMock.mockClear();

    // TODO: Unexpected watch call! The watch call was not triggered when watching a list
    expect(k8sWatchMock).toHaveBeenCalledTimes(1);
    expect(k8sWatchMock.mock.calls[0]).toEqual([
      PodModel,
      { cluster: 'local-cluster', fieldSelector: 'metadata.name=my-pod' },
      { subprotocols: undefined },
    ]);
    k8sWatchMock.mockClear();

    expect(resourceUpdate.mock.calls[2]).toEqual([null, false, new Error('Network issue')]);
    resourceUpdate.mockClear();
  });

  it('should return an error when try to fetch a list for an unknown model', async () => {
    const initResource: WatchK8sResource = {
      kind: 'Unknown',
      isList: true,
    };
    render(
      <Wrapper>
        <WatchResource initResource={initResource} />
      </Wrapper>,
    );

    // Get updated after the list call is fetched?
    expect(resourceUpdate).toHaveBeenCalledTimes(1);
    expect(resourceUpdate.mock.calls[0]).toEqual([[], true, new Error('Model does not exist')]);
    resourceUpdate.mockClear();
  });

  it('should return an error when try to fetch a single item for an unknown model', async () => {
    const initResource: WatchK8sResource = {
      kind: 'Unknown',
      name: 'unknown-resource',
    };
    render(
      <Wrapper>
        <WatchResource initResource={initResource} />
      </Wrapper>,
    );

    // Get updated after the list call is fetched?
    expect(resourceUpdate).toHaveBeenCalledTimes(1);
    expect(resourceUpdate.mock.calls[0]).toEqual([{}, true, new Error('Model does not exist')]);
    resourceUpdate.mockClear();
  });

  it('should not call the same data twice if two components watching for the same resource list', async () => {
    const initResource: WatchK8sResource = {
      kind: 'Pod',
      isList: true,
    };
    render(
      <Wrapper>
        <WatchResource initResource={initResource} />
        <WatchResource initResource={initResource} />
      </Wrapper>,
    );

    // Get updated after the list call is fetched?
    expect(resourceUpdate).toHaveBeenCalledTimes(4);
    expect(resourceUpdate.mock.calls[0]).toEqual([[], false, undefined]);
    expect(resourceUpdate.mock.calls[1]).toEqual([[], false, undefined]);
    expect(resourceUpdate.mock.calls[2]).toEqual([[], false, '']);
    expect(resourceUpdate.mock.calls[3]).toEqual([[], false, '']);
    resourceUpdate.mockClear();

    await act(async () => jest.runAllTimers());

    // Assert API calls
    expect(k8sListMock).toHaveBeenCalledTimes(1);
    expect(k8sListMock.mock.calls[0]).toEqual([
      PodModel,
      { cluster: 'local-cluster', limit: 250 },
      true,
      {},
      'local-cluster',
    ]);
    k8sListMock.mockClear();

    await act(async () => jest.runAllTimers());

    // Assert API calls
    expect(k8sWatchMock).toHaveBeenCalledTimes(1);
    expect(k8sWatchMock.mock.calls[0]).toEqual([
      PodModel,
      { cluster: 'local-cluster', resourceVersion: '123' },
      { timeout: 60000 },
    ]);
    k8sWatchMock.mockClear();

    expect(resourceUpdate).toHaveBeenCalledTimes(2);
    expect(resourceUpdate.mock.calls[0]).toEqual([podList.items, true, '']);
    expect(resourceUpdate.mock.calls[1]).toEqual([podList.items, true, '']);

    const itemsWatcher1 = resourceUpdate.mock.calls[0][0];
    const itemsWatcher2 = resourceUpdate.mock.calls[1][0];
    expect(itemsWatcher1).toEqual(itemsWatcher2);
    // Unluckly the data are not the same at the moment
    expect(itemsWatcher1).not.toBe(itemsWatcher2);

    resourceUpdate.mockClear();
  });

  it('should not call the same data twice if two components watching for the same resource by name', async () => {
    const initResource: WatchK8sResource = {
      kind: 'Pod',
      name: 'my-pod',
    };
    render(
      <Wrapper>
        <WatchResource initResource={initResource} />
        <WatchResource initResource={initResource} />
      </Wrapper>,
    );

    // Get updated after the list call is fetched?
    expect(resourceUpdate).toHaveBeenCalledTimes(4);
    expect(resourceUpdate.mock.calls[0]).toEqual([{}, false, undefined]);
    expect(resourceUpdate.mock.calls[1]).toEqual([{}, false, undefined]);
    // TODO: should this really switch from {} to null!?
    expect(resourceUpdate.mock.calls[2]).toEqual([null, false, '']);
    expect(resourceUpdate.mock.calls[3]).toEqual([null, false, '']);
    resourceUpdate.mockClear();

    await act(async () => jest.runAllTimers());

    // Assert API calls
    expect(k8sGetMock).toHaveBeenCalledTimes(1);
    expect(k8sGetMock.mock.calls[0]).toEqual([
      PodModel,
      'my-pod',
      undefined,
      { cluster: 'local-cluster' },
      {},
    ]);
    k8sGetMock.mockClear();

    await act(async () => jest.runAllTimers());

    // Assert API calls
    expect(k8sWatchMock).toHaveBeenCalledTimes(1);
    expect(k8sWatchMock.mock.calls[0]).toEqual([
      PodModel,
      { cluster: 'local-cluster', fieldSelector: 'metadata.name=my-pod' },
      { subprotocols: undefined },
    ]);
    k8sWatchMock.mockClear();

    expect(resourceUpdate).toHaveBeenCalledTimes(2);
    expect(resourceUpdate.mock.calls[0]).toEqual([podData, true, '']);
    expect(resourceUpdate.mock.calls[1]).toEqual([podData, true, '']);

    const itemWatcher1 = resourceUpdate.mock.calls[0][0];
    const itemWatcher2 = resourceUpdate.mock.calls[1][0];
    expect(itemWatcher1).toEqual(itemWatcher2);
    expect(itemWatcher1).toBe(itemWatcher2);

    resourceUpdate.mockClear();
  });
});
