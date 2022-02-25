import * as React from 'react';
import { act } from 'react-dom/test-utils';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { mount } from 'enzyme';

import { setPluginStore } from '@console/dynamic-plugin-sdk/src/utils/k8s';
import storeHandler from '@console/dynamic-plugin-sdk/src/app/storeHandler';

import { ResourceListPage, ResourceDetailsPage } from '../../public/components/resource-list';
import { useNamespaceExist } from '../../public/components/namespace';
import store from '../../public/redux';
import { receivedResources } from '../../public/actions/k8s';
import { PodModel } from '../../public/models';

jest.mock('../../public/components/namespace', () => ({
  ...require.requireActual('../../public/components/namespace'),
  useNamespaceExist: jest.fn(),
}));

const useNamespaceExistMock = useNamespaceExist as jest.Mock;

const Wrapper: React.FC<{}> = ({ children }) => (
  <MemoryRouter>
    <Provider store={store}>{children}</Provider>
  </MemoryRouter>
);

beforeAll(() => {
  setPluginStore({ getExtensionsInUse: () => [] });
  // setUtilsConfig({ appFetch: appFetchMock });
  storeHandler.setStore(store);
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
});

beforeEach(() => {
  jest.useFakeTimers();
  jest.resetAllMocks();
});

afterEach(async () => {
  // Ensure that there is no timer left which triggers a rerendering
  await act(async () => jest.runAllTimers());
  jest.clearAllTimers();
  jest.useRealTimers();
});

describe('ResourceListPage', () => {
  it('should render nothing if the namespace exist and the model is known', async () => {
    useNamespaceExistMock.mockReturnValue([true, true, undefined]);

    const wrapper = mount(
      <Wrapper>
        <ResourceListPage
          flags={undefined}
          match={{
            params: {
              ns: 'existing-namespace',
              plural: 'pods',
            },
            isExact: true,
            path: '',
            url: '',
          }}
        />
      </Wrapper>,
    );

    expect(wrapper.text()).toEqual('');
  });

  it('should render "Page not found" if the namespace exist and the model is unknown', async () => {
    useNamespaceExistMock.mockReturnValue([true, true, undefined]);

    const wrapper = mount(
      <Wrapper>
        <ResourceListPage
          flags={undefined}
          match={{
            params: {
              ns: 'existing-namespace',
              plural: 'unknown-model',
            },
            isExact: true,
            path: '',
            url: '',
          }}
        />
      </Wrapper>,
    );

    expect(wrapper.text()).toContain('Error404: Page Not Found');
    expect(wrapper.text()).toContain(
      'The server doesn\'t have a resource type "unknown-model". Try refreshing the page if it was recently added.',
    );
  });

  it('should render "Namespace not found" if the namespace does not exist', async () => {
    useNamespaceExistMock.mockReturnValue([false, true, undefined]);

    const wrapper = mount(
      <Wrapper>
        <ResourceListPage
          flags={undefined}
          match={{
            params: {
              ns: 'nonexisting-namespace',
              plural: 'pods',
            },
            isExact: true,
            path: '',
            url: '',
          }}
        />
      </Wrapper>,
    );

    expect(wrapper.text()).toEqual('404: Namespace not found');
  });
});

describe('ResourceDetailsPage', () => {
  it('should render nothing if the namespace exist and the model is known', async () => {
    useNamespaceExistMock.mockReturnValue([true, true, undefined]);

    const wrapper = mount(
      <Wrapper>
        <ResourceDetailsPage
          match={{
            params: {
              ns: 'existing-namespace',
              name: 'existing-pod',
              plural: 'pods',
            },
            isExact: true,
            path: '',
            url: '',
          }}
        />
      </Wrapper>,
    );

    // The pod detail pages fetches some data.
    await act(async () => jest.runAllTimers());

    expect(wrapper.text()).toEqual('');
  });

  it('should render render "Page Not Found" if the namespace exist but the model is unknown', async () => {
    useNamespaceExistMock.mockReturnValue([true, true, undefined]);

    const wrapper = mount(
      <Wrapper>
        <ResourceDetailsPage
          match={{
            params: {
              ns: 'existing-namespace',
              name: 'existing-pod',
              plural: 'unknown-model',
            },
            isExact: true,
            path: '',
            url: '',
          }}
        />
      </Wrapper>,
    );

    expect(wrapper.text()).toContain('Error404: Page Not Found');
  });

  it('should render "Namespace not found" if the namespace does not exist', async () => {
    useNamespaceExistMock.mockReturnValue([false, true, undefined]);

    const wrapper = mount(
      <Wrapper>
        <ResourceDetailsPage
          match={{
            params: {
              ns: 'nonexisting-namespace',
              name: 'ignored-pod-name',
              plural: 'pods',
            },
            isExact: true,
            path: '',
            url: '',
          }}
        />
      </Wrapper>,
    );

    expect(wrapper.text()).toEqual('404: Namespace not found');
  });
});
