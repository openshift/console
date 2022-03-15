import * as React from 'react';
import { act, cleanup, render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { combineReducers, createStore, applyMiddleware } from 'redux';
import { receivedResources } from '../../../actions/k8s';
import k8sReducers from '../../../reducers/k8s';
import UIReducers from '../../../reducers/ui';
import { thunk } from '../../../redux';
import { k8sList, k8sGet, k8sWatch } from '../../../module/k8s/resource';
import { WatchK8sResources } from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import { useK8sWatchResources } from '../k8s-watch-hook';
import { PodModel, podData, podList } from './useK8sWatchResource.data';

// Mock network calls
jest.mock('../../../module/k8s/resource', () => ({
  ...require.requireActual('../../../module/k8s/resource'),
  k8sList: jest.fn(() => {}),
  k8sGet: jest.fn(),
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
const WatchResource: React.FC<{ initResources: WatchK8sResources<{}> }> = ({ initResources }) => {
  resourceUpdate(useK8sWatchResources(initResources));
  return null;
};

beforeEach(() => {
  // Init k8s redux store with just one model
  store = createStore(
    combineReducers({ k8s: k8sReducers, UI: UIReducers }),
    {},
    applyMiddleware(thunk),
  );
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
  it('should not fetch any data if watch parameter is empty', async () => {
    const initResources: WatchK8sResources<{}> = {};
    render(
      <Wrapper>
        <WatchResource initResources={initResources} />
      </Wrapper>,
    );

    expect(resourceUpdate).toHaveBeenCalledTimes(1);
    expect(resourceUpdate.mock.calls[0]).toEqual([{}]);
    resourceUpdate.mockClear();
  });

  it('should not fetch any data if watch parameter is empty also when rerender and unmount', () => {
    const initResources: WatchK8sResources<{}> = {};
    const { rerender, unmount } = render(
      <Wrapper>
        <WatchResource initResources={initResources} />
      </Wrapper>,
    );
    rerender(
      <Wrapper>
        <WatchResource initResources={initResources} />
      </Wrapper>,
    );
    unmount();

    expect(resourceUpdate).toHaveBeenCalledTimes(2);
    expect(resourceUpdate.mock.calls[0]).toEqual([{}]);
    expect(resourceUpdate.mock.calls[1]).toEqual([{}]);
    resourceUpdate.mockClear();
  });

  it('should return an empty array and fetch data (via list+watch) for a known model (PodModel)', async () => {
    const initResources: WatchK8sResources<{}> = {
      pods: {
        kind: 'Pod',
        isList: true,
      },
    };
    render(
      <Wrapper>
        <WatchResource initResources={initResources} />
      </Wrapper>,
    );

    // Get updated after the list call is fetched?
    expect(resourceUpdate).toHaveBeenCalledTimes(2);
    expect(resourceUpdate.mock.calls[0]).toEqual([
      { pods: { data: [], loaded: false, loadError: undefined } },
    ]);
    expect(resourceUpdate.mock.calls[1]).toEqual([
      { pods: { data: [], loaded: false, loadError: '' } },
    ]);

    // Assert API calls
    expect(k8sListMock).toHaveBeenCalledTimes(1);
    expect(k8sListMock.mock.calls[0]).toEqual([PodModel, { limit: 250 }, true, {}]);
    k8sListMock.mockClear();

    await act(async () => jest.runAllTimers());

    // Assert API calls
    expect(k8sWatchMock).toHaveBeenCalledTimes(1);
    expect(k8sWatchMock.mock.calls[0]).toEqual([
      PodModel,
      { resourceVersion: '123' },
      { timeout: 60000 },
    ]);
    k8sWatchMock.mockClear();

    expect(resourceUpdate).toHaveBeenCalledTimes(3);
    expect(resourceUpdate.mock.calls[2]).toEqual([
      {
        pods: {
          data: podList.items,
          loaded: true,
          loadError: '',
        },
      },
    ]);
    resourceUpdate.mockClear();
  });

  it('should return an object and fetch data (via get+watch) for a known model (PodModel)', async () => {
    const initResources: WatchK8sResources<{}> = {
      pod: {
        kind: 'Pod',
        name: 'my-pod',
      },
    };
    render(
      <Wrapper>
        <WatchResource initResources={initResources} />
      </Wrapper>,
    );

    // Get updated after the list call is fetched?
    expect(resourceUpdate).toHaveBeenCalledTimes(2);
    expect(resourceUpdate.mock.calls[0]).toEqual([
      {
        pod: {
          data: {},
          loaded: false,
          loadError: undefined,
        },
      },
    ]);
    // TODO: should this really switch from {} to null!?
    expect(resourceUpdate.mock.calls[1]).toEqual([
      {
        pod: {
          data: null,
          loaded: false,
          loadError: '',
        },
      },
    ]);
    resourceUpdate.mockClear();

    // Assert API calls
    expect(k8sGetMock).toHaveBeenCalledTimes(1);
    expect(k8sGetMock.mock.calls[0]).toEqual([PodModel, 'my-pod', undefined, null, {}]);
    k8sGetMock.mockClear();

    await act(async () => jest.runAllTimers());

    // Assert API calls
    expect(k8sWatchMock).toHaveBeenCalledTimes(1);
    expect(k8sWatchMock.mock.calls[0]).toEqual([
      PodModel,
      { fieldSelector: 'metadata.name=my-pod' },
      { subprotocols: undefined },
    ]);
    k8sWatchMock.mockClear();

    // expect(resourceUpdate).toHaveBeenCalledTimes(3);
    // expect(resourceUpdate.mock.calls[2]).toEqual([[podList.items, true, '']]);
    resourceUpdate.mockClear();
  });

  it('should return an error state when fetching a list that fails', async () => {
    k8sListMock.mockReturnValue(Promise.reject(new Error('Network issue')));

    const initResources: WatchK8sResources<{}> = {
      pods: {
        kind: 'Pod',
        isList: true,
      },
    };
    render(
      <Wrapper>
        <WatchResource initResources={initResources} />
      </Wrapper>,
    );

    // Get updated after the list call failed
    expect(resourceUpdate).toHaveBeenCalledTimes(2);
    expect(resourceUpdate.mock.calls[0]).toEqual([
      {
        pods: {
          data: [],
          loaded: false,
          loadError: undefined,
        },
      },
    ]);
    expect(resourceUpdate.mock.calls[1]).toEqual([
      {
        pods: {
          data: [],
          loaded: false,
          loadError: '',
        },
      },
    ]);

    await act(async () => jest.runAllTimers());

    // Assert API calls
    expect(k8sListMock).toHaveBeenCalledTimes(1);
    expect(k8sListMock.mock.calls[0]).toEqual([PodModel, { limit: 250 }, true, {}]);
    k8sListMock.mockClear();

    expect(resourceUpdate.mock.calls[2]).toEqual([
      {
        pods: {
          data: [],
          loaded: false,
          loadError: new Error('Network issue'),
        },
      },
    ]);
    resourceUpdate.mockClear();
  });

  it('should return an error state when fetching a single item that fails', async () => {
    k8sGetMock.mockReturnValue(Promise.reject(new Error('Network issue')));

    const initResources: WatchK8sResources<{}> = {
      pod: {
        kind: 'Pod',
        name: 'my-pod',
      },
    };
    render(
      <Wrapper>
        <WatchResource initResources={initResources} />
      </Wrapper>,
    );

    // Get updated after the list call failed
    expect(resourceUpdate).toHaveBeenCalledTimes(2);
    expect(resourceUpdate.mock.calls[0]).toEqual([
      {
        pod: {
          data: {},
          loaded: false,
          loadError: undefined,
        },
      },
    ]);
    expect(resourceUpdate.mock.calls[1]).toEqual([
      {
        pod: {
          data: null,
          loaded: false,
          loadError: '',
        },
      },
    ]);

    await act(async () => jest.runAllTimers());

    // Assert API calls
    expect(k8sGetMock).toHaveBeenCalledTimes(1);
    expect(k8sGetMock.mock.calls[0]).toEqual([PodModel, 'my-pod', undefined, null, {}]);
    k8sGetMock.mockClear();

    // TODO: Unexpected watch call! The watch call was not triggered when watching a list
    expect(k8sWatchMock).toHaveBeenCalledTimes(1);
    expect(k8sWatchMock.mock.calls[0]).toEqual([
      PodModel,
      { fieldSelector: 'metadata.name=my-pod' },
      { subprotocols: undefined },
    ]);
    k8sWatchMock.mockClear();

    expect(resourceUpdate.mock.calls[2]).toEqual([
      {
        pod: {
          data: null,
          loaded: false,
          loadError: new Error('Network issue'),
        },
      },
    ]);
    resourceUpdate.mockClear();
  });

  it('should return an error when try to fetch a list for an unknown model', async () => {
    const initResources: WatchK8sResources<{}> = {
      unknown: {
        kind: 'Unknown',
        isList: true,
      },
    };
    render(
      <Wrapper>
        <WatchResource initResources={initResources} />
      </Wrapper>,
    );

    // Get updated after the list call is fetched?
    expect(resourceUpdate).toHaveBeenCalledTimes(1);
    expect(resourceUpdate.mock.calls[0]).toEqual([
      {
        unknown: {
          data: [],
          loaded: true,
          loadError: new Error('Model does not exist'),
        },
      },
    ]);
    resourceUpdate.mockClear();
  });

  it('should return an error when try to fetch a single item for an unknown model', async () => {
    const initResources: WatchK8sResources<{}> = {
      unknown: {
        kind: 'Unknown',
        name: 'unknown-resource',
      },
    };
    render(
      <Wrapper>
        <WatchResource initResources={initResources} />
      </Wrapper>,
    );

    // Get updated after the list call is fetched?
    expect(resourceUpdate).toHaveBeenCalledTimes(1);
    expect(resourceUpdate.mock.calls[0]).toEqual([
      {
        unknown: {
          data: {},
          loaded: true,
          loadError: new Error('Model does not exist'),
        },
      },
    ]);
    resourceUpdate.mockClear();
  });

  it('should not call the same data twice if two components watching for the same resource list', async () => {
    const initResources: WatchK8sResources<{}> = {
      pods: {
        kind: 'Pod',
        isList: true,
      },
    };
    render(
      <Wrapper>
        <WatchResource initResources={initResources} />
        <WatchResource initResources={initResources} />
      </Wrapper>,
    );

    // Get updated after the list call is fetched?
    expect(resourceUpdate).toHaveBeenCalledTimes(4);
    expect(resourceUpdate.mock.calls[0]).toEqual([
      { pods: { data: [], loaded: false, loadError: undefined } },
    ]);
    expect(resourceUpdate.mock.calls[1]).toEqual([
      { pods: { data: [], loaded: false, loadError: undefined } },
    ]);
    expect(resourceUpdate.mock.calls[2]).toEqual([
      { pods: { data: [], loaded: false, loadError: '' } },
    ]);
    expect(resourceUpdate.mock.calls[3]).toEqual([
      { pods: { data: [], loaded: false, loadError: '' } },
    ]);
    resourceUpdate.mockClear();

    await act(async () => jest.runAllTimers());

    // Assert API calls
    expect(k8sListMock).toHaveBeenCalledTimes(1);
    expect(k8sListMock.mock.calls[0]).toEqual([PodModel, { limit: 250 }, true, {}]);
    k8sListMock.mockClear();

    await act(async () => jest.runAllTimers());

    // Assert API calls
    expect(k8sWatchMock).toHaveBeenCalledTimes(1);
    expect(k8sWatchMock.mock.calls[0]).toEqual([
      PodModel,
      { resourceVersion: '123' },
      { timeout: 60000 },
    ]);
    k8sWatchMock.mockClear();

    expect(resourceUpdate).toHaveBeenCalledTimes(2);
    expect(resourceUpdate.mock.calls[0]).toEqual([
      {
        pods: {
          data: podList.items,
          loaded: true,
          loadError: '',
        },
      },
    ]);
    expect(resourceUpdate.mock.calls[1]).toEqual([
      {
        pods: {
          data: podList.items,
          loaded: true,
          loadError: '',
        },
      },
    ]);

    const itemsWatcher1 = resourceUpdate.mock.calls[0][0].pods.data;
    const itemsWatcher2 = resourceUpdate.mock.calls[1][0].pods.data;
    expect(itemsWatcher1).toEqual(itemsWatcher2);
    // Unluckly the data are not the same at the moment
    expect(itemsWatcher1).not.toBe(itemsWatcher2);

    resourceUpdate.mockClear();
  });

  it('should not call the same data twice if two components watching for the same resource by name', async () => {
    const initResources: WatchK8sResources<{}> = {
      pod: {
        kind: 'Pod',
        name: 'my-pod',
      },
    };
    render(
      <Wrapper>
        <WatchResource initResources={initResources} />
        <WatchResource initResources={initResources} />
      </Wrapper>,
    );

    // Get updated after the list call is fetched?
    expect(resourceUpdate).toHaveBeenCalledTimes(4);
    expect(resourceUpdate.mock.calls[0]).toEqual([
      {
        pod: {
          data: {},
          loaded: false,
          loadError: undefined,
        },
      },
    ]);
    expect(resourceUpdate.mock.calls[1]).toEqual([
      {
        pod: {
          data: {},
          loaded: false,
          loadError: undefined,
        },
      },
    ]);
    // TODO: should this really switch from {} to null!?
    expect(resourceUpdate.mock.calls[2]).toEqual([
      {
        pod: {
          data: null,
          loaded: false,
          loadError: '',
        },
      },
    ]);
    expect(resourceUpdate.mock.calls[3]).toEqual([
      {
        pod: {
          data: null,
          loaded: false,
          loadError: '',
        },
      },
    ]);
    resourceUpdate.mockClear();

    await act(async () => jest.runAllTimers());

    // Assert API calls
    expect(k8sGetMock).toHaveBeenCalledTimes(1);
    expect(k8sGetMock.mock.calls[0]).toEqual([PodModel, 'my-pod', undefined, null, {}]);
    k8sGetMock.mockClear();

    await act(async () => jest.runAllTimers());

    // Assert API calls
    expect(k8sWatchMock).toHaveBeenCalledTimes(1);
    expect(k8sWatchMock.mock.calls[0]).toEqual([
      PodModel,
      { fieldSelector: 'metadata.name=my-pod' },
      { subprotocols: undefined },
    ]);
    k8sWatchMock.mockClear();

    expect(resourceUpdate).toHaveBeenCalledTimes(2);
    expect(resourceUpdate.mock.calls[0]).toEqual([
      {
        pod: {
          data: podData,
          loaded: true,
          loadError: '',
        },
      },
    ]);
    expect(resourceUpdate.mock.calls[1]).toEqual([
      {
        pod: {
          data: podData,
          loaded: true,
          loadError: '',
        },
      },
    ]);

    const itemWatcher1 = resourceUpdate.mock.calls[0][0].pod.data;
    const itemWatcher2 = resourceUpdate.mock.calls[1][0].pod.data;
    expect(itemWatcher1).toEqual(itemWatcher2);
    expect(itemWatcher1).toBe(itemWatcher2);

    resourceUpdate.mockClear();
  });
});
