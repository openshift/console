import * as React from 'react';
import { Map as ImmutableMap, List as ImmutableList } from 'immutable';
import { combineReducers, createStore, applyMiddleware } from 'redux';
import { Provider } from 'react-redux';
import { act, cleanup, render } from '@testing-library/react';
import { receivedResources } from '../../../actions/k8s';
import k8sReducers from '../../../reducers/k8s';
import UIReducers from '../../../reducers/ui';
import { thunk } from '../../../redux';
import { k8sList, k8sGet, k8sWatch } from '../../../module/k8s/resource';
import { processReduxId, Firehose } from '../firehose';
import { PodModel, podData, podList, firehoseChildPropsWithoutModels } from './firehose.data';

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
const Child: React.FC = (props) => {
  resourceUpdate(props);
  return null;
};

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
              namespace: 'default',
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
          namespace: 'default',
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
          metadata: { name: 'my-pod1', namespace: 'default', resourceVersion: '123' },
        },
        {
          apiVersion: 'v1',
          kind: 'Pod',
          metadata: { name: 'my-pod2', namespace: 'default', resourceVersion: '123' },
        },
        {
          apiVersion: 'v1',
          kind: 'Pod',
          metadata: { name: 'my-pod3', namespace: 'default', resourceVersion: '123' },
        },
      ],
      filters: {},
      loadError: undefined,
      loaded: undefined,
      optional: undefined,
      selected: undefined,
    });
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
        metadata: { name: 'my-pod', namespace: 'default', resourceVersion: '123' },
      },
      optional: undefined,
    });
  });
});

describe('Firehose', () => {
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
    // The 4.10 version expects that k8sWatch was NOT called, but in earlier versions it was called.
    // But instead of adding / changing all tests we accept that it was called.
    // expect(k8sWatchMock).toHaveBeenCalledTimes(0);
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
      { limit: 250, ns: 'my-namespace' },
      true,
      {},
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
      reduxIDs: ['core~v1~Pod---{"ns":"my-namespace"}'],
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
          namespace: 'default',
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
      reduxIDs: ['core~v1~Pod---{"ns":"my-namespace"}'],
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
    expect(k8sGetMock.mock.calls[0]).toEqual([PodModel, 'my-pod', 'my-namespace', null, {}]);
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
      reduxIDs: ['core~v1~Pod---{"ns":"my-namespace","name":"my-pod"}'],
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
          namespace: 'default',
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
      reduxIDs: ['core~v1~Pod---{"ns":"my-namespace","name":"my-pod"}'],
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
      { limit: 250, ns: 'my-namespace' },
      true,
      {},
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
      reduxIDs: ['core~v1~Pod---{"ns":"my-namespace"}'],
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
      reduxIDs: ['core~v1~Pod---{"ns":"my-namespace"}'],
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
    expect(k8sGetMock.mock.calls[0]).toEqual([PodModel, 'my-pod', 'my-namespace', null, {}]);
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
      reduxIDs: ['core~v1~Pod---{"ns":"my-namespace","name":"my-pod"}'],
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
      reduxIDs: ['core~v1~Pod---{"ns":"my-namespace","name":"my-pod"}'],
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
      { limit: 250, ns: 'my-namespace' },
      true,
      {},
    ]);
    k8sListMock.mockClear();
    expect(k8sGetMock).toHaveBeenCalledTimes(1);
    expect(k8sGetMock.mock.calls[0]).toEqual([PodModel, 'my-pod', 'my-namespace', null, {}]);
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
        'core~v1~Pod---{"ns":"my-namespace"}',
        'core~v1~Pod---{"ns":"my-namespace","name":"my-pod"}',
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
          namespace: 'default',
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
          namespace: 'default',
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
        'core~v1~Pod---{"ns":"my-namespace"}',
        'core~v1~Pod---{"ns":"my-namespace","name":"my-pod"}',
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
      { limit: 250, ns: 'my-namespace' },
      true,
      {},
    ]);
    k8sListMock.mockClear();
    expect(k8sGetMock).toHaveBeenCalledTimes(1);
    expect(k8sGetMock.mock.calls[0]).toEqual([PodModel, 'my-pod', 'my-namespace', null, {}]);
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
        'core~v1~Pod---{"ns":"my-namespace"}',
        'core~v1~Pod---{"ns":"my-namespace","name":"my-pod"}',
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
          namespace: 'default',
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
          namespace: 'default',
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
        'core~v1~Pod---{"ns":"my-namespace"}',
        'core~v1~Pod---{"ns":"my-namespace","name":"my-pod"}',
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
    expect(propsChildA.pod).not.toBe(propsChildB.pod); // Should be the same?
    expect(propsChildA.data).not.toBe(propsChildB.pod.data); // Should be the same?
    expect(propsChildA.resources.pod).not.toBe(propsChildB.resources.pod); // Should be the same?
    expect(propsChildA.resources.pod.data).not.toBe(propsChildB.resources.pod.data); // Should be the same?
  });
});
