import * as React from 'react';
import { Map as ImmutableMap, List as ImmutableList } from 'immutable';
import { combineReducers, createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import { Provider } from 'react-redux';
import { act, cleanup, render } from '@testing-library/react';
import { SDKReducers } from '@console/dynamic-plugin-sdk/src/app';
import { k8sList, k8sGet } from '@console/dynamic-plugin-sdk/src/utils/k8s/k8s-resource';
import { setPluginStore, k8sWatch } from '@console/dynamic-plugin-sdk/src/utils/k8s';
import { WatchK8sResources } from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import { useK8sWatchResources } from '@console/dynamic-plugin-sdk/src/utils/k8s/hooks/useK8sWatchResources';
import { receivedResources } from '../../../actions/k8s';
import { processReduxId, Firehose } from '../firehose';
import { PodModel, podData, podList, firehoseChildPropsWithoutModels } from './firehose.data';

// Mock network calls
jest.mock('@console/dynamic-plugin-sdk/src/utils/k8s/k8s-resource', () => ({
  k8sList: jest.fn(() => {}),
  k8sGet: jest.fn(),
}));
jest.mock('@console/dynamic-plugin-sdk/src/utils/k8s', () => ({
  ...require.requireActual('@console/dynamic-plugin-sdk/src/utils/k8s'),
  k8sWatch: jest.fn(),
}));
const k8sListMock = k8sList as jest.Mock;
const k8sGetMock = k8sGet as jest.Mock;
const k8sWatchMock = k8sWatch as jest.Mock;

// Redux wrapper
let store;
const Wrapper: React.FC = ({ children }) => <Provider store={store}>{children}</Provider>;

describe('processReduxId', () => {
  const k8s = ImmutableMap({
    ['Pods']: ImmutableMap({
      data: ImmutableList(
        ['my-pod1', 'my-pod2', 'my-pod3'].map((name) =>
          ImmutableMap({
            apiVersion: 'v1',
            kind: 'Pod',
            metadata: {
              name,
              namespace: 'my-namespace',
              resourceVersion: '123',
            },
          }),
        ),
      ),
    }),
    ['Pods~~~my-pod']: ImmutableMap({
      data: ImmutableMap({
        apiVersion: 'v1',
        kind: 'Pod',
        metadata: {
          name: 'my-pod',
          namespace: 'my-namespace',
          resourceVersion: '123',
        },
      }),
    }),
  });

  it('should return an empty object when reduxID prop is missing', () => {
    const props = { kind: 'UnknownKind' };
    expect(processReduxId({ k8s }, props)).toEqual({});
  });

  it("should return an object without data when extract a list which doesn't exist", () => {
    const props = {
      reduxID: 'Unknown',
      kind: 'Pod',
      isList: true,
    };
    expect(processReduxId({ k8s }, props)).toEqual({
      data: undefined,
      filters: {},
      kind: 'Pod',
      loadError: undefined,
      loaded: undefined,
      optional: undefined,
      selected: undefined,
    });
  });

  it("should return an empty object when extract a single item which doesn't exist", () => {
    const props = {
      reduxID: 'Unknown',
      kind: 'Pod',
      isList: false,
    };
    expect(processReduxId({ k8s }, props)).toEqual({});
  });

  it('should return an Firehose object with data when extract a list', () => {
    const props = {
      reduxID: 'Pods',
      kind: 'Pod',
      isList: true,
    };
    expect(processReduxId({ k8s }, props)).toEqual({
      kind: 'Pod',
      data: [
        {
          apiVersion: 'v1',
          kind: 'Pod',
          metadata: { name: 'my-pod1', namespace: 'my-namespace', resourceVersion: '123' },
        },
        {
          apiVersion: 'v1',
          kind: 'Pod',
          metadata: { name: 'my-pod2', namespace: 'my-namespace', resourceVersion: '123' },
        },
        {
          apiVersion: 'v1',
          kind: 'Pod',
          metadata: { name: 'my-pod3', namespace: 'my-namespace', resourceVersion: '123' },
        },
      ],
      filters: {},
      loadError: undefined,
      loaded: undefined,
      optional: undefined,
      selected: undefined,
    });
  });

  it('should return the same object twice when calling it twice for a list', () => {
    const props = {
      reduxID: 'Pods',
      kind: 'Pod',
      isList: true,
    };
    const firstTime = processReduxId({ k8s }, props);
    const secondTime = processReduxId({ k8s }, props);
    // Exact JSON is tested above.
    // It returns always a new result object
    expect(firstTime).not.toBe(secondTime);
    // But at least the data should be the same
    expect(firstTime.data).toBe(secondTime.data);
  });

  it('should return an Firehose object with data when extract a single item', () => {
    const props = {
      reduxID: 'Pods~~~my-pod',
      kind: 'Pod',
      isList: false,
    };
    expect(processReduxId({ k8s }, props)).toEqual({
      data: {
        apiVersion: 'v1',
        kind: 'Pod',
        metadata: { name: 'my-pod', namespace: 'my-namespace', resourceVersion: '123' },
      },
      optional: undefined,
    });
  });

  it('should return the same object twice when calling it twice for a single item', () => {
    const props = {
      reduxID: 'Pods~~~my-pod',
      kind: 'Pod',
      isList: false,
    };
    const firstTime = processReduxId({ k8s }, props);
    const secondTime = processReduxId({ k8s }, props);
    // Exact JSON is tested above.
    // It returns always a new result object
    // And it could not be the same because optional parameter could change!
    expect(firstTime).not.toBe(secondTime);
    // But at least the data should be the same
    expect(firstTime.data).toBe(secondTime.data);
  });

  it('should return different data for isList true and false, but same data when calling multiple times', () => {});
});

describe('Firehose', () => {
  // Object under test
  const resourceUpdate = jest.fn();
  const Child: React.FC = (props) => {
    resourceUpdate(props);
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

  it('should return an empty object when reduxID prop is missing (also when rerender or unmount)', async () => {
    const { rerender, unmount } = render(
      <Wrapper>
        <Firehose resources={[]}>
          <Child />
        </Firehose>
      </Wrapper>,
    );
    rerender(
      <Wrapper>
        <Firehose resources={[]}>
          <Child />
        </Firehose>
      </Wrapper>,
    );
    unmount();

    expect(resourceUpdate).toHaveBeenCalledTimes(2);
    expect(resourceUpdate.mock.calls[0][0]).toEqual(firehoseChildPropsWithoutModels);
    expect(resourceUpdate.mock.calls[1][0]).toEqual(firehoseChildPropsWithoutModels);
    resourceUpdate.mockClear();
  });

  it('should fetch and update child props when requesting a list of resources successfully', async () => {
    const resources = [
      {
        prop: 'pods',
        kind: 'Pod',
        isList: true,
        namespace: 'my-namespace',
      },
    ];
    const { rerender, unmount } = render(
      <Wrapper>
        <Firehose resources={resources}>
          <Child />
        </Firehose>
      </Wrapper>,
    );

    expect(k8sListMock).toHaveBeenCalledTimes(1);
    expect(k8sListMock.mock.calls[0]).toEqual([
      PodModel,
      { cluster: 'local-cluster', limit: 250, ns: 'my-namespace' },
      true,
      {},
      'local-cluster',
    ]);
    k8sListMock.mockClear();

    // Expect initial render child-props
    const podsNotLoadedYet = {
      kind: 'Pod',
      data: [],
      loaded: false,
      loadError: '',
      filters: {},
      selected: null,
      optional: undefined,
    };
    const podsNotLoadedYetProps = {
      ...firehoseChildPropsWithoutModels,
      k8sModels: ImmutableMap({ Pod: PodModel }),
      reduxIDs: ['local-clustercore~v1~Pod---{"ns":"my-namespace"}'],
      loaded: false,
      // Yes, same data twice at the moment.
      pods: podsNotLoadedYet,
      resources: { pods: podsNotLoadedYet },
    };
    expect(resourceUpdate).toHaveBeenCalledTimes(1);
    expect(resourceUpdate.mock.calls[0][0]).toEqual(podsNotLoadedYetProps);

    // Finish API call
    await act(async () => jest.runAllTimers());

    // Expect updated child-props
    const podsLoaded = {
      kind: 'Pod',
      data: ['my-pod1', 'my-pod2', 'my-pod3'].map((name) => ({
        apiVersion: 'v1',
        kind: 'Pod',
        metadata: {
          name,
          namespace: 'my-namespace',
          resourceVersion: '123',
        },
      })),
      loaded: true,
      loadError: '',
      filters: {},
      selected: null,
      optional: undefined,
    };
    const podsLoadedProps = {
      ...firehoseChildPropsWithoutModels,
      k8sModels: ImmutableMap({ Pod: PodModel }),
      reduxIDs: ['local-clustercore~v1~Pod---{"ns":"my-namespace"}'],
      loaded: true,
      // Yes, same data twice at the moment.
      pods: podsLoaded,
      resources: { pods: podsLoaded },
    };
    expect(resourceUpdate).toHaveBeenCalledTimes(2);
    expect(resourceUpdate.mock.calls[1][0]).toEqual(podsLoadedProps);

    // Check rerender and unmount
    rerender(
      <Wrapper>
        <Firehose resources={resources}>
          <Child />
        </Firehose>
      </Wrapper>,
    );
    unmount();
    expect(resourceUpdate).toHaveBeenCalledTimes(3);
    expect(resourceUpdate.mock.calls[2][0]).toEqual(podsLoadedProps);

    resourceUpdate.mockClear();
  });

  it('should fetch and update child props when requesting a single resource successfully', async () => {
    const resources = [
      {
        prop: 'pod',
        kind: 'Pod',
        namespace: 'my-namespace',
        name: 'my-pod',
      },
    ];
    const { rerender, unmount } = render(
      <Wrapper>
        <Firehose resources={resources}>
          <Child />
        </Firehose>
      </Wrapper>,
    );

    expect(k8sGetMock).toHaveBeenCalledTimes(1);
    expect(k8sGetMock.mock.calls[0]).toEqual([
      PodModel,
      'my-pod',
      'my-namespace',
      { cluster: 'local-cluster' },
      {},
    ]);
    k8sGetMock.mockClear();

    // Expect initial render child-props
    const podNotLoadedYet = {
      data: {},
      loaded: false,
      loadError: '',
      optional: undefined,
    };
    const podsNotLoadedYetProps = {
      ...firehoseChildPropsWithoutModels,
      k8sModels: ImmutableMap({ Pod: PodModel }),
      reduxIDs: ['local-clustercore~v1~Pod---{"ns":"my-namespace","name":"my-pod"}'],
      loaded: false,
      // Yes, same data twice at the moment.
      pod: podNotLoadedYet,
      resources: { pod: podNotLoadedYet },
    };
    expect(resourceUpdate).toHaveBeenCalledTimes(1);
    expect(resourceUpdate.mock.calls[0][0]).toEqual(podsNotLoadedYetProps);

    // Finish API call
    await act(async () => jest.runAllTimers());

    // Expect updated child-props
    const podLoaded = {
      data: {
        apiVersion: 'v1',
        kind: 'Pod',
        metadata: {
          name: 'my-pod',
          namespace: 'my-namespace',
          resourceVersion: '123',
        },
      },
      loaded: true,
      loadError: '',
      optional: undefined,
    };
    const podLoadedProps = {
      ...firehoseChildPropsWithoutModels,
      k8sModels: ImmutableMap({ Pod: PodModel }),
      reduxIDs: ['local-clustercore~v1~Pod---{"ns":"my-namespace","name":"my-pod"}'],
      loaded: true,
      // Yes, same data twice at the moment.
      pod: podLoaded,
      resources: { pod: podLoaded },
    };
    expect(resourceUpdate).toHaveBeenCalledTimes(2);
    expect(resourceUpdate.mock.calls[1][0]).toEqual(podLoadedProps);

    // Check rerender and unmount
    rerender(
      <Wrapper>
        <Firehose resources={resources}>
          <Child />
        </Firehose>
      </Wrapper>,
    );
    unmount();
    expect(resourceUpdate).toHaveBeenCalledTimes(3);
    expect(resourceUpdate.mock.calls[2][0]).toEqual(podLoadedProps);

    resourceUpdate.mockClear();
  });

  it('should fetch and update child props when requesting a list of resources fails', async () => {
    k8sListMock.mockReturnValue(Promise.reject(new Error('Network issue')));
    const resources = [
      {
        prop: 'pods',
        kind: 'Pod',
        isList: true,
        namespace: 'my-namespace',
      },
    ];
    const { rerender, unmount } = render(
      <Wrapper>
        <Firehose resources={resources}>
          <Child />
        </Firehose>
      </Wrapper>,
    );

    expect(k8sListMock).toHaveBeenCalledTimes(1);
    expect(k8sListMock.mock.calls[0]).toEqual([
      PodModel,
      { cluster: 'local-cluster', limit: 250, ns: 'my-namespace' },
      true,
      {},
      'local-cluster',
    ]);
    k8sListMock.mockClear();

    // Expect initial render child-props
    const podsNotLoadedYet = {
      kind: 'Pod',
      data: [],
      loaded: false,
      loadError: '',
      filters: {},
      selected: null,
      optional: undefined,
    };
    const podsNotLoadedYetProps = {
      ...firehoseChildPropsWithoutModels,
      k8sModels: ImmutableMap({ Pod: PodModel }),
      reduxIDs: ['local-clustercore~v1~Pod---{"ns":"my-namespace"}'],
      loaded: false,
      // Yes, same data twice at the moment.
      pods: podsNotLoadedYet,
      resources: { pods: podsNotLoadedYet },
    };
    expect(resourceUpdate).toHaveBeenCalledTimes(1);
    expect(resourceUpdate.mock.calls[0][0]).toEqual(podsNotLoadedYetProps);

    // Finish API call
    await act(async () => jest.runAllTimers());

    // Expect updated child-props
    const podsLoaded = {
      kind: 'Pod',
      data: [],
      loaded: false,
      loadError: new Error('Network issue'),
      filters: {},
      selected: null,
      optional: undefined,
    };
    const podsLoadedProps = {
      ...firehoseChildPropsWithoutModels,
      k8sModels: ImmutableMap({ Pod: PodModel }),
      reduxIDs: ['local-clustercore~v1~Pod---{"ns":"my-namespace"}'],
      loaded: false,
      loadError: new Error('Network issue'),
      // Yes, same data twice at the moment.
      pods: podsLoaded,
      resources: { pods: podsLoaded },
    };
    expect(resourceUpdate).toHaveBeenCalledTimes(2);
    expect(resourceUpdate.mock.calls[1][0]).toEqual(podsLoadedProps);

    // Check rerender and unmount
    rerender(
      <Wrapper>
        <Firehose resources={resources}>
          <Child />
        </Firehose>
      </Wrapper>,
    );
    unmount();
    expect(resourceUpdate).toHaveBeenCalledTimes(3);
    expect(resourceUpdate.mock.calls[2][0]).toEqual(podsLoadedProps);

    resourceUpdate.mockClear();
  });

  it('should fetch and update child props when requesting a single resource fails', async () => {
    k8sGetMock.mockReturnValue(Promise.reject(new Error('Network issue')));
    const resources = [
      {
        prop: 'pod',
        kind: 'Pod',
        namespace: 'my-namespace',
        name: 'my-pod',
      },
    ];
    const { rerender, unmount } = render(
      <Wrapper>
        <Firehose resources={resources}>
          <Child />
        </Firehose>
      </Wrapper>,
    );

    expect(k8sGetMock).toHaveBeenCalledTimes(1);
    expect(k8sGetMock.mock.calls[0]).toEqual([
      PodModel,
      'my-pod',
      'my-namespace',
      { cluster: 'local-cluster' },
      {},
    ]);
    k8sGetMock.mockClear();

    // Expect initial render child-props
    const podNotLoadedYet = {
      data: {},
      loaded: false,
      loadError: '',
      optional: undefined,
    };
    const podsNotLoadedYetProps = {
      ...firehoseChildPropsWithoutModels,
      k8sModels: ImmutableMap({ Pod: PodModel }),
      reduxIDs: ['local-clustercore~v1~Pod---{"ns":"my-namespace","name":"my-pod"}'],
      loaded: false,
      // Yes, same data twice at the moment.
      pod: podNotLoadedYet,
      resources: { pod: podNotLoadedYet },
    };
    expect(resourceUpdate).toHaveBeenCalledTimes(1);
    expect(resourceUpdate.mock.calls[0][0]).toEqual(podsNotLoadedYetProps);

    // Finish API call
    await act(async () => jest.runAllTimers());

    // Expect updated child-props
    const podLoaded = {
      data: {},
      loaded: false,
      loadError: new Error('Network issue'),
      optional: undefined,
    };
    const podLoadedProps = {
      ...firehoseChildPropsWithoutModels,
      k8sModels: ImmutableMap({ Pod: PodModel }),
      reduxIDs: ['local-clustercore~v1~Pod---{"ns":"my-namespace","name":"my-pod"}'],
      loaded: false,
      loadError: new Error('Network issue'),
      // Yes, same data twice at the moment.
      pod: podLoaded,
      resources: { pod: podLoaded },
    };
    expect(resourceUpdate).toHaveBeenCalledTimes(2);
    expect(resourceUpdate.mock.calls[1][0]).toEqual(podLoadedProps);

    // Check rerender and unmount
    rerender(
      <Wrapper>
        <Firehose resources={resources}>
          <Child />
        </Firehose>
      </Wrapper>,
    );
    unmount();
    expect(resourceUpdate).toHaveBeenCalledTimes(3);
    expect(resourceUpdate.mock.calls[2][0]).toEqual(podLoadedProps);

    resourceUpdate.mockClear();
  });

  it('should set the props to all childrens and fetch the data just once', async () => {
    const resources = [
      {
        prop: 'pods',
        kind: 'Pod',
        isList: true,
        namespace: 'my-namespace',
      },
      {
        prop: 'pod',
        kind: 'Pod',
        namespace: 'my-namespace',
        name: 'my-pod',
      },
    ];
    render(
      <Wrapper>
        <Firehose resources={resources}>
          <Child />
          <Child />
        </Firehose>
      </Wrapper>,
    );

    // Assert that API calls are just triggered once
    expect(k8sListMock).toHaveBeenCalledTimes(1);
    expect(k8sListMock.mock.calls[0]).toEqual([
      PodModel,
      { cluster: 'local-cluster', limit: 250, ns: 'my-namespace' },
      true,
      {},
      'local-cluster',
    ]);
    k8sListMock.mockClear();
    expect(k8sGetMock).toHaveBeenCalledTimes(1);
    expect(k8sGetMock.mock.calls[0]).toEqual([
      PodModel,
      'my-pod',
      'my-namespace',
      { cluster: 'local-cluster' },
      {},
    ]);
    k8sGetMock.mockClear();

    // Expect initial render child-props
    const podsNotLoadedYet = {
      kind: 'Pod',
      data: [],
      loaded: false,
      loadError: '',
      filters: {},
      selected: null,
      optional: undefined,
    };
    const podNotLoadedYet = {
      data: {},
      loaded: false,
      loadError: '',
      optional: undefined,
    };
    const notLoadedYetProps = {
      ...firehoseChildPropsWithoutModels,
      k8sModels: ImmutableMap({ Pod: PodModel }),
      reduxIDs: [
        'local-clustercore~v1~Pod---{"ns":"my-namespace"}',
        'local-clustercore~v1~Pod---{"ns":"my-namespace","name":"my-pod"}',
      ],
      loaded: false,
      // Yes, same data twice at the moment.
      pods: podsNotLoadedYet,
      pod: podNotLoadedYet,
      resources: { pods: podsNotLoadedYet, pod: podNotLoadedYet },
    };
    expect(resourceUpdate).toHaveBeenCalledTimes(2);
    expect(resourceUpdate.mock.calls[0][0]).toEqual(notLoadedYetProps);
    expect(resourceUpdate.mock.calls[1][0]).toEqual(notLoadedYetProps);

    // Finish API call
    await act(async () => jest.runAllTimers());

    // Expect updated child-props
    const podsLoaded = {
      kind: 'Pod',
      data: ['my-pod1', 'my-pod2', 'my-pod3'].map((name) => ({
        apiVersion: 'v1',
        kind: 'Pod',
        metadata: {
          name,
          namespace: 'my-namespace',
          resourceVersion: '123',
        },
      })),
      loaded: true,
      loadError: '',
      filters: {},
      selected: null,
      optional: undefined,
    };
    const podLoaded = {
      data: {
        apiVersion: 'v1',
        kind: 'Pod',
        metadata: {
          name: 'my-pod',
          namespace: 'my-namespace',
          resourceVersion: '123',
        },
      },
      loaded: true,
      loadError: '',
      optional: undefined,
    };
    const loadedProps = {
      ...firehoseChildPropsWithoutModels,
      k8sModels: ImmutableMap({ Pod: PodModel }),
      reduxIDs: [
        'local-clustercore~v1~Pod---{"ns":"my-namespace"}',
        'local-clustercore~v1~Pod---{"ns":"my-namespace","name":"my-pod"}',
      ],
      loaded: true,
      // Yes, same data twice at the moment.
      pods: podsLoaded,
      pod: podLoaded,
      resources: { pods: podsLoaded, pod: podLoaded },
    };
    expect(resourceUpdate).toHaveBeenCalledTimes(6);
    // skip rerendering 2 so that both data sets are loaded
    expect(resourceUpdate.mock.calls[4][0]).toEqual(loadedProps);
    expect(resourceUpdate.mock.calls[5][0]).toEqual(loadedProps);
    const propsChildA = resourceUpdate.mock.calls[4][0];
    const propsChildB = resourceUpdate.mock.calls[5][0];
    resourceUpdate.mockClear();

    // Check that all data shares the same identity for the loaded data.
    expect(propsChildA).toEqual(propsChildB);
    expect(propsChildA).not.toBe(propsChildB); // TODO: These props could be the same, or?

    // pods 'resource' object (with data, loaded, etc.) object
    expect(propsChildA.pods).toBe(propsChildB.pods);
    expect(propsChildA.pods.data).toBe(propsChildB.pods.data);
    expect(propsChildA.pods.data[0]).toBe(propsChildB.pods.data[0]);
    expect(propsChildA.resources.pods).toBe(propsChildB.resources.pods);
    expect(propsChildA.resources.pods.data).toBe(propsChildB.resources.pods.data);
    expect(propsChildA.resources.pods.data[0]).toBe(propsChildB.resources.pods.data[0]);

    // pod 'resource' object (with data, loaded, etc.) object
    expect(propsChildA.pod).toBe(propsChildB.pod);
    expect(propsChildA.pod.data).toBe(propsChildB.pod.data);
    expect(propsChildA.resources.pod).toBe(propsChildB.resources.pod);
    expect(propsChildA.resources.pod.data).toBe(propsChildB.resources.pod.data);
  });

  it('should fetch data just once when two Firehose components requests the same data', async () => {
    const resources = [
      {
        prop: 'pods',
        kind: 'Pod',
        isList: true,
        namespace: 'my-namespace',
      },
      {
        prop: 'pod',
        kind: 'Pod',
        namespace: 'my-namespace',
        name: 'my-pod',
      },
    ];
    render(
      <Wrapper>
        <Firehose resources={resources}>
          <Child />
        </Firehose>
        <Firehose resources={resources}>
          <Child />
        </Firehose>
      </Wrapper>,
    );

    // Assert that API calls are just triggered once
    expect(k8sListMock).toHaveBeenCalledTimes(1);
    expect(k8sListMock.mock.calls[0]).toEqual([
      PodModel,
      { cluster: 'local-cluster', limit: 250, ns: 'my-namespace' },
      true,
      {},
      'local-cluster',
    ]);
    k8sListMock.mockClear();
    expect(k8sGetMock).toHaveBeenCalledTimes(1);
    expect(k8sGetMock.mock.calls[0]).toEqual([
      PodModel,
      'my-pod',
      'my-namespace',
      { cluster: 'local-cluster' },
      {},
    ]);
    k8sGetMock.mockClear();

    // Expect initial render child-props
    const podsNotLoadedYet = {
      kind: 'Pod',
      data: [],
      loaded: false,
      loadError: '',
      filters: {},
      selected: null,
      optional: undefined,
    };
    const podNotLoadedYet = {
      data: {},
      loaded: false,
      loadError: '',
      optional: undefined,
    };
    const podsNotLoadedYetProps = {
      ...firehoseChildPropsWithoutModels,
      k8sModels: ImmutableMap({ Pod: PodModel }),
      reduxIDs: [
        'local-clustercore~v1~Pod---{"ns":"my-namespace"}',
        'local-clustercore~v1~Pod---{"ns":"my-namespace","name":"my-pod"}',
      ],
      loaded: false,
      // Yes, same data twice at the moment.
      pods: podsNotLoadedYet,
      pod: podNotLoadedYet,
      resources: { pods: podsNotLoadedYet, pod: podNotLoadedYet },
    };
    expect(resourceUpdate).toHaveBeenCalledTimes(2);
    expect(resourceUpdate.mock.calls[0][0]).toEqual(podsNotLoadedYetProps);
    expect(resourceUpdate.mock.calls[1][0]).toEqual(podsNotLoadedYetProps);

    // Finish API call
    await act(async () => jest.runAllTimers());

    // Expect updated child-props
    const podsLoaded = {
      kind: 'Pod',
      data: ['my-pod1', 'my-pod2', 'my-pod3'].map((name) => ({
        apiVersion: 'v1',
        kind: 'Pod',
        metadata: {
          name,
          namespace: 'my-namespace',
          resourceVersion: '123',
        },
      })),
      loaded: true,
      loadError: '',
      filters: {},
      selected: null,
      optional: undefined,
    };
    const podLoaded = {
      data: {
        apiVersion: 'v1',
        kind: 'Pod',
        metadata: {
          name: 'my-pod',
          namespace: 'my-namespace',
          resourceVersion: '123',
        },
      },
      loaded: true,
      loadError: '',
      optional: undefined,
    };
    const podsLoadedProps = {
      ...firehoseChildPropsWithoutModels,
      k8sModels: ImmutableMap({ Pod: PodModel }),
      reduxIDs: [
        'local-clustercore~v1~Pod---{"ns":"my-namespace"}',
        'local-clustercore~v1~Pod---{"ns":"my-namespace","name":"my-pod"}',
      ],
      loaded: true,
      // Yes, same data twice at the moment.
      pods: podsLoaded,
      pod: podLoaded,
      resources: { pods: podsLoaded, pod: podLoaded },
    };
    expect(resourceUpdate).toHaveBeenCalledTimes(6);
    // skip rerendering 2 so that both data sets are loaded
    expect(resourceUpdate.mock.calls[4][0]).toEqual(podsLoadedProps);
    expect(resourceUpdate.mock.calls[5][0]).toEqual(podsLoadedProps);
    const propsChildA = resourceUpdate.mock.calls[4][0];
    const propsChildB = resourceUpdate.mock.calls[5][0];
    resourceUpdate.mockClear();

    // Check that all data shares the same identity for the loaded data.
    expect(propsChildA).not.toEqual(propsChildB); // Compared values have no visual difference, but should be equal, or?
    expect(propsChildA).not.toBe(propsChildB); // Compared values have no visual difference, but should be the same, or?

    // pods 'resource' object (with data, loaded, etc.) object
    expect(propsChildA.pods).toEqual(propsChildB.pods);
    expect(propsChildA.pods).not.toBe(propsChildB.pods); // Could be the same?
    expect(propsChildA.pods.data).toBe(propsChildB.pods.data);
    expect(propsChildA.pods.data[0]).toBe(propsChildB.pods.data[0]);

    expect(propsChildA.resources.pods).toEqual(propsChildB.resources.pods);
    expect(propsChildA.resources.pods).not.toBe(propsChildB.resources.pods); // Could be the same?
    expect(propsChildA.resources.pods.data).toBe(propsChildB.resources.pods.data);
    expect(propsChildA.resources.pods.data[0]).toBe(propsChildB.resources.pods.data[0]);

    // pod 'resource' object (with data, loaded, etc.) object
    expect(propsChildA.pod).not.toBe(propsChildB.pod); // Could be the same?
    expect(propsChildA.data).toBe(propsChildB.data);
    expect(propsChildA.resources.pod).not.toBe(propsChildB.resources.pod); // Could be the same?
    expect(propsChildA.resources.pod.data).toBe(propsChildB.resources.pod.data);
  });
});

describe('Firehose together with useK8sWatchResources', () => {
  // Objects under test
  const firehoseUpdate = jest.fn();
  const Child: React.FC = (props) => {
    firehoseUpdate(props);
    return null;
  };

  const resourcesUpdate = jest.fn();
  const WatchResources: React.FC<{ initResources: WatchK8sResources<{}> }> = ({
    initResources,
  }) => {
    resourcesUpdate(useK8sWatchResources(initResources));
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
    expect(firehoseUpdate).toHaveBeenCalledTimes(0);
    expect(resourcesUpdate).toHaveBeenCalledTimes(0);

    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it('should fetch data just once and return the same data for both (Firehose first)', async () => {
    const resources = [
      {
        prop: 'pods',
        kind: 'Pod',
        isList: true,
        namespace: 'my-namespace',
      },
      {
        prop: 'pod',
        kind: 'Pod',
        namespace: 'my-namespace',
        name: 'my-pod',
      },
    ];
    const initResources: WatchK8sResources<{}> = {
      pods: {
        kind: 'Pod',
        namespace: 'my-namespace',
        isList: true,
      },
      pod: {
        kind: 'Pod',
        namespace: 'my-namespace',
        name: 'my-pod',
      },
    };

    render(
      <Wrapper>
        <Firehose resources={resources}>
          <Child />
        </Firehose>
        <WatchResources initResources={initResources} />
      </Wrapper>,
    );

    // Finish API calls
    await act(async () => jest.runAllTimers());

    // Assert that API calls are just triggered once
    expect(k8sListMock).toHaveBeenCalledTimes(1);
    expect(k8sListMock.mock.calls[0]).toEqual([
      PodModel,
      { cluster: 'local-cluster', limit: 250, ns: 'my-namespace' },
      true,
      {},
      'local-cluster',
    ]);
    k8sListMock.mockClear();

    expect(k8sGetMock).toHaveBeenCalledTimes(1);
    expect(k8sGetMock.mock.calls[0]).toEqual([
      PodModel,
      'my-pod',
      'my-namespace',
      { cluster: 'local-cluster' },
      {},
    ]);
    k8sGetMock.mockClear();

    // Components was rendered the right amount of time (loaded: false, loaded: true)
    expect(firehoseUpdate).toHaveBeenCalledTimes(3);
    expect(resourcesUpdate).toHaveBeenCalledTimes(3);
    const lastFirehoseChildProps = firehoseUpdate.mock.calls[2][0];
    const lastUseResourcesHookResult = resourcesUpdate.mock.calls[2][0];
    firehoseUpdate.mockClear();
    resourcesUpdate.mockClear();

    // Tests earlier checks the exact format, we focus here on comparing the data instances
    expect(lastFirehoseChildProps.pods).toBeTruthy();
    expect(lastFirehoseChildProps.pod).toBeTruthy();
    expect(lastUseResourcesHookResult.pods).toBeTruthy();
    expect(lastUseResourcesHookResult.pod).toBeTruthy();

    // Result objects looks different for list (not a requirement, but the status quo)
    expect(lastFirehoseChildProps.pods).not.toEqual(lastUseResourcesHookResult.pods);
    // but is the same for single items at the moment (also not a requirement, but the status quo)
    expect(lastFirehoseChildProps.pod).toEqual(lastUseResourcesHookResult.pod);
    expect(lastFirehoseChildProps.pod).not.toBe(lastUseResourcesHookResult.pod);

    // The data should be the same!
    expect(lastFirehoseChildProps.pods.data).toEqual(lastUseResourcesHookResult.pods.data);
    expect(lastFirehoseChildProps.pod.data).toEqual(lastUseResourcesHookResult.pod.data);

    // And they also should return the same instance for lists
    expect(lastFirehoseChildProps.pods.data).not.toBe(lastUseResourcesHookResult.pods.data); // Could be the same!
    expect(lastFirehoseChildProps.pods.data[0]).not.toBe(lastUseResourcesHookResult.pods.data[0]); // Should be the same!!!
    expect(lastFirehoseChildProps.pods.data[1]).not.toBe(lastUseResourcesHookResult.pods.data[1]); // Should be the same!!!
    expect(lastFirehoseChildProps.pods.data[2]).not.toBe(lastUseResourcesHookResult.pods.data[2]); // Should be the same!!!

    // And they also should return the same instance for single items
    expect(lastFirehoseChildProps.pod.data).not.toBe(lastUseResourcesHookResult.pod.data); // Should be the same, or?
  });

  it('should fetch data just once and return the same data for both (useK8sWatchResources first)', async () => {
    const initResources: WatchK8sResources<{}> = {
      pods: {
        kind: 'Pod',
        namespace: 'my-namespace',
        isList: true,
      },
      pod: {
        kind: 'Pod',
        namespace: 'my-namespace',
        name: 'my-pod',
      },
    };
    const resources = [
      {
        prop: 'pods',
        kind: 'Pod',
        isList: true,
        namespace: 'my-namespace',
      },
      {
        prop: 'pod',
        kind: 'Pod',
        namespace: 'my-namespace',
        name: 'my-pod',
      },
    ];

    render(
      <Wrapper>
        <WatchResources initResources={initResources} />
        <Firehose resources={resources}>
          <Child />
        </Firehose>
      </Wrapper>,
    );

    // Finish API calls
    await act(async () => jest.runAllTimers());

    // Assert that API calls are just triggered once
    expect(k8sListMock).toHaveBeenCalledTimes(1);
    expect(k8sListMock.mock.calls[0]).toEqual([
      PodModel,
      { cluster: 'local-cluster', limit: 250, ns: 'my-namespace' },
      true,
      {},
      'local-cluster',
    ]);
    k8sListMock.mockClear();

    expect(k8sGetMock).toHaveBeenCalledTimes(1);
    expect(k8sGetMock.mock.calls[0]).toEqual([
      PodModel,
      'my-pod',
      'my-namespace',
      { cluster: 'local-cluster' },
      {},
    ]);
    k8sGetMock.mockClear();

    // Components was rendered the right amount of time (loaded: false, loaded: true)
    expect(firehoseUpdate).toHaveBeenCalledTimes(3);
    expect(resourcesUpdate).toHaveBeenCalledTimes(4);
    const lastFirehoseChildProps = firehoseUpdate.mock.calls[2][0];
    const lastUseResourcesHookResult = resourcesUpdate.mock.calls[3][0];
    firehoseUpdate.mockClear();
    resourcesUpdate.mockClear();

    // Tests earlier checks the exact format, we focus here on comparing the data instances
    expect(lastFirehoseChildProps.pods).toBeTruthy();
    expect(lastFirehoseChildProps.pod).toBeTruthy();
    expect(lastUseResourcesHookResult.pods).toBeTruthy();
    expect(lastUseResourcesHookResult.pod).toBeTruthy();

    // Result objects looks different for list (not a requirement, but the status quo)
    expect(lastFirehoseChildProps.pods).not.toEqual(lastUseResourcesHookResult.pods);
    // but is the same for single items at the moment (also not a requirement, but the status quo)
    expect(lastFirehoseChildProps.pod).toEqual(lastUseResourcesHookResult.pod);
    expect(lastFirehoseChildProps.pod).not.toBe(lastUseResourcesHookResult.pod);

    // The data should be the same!
    expect(lastFirehoseChildProps.pods.data).toEqual(lastUseResourcesHookResult.pods.data);
    expect(lastFirehoseChildProps.pod.data).toEqual(lastUseResourcesHookResult.pod.data);

    // And they also should return the same instance for lists
    expect(lastFirehoseChildProps.pods.data).not.toBe(lastUseResourcesHookResult.pods.data); // Could be the same!
    expect(lastFirehoseChildProps.pods.data[0]).not.toBe(lastUseResourcesHookResult.pods.data[0]); // Should be the same!!!
    expect(lastFirehoseChildProps.pods.data[1]).not.toBe(lastUseResourcesHookResult.pods.data[1]); // Should be the same!!!
    expect(lastFirehoseChildProps.pods.data[2]).not.toBe(lastUseResourcesHookResult.pods.data[2]); // Should be the same!!!

    // And they also should return the same instance for single items
    expect(lastFirehoseChildProps.pod.data).not.toBe(lastUseResourcesHookResult.pod.data); // Should be the same, or?
  });

  // Regression test for "Git import page crashes after load" on 4.9
  // https://bugzilla.redhat.com/show_bug.cgi?id=2069621
  describe('regression test for bug #2069621', () => {
    // This reproduce the original issue
    it('should return an array for Firehose isList=true even when useK8sWatchResources isList=false is called without a name (Firehose first)', async () => {
      const resources = [
        {
          prop: 'pods',
          kind: 'Pod',
          isList: true,
          namespace: 'my-namespace',
        },
      ];
      const initResources: WatchK8sResources<{}> = {
        pods: {
          kind: 'Pod',
          namespace: 'my-namespace',
          name: '', // Should not be supported by the API, but this happens sometimes
          isList: false,
          optional: true,
        },
      };

      render(
        <Wrapper>
          <Firehose resources={resources}>
            <Child />
          </Firehose>
          <WatchResources initResources={initResources} />
        </Wrapper>,
      );

      // Finish API calls
      await act(async () => jest.runAllTimers());

      // Assert that API calls are just triggered once
      expect(k8sListMock).toHaveBeenCalledTimes(1);
      expect(k8sListMock.mock.calls[0]).toEqual([
        PodModel,
        { cluster: 'local-cluster', limit: 250, ns: 'my-namespace' },
        true,
        {},
        'local-cluster',
      ]);
      k8sListMock.mockClear();

      // Components was rendered the right amount of time (loaded: false, loaded: true)
      expect(firehoseUpdate).toHaveBeenCalledTimes(2);
      const lastFirehoseChildProps = firehoseUpdate.mock.calls[1][0];
      firehoseUpdate.mockClear();

      expect(resourcesUpdate).toHaveBeenCalledTimes(2);
      const lastUseResourcesHookResult = resourcesUpdate.mock.calls[1][0];
      resourcesUpdate.mockClear();

      // But the Firehose call defines isList correctly and should still work
      // and should return an array.
      expect(lastFirehoseChildProps.pods).toEqual({
        kind: 'Pod',
        data: ['my-pod1', 'my-pod2', 'my-pod3'].map((name) => ({
          apiVersion: 'v1',
          kind: 'Pod',
          metadata: {
            name,
            namespace: 'my-namespace',
            resourceVersion: '123',
          },
        })),
        loaded: true,
        loadError: '',
        filters: {},
        selected: null,
        optional: undefined,
      });

      // The hook should not return any data because the name is missing!
      // Instead it returns the internal redux state of the list above as object.
      expect(lastUseResourcesHookResult.pods).toEqual({
        loaded: true,
        loadError: '',
        data: {
          '(my-namespace)-my-pod1': {
            apiVersion: 'v1',
            kind: 'Pod',
            metadata: { name: 'my-pod1', namespace: 'my-namespace', resourceVersion: '123' },
          },
          '(my-namespace)-my-pod2': {
            apiVersion: 'v1',
            kind: 'Pod',
            metadata: { name: 'my-pod2', namespace: 'my-namespace', resourceVersion: '123' },
          },
          '(my-namespace)-my-pod3': {
            apiVersion: 'v1',
            kind: 'Pod',
            metadata: { name: 'my-pod3', namespace: 'my-namespace', resourceVersion: '123' },
          },
        },
      });
    });

    // And this 3 cases tests against other call orders / isList=true/false combinations...
    it('should return an array for Firehose isList=true even when useK8sWatchResources isList=false is called without a name (useK8sWatchResources first)', async () => {
      const initResources: WatchK8sResources<{}> = {
        pods: {
          kind: 'Pod',
          namespace: 'my-namespace',
          name: '', // Should not be supported by the API, but this happens sometimes
          isList: false,
          optional: true,
        },
      };
      const resources = [
        {
          prop: 'pods',
          kind: 'Pod',
          isList: true,
          namespace: 'my-namespace',
        },
      ];

      render(
        <Wrapper>
          <WatchResources initResources={initResources} />
          <Firehose resources={resources}>
            <Child />
          </Firehose>
        </Wrapper>,
      );

      // Finish API calls
      await act(async () => jest.runAllTimers());

      // Assert that API calls are just triggered once
      expect(k8sListMock).toHaveBeenCalledTimes(1);
      expect(k8sListMock.mock.calls[0]).toEqual([
        PodModel,
        { cluster: 'local-cluster', limit: 250, ns: 'my-namespace' },
        true,
        {},
        'local-cluster',
      ]);
      k8sListMock.mockClear();

      // Components was rendered the right amount of time (loaded: false, loaded: true)
      expect(resourcesUpdate).toHaveBeenCalledTimes(3);
      const lastUseResourcesHookResult = resourcesUpdate.mock.calls[2][0];
      resourcesUpdate.mockClear();

      expect(firehoseUpdate).toHaveBeenCalledTimes(2);
      const lastFirehoseChildProps = firehoseUpdate.mock.calls[1][0];
      firehoseUpdate.mockClear();

      // The hook could not return any data because the name is missing.
      expect(lastUseResourcesHookResult.pods).toEqual({
        loaded: true,
        loadError: '',
        data: {
          '(my-namespace)-my-pod1': {
            apiVersion: 'v1',
            kind: 'Pod',
            metadata: { name: 'my-pod1', namespace: 'my-namespace', resourceVersion: '123' },
          },
          '(my-namespace)-my-pod2': {
            apiVersion: 'v1',
            kind: 'Pod',
            metadata: { name: 'my-pod2', namespace: 'my-namespace', resourceVersion: '123' },
          },
          '(my-namespace)-my-pod3': {
            apiVersion: 'v1',
            kind: 'Pod',
            metadata: { name: 'my-pod3', namespace: 'my-namespace', resourceVersion: '123' },
          },
        },
      });

      // But the Firehose call defines isList correctly and should still work
      // and should return an array.
      expect(lastFirehoseChildProps.pods).toEqual({
        kind: 'Pod',
        data: ['my-pod1', 'my-pod2', 'my-pod3'].map((name) => ({
          apiVersion: 'v1',
          kind: 'Pod',
          metadata: {
            name,
            namespace: 'my-namespace',
            resourceVersion: '123',
          },
        })),
        loaded: true,
        loadError: '',
        filters: {},
        selected: null,
        optional: undefined,
      });
    });

    // FIXME crashs
    it.skip('should return an array for useK8sWatchResources isList=true even when Firehose isList=false is called without a name (Firehose first)', async () => {
      // Without a name the k8sGet API is called, but it returns a list anyway.
      k8sGetMock.mockReturnValue(Promise.resolve(podList));

      const resources = [
        {
          prop: 'pods',
          kind: 'Pod',
          isList: false,
          namespace: 'my-namespace',
          name: '',
        },
      ];
      const initResources: WatchK8sResources<{}> = {
        pods: {
          kind: 'Pod',
          namespace: 'my-namespace',
          isList: true,
        },
      };

      render(
        <Wrapper>
          <Firehose resources={resources}>
            <Child />
          </Firehose>
          <WatchResources initResources={initResources} />
        </Wrapper>,
      );

      // Finish API calls
      await act(async () => jest.runAllTimers());

      // Assert that API calls are just triggered once
      expect(k8sGetMock).toHaveBeenCalledTimes(1);
      expect(k8sGetMock.mock.calls[0]).toEqual([
        PodModel,
        '', // Without a name above this calls the get api, but it still returns a list.
        'my-namespace',
        { cluster: 'local-cluster' },
        {},
      ]);
      k8sGetMock.mockClear();

      // Components was rendered the right amount of time (loaded: false, loaded: true)
      expect(firehoseUpdate).toHaveBeenCalledTimes(2);
      const lastFirehoseChildProps = firehoseUpdate.mock.calls[1][0];
      firehoseUpdate.mockClear();

      expect(resourcesUpdate).toHaveBeenCalledTimes(2);
      const lastUseResourcesHookResult = resourcesUpdate.mock.calls[1][0];
      resourcesUpdate.mockClear();

      // The Firehose call defines isList=false, so it returns the full API response.
      expect(lastFirehoseChildProps.pods).toEqual({
        data: {
          apiVersion: 'v1',
          items: [
            {
              apiVersion: 'v1',
              kind: 'Pod',
              metadata: { name: 'my-pod1', namespace: 'my-namespace', resourceVersion: '123' },
            },
            {
              apiVersion: 'v1',
              kind: 'Pod',
              metadata: { name: 'my-pod2', namespace: 'my-namespace', resourceVersion: '123' },
            },
            {
              apiVersion: 'v1',
              kind: 'Pod',
              metadata: { name: 'my-pod3', namespace: 'my-namespace', resourceVersion: '123' },
            },
          ],
          kind: 'PodList',
          metadata: { resourceVersion: '123' },
        },
        loaded: true,
        loadError: '',
        optional: undefined,
      });

      // But the hook defines isList=true and converts it automatically to an array.
      // At the moment it doesn't extract the 'values' key.
      expect(lastUseResourcesHookResult.pods).toEqual({
        loaded: true,
        loadError: '',
        data: [
          'v1',
          'PodList',
          [
            {
              apiVersion: 'v1',
              kind: 'Pod',
              metadata: { name: 'my-pod1', namespace: 'my-namespace', resourceVersion: '123' },
            },
            {
              apiVersion: 'v1',
              kind: 'Pod',
              metadata: { name: 'my-pod2', namespace: 'my-namespace', resourceVersion: '123' },
            },
            {
              apiVersion: 'v1',
              kind: 'Pod',
              metadata: { name: 'my-pod3', namespace: 'my-namespace', resourceVersion: '123' },
            },
          ],
          { resourceVersion: '123' },
        ],
      });
    });

    // FIXME crashs
    it.skip('should return an array for useK8sWatchResources isList=true even when Firehose isList=false is called without a name (useK8sWatchResources first)', async () => {
      // Without a name the k8sGet API is called, but it returns a list anyway.
      k8sGetMock.mockReturnValue(Promise.resolve(podList));

      const initResources: WatchK8sResources<{}> = {
        pods: {
          kind: 'Pod',
          namespace: 'my-namespace',
          isList: true,
          optional: true,
        },
      };
      const resources = [
        {
          prop: 'pods',
          kind: 'Pod',
          isList: false,
          namespace: 'my-namespace',
          name: '',
        },
      ];

      render(
        <Wrapper>
          <WatchResources initResources={initResources} />
          <Firehose resources={resources}>
            <Child />
          </Firehose>
        </Wrapper>,
      );

      // Finish API calls
      await act(async () => jest.runAllTimers());

      expect(k8sGetMock).toHaveBeenCalledTimes(1);
      expect(k8sGetMock.mock.calls[0]).toEqual([
        PodModel,
        '', // Without a name above this calls the get api, but it still returns a list.
        'my-namespace',
        { cluster: 'local-cluster' },
        {},
      ]);
      k8sGetMock.mockClear();

      // Components was rendered the right amount of time (loaded: false, loaded: true)
      expect(resourcesUpdate).toHaveBeenCalledTimes(3);
      const lastUseResourcesHookResult = resourcesUpdate.mock.calls[2][0];
      resourcesUpdate.mockClear();

      expect(firehoseUpdate).toHaveBeenCalledTimes(2);
      const lastFirehoseChildProps = firehoseUpdate.mock.calls[1][0];
      firehoseUpdate.mockClear();

      // The hook could not return any data because the name is missing.
      expect(lastUseResourcesHookResult.pods).toEqual({
        data: [
          'v1',
          'PodList',
          [
            {
              apiVersion: 'v1',
              kind: 'Pod',
              metadata: { name: 'my-pod1', namespace: 'my-namespace', resourceVersion: '123' },
            },
            {
              apiVersion: 'v1',
              kind: 'Pod',
              metadata: { name: 'my-pod2', namespace: 'my-namespace', resourceVersion: '123' },
            },
            {
              apiVersion: 'v1',
              kind: 'Pod',
              metadata: { name: 'my-pod3', namespace: 'my-namespace', resourceVersion: '123' },
            },
          ],
          { resourceVersion: '123' },
        ],
        loadError: '',
        loaded: true,
      });

      // But Firehose can return a pod when  call defines isList correctly and should still work
      // and should get an array.
      expect(lastFirehoseChildProps.pods).toEqual({
        data: {
          apiVersion: 'v1',
          items: [
            {
              apiVersion: 'v1',
              kind: 'Pod',
              metadata: { name: 'my-pod1', namespace: 'my-namespace', resourceVersion: '123' },
            },
            {
              apiVersion: 'v1',
              kind: 'Pod',
              metadata: { name: 'my-pod2', namespace: 'my-namespace', resourceVersion: '123' },
            },
            {
              apiVersion: 'v1',
              kind: 'Pod',
              metadata: { name: 'my-pod3', namespace: 'my-namespace', resourceVersion: '123' },
            },
          ],
          kind: 'PodList',
          metadata: { resourceVersion: '123' },
        },
        loaded: true,
        loadError: '',
        optional: undefined,
      });
    });
  });
});
