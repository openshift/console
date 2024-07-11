import * as React from 'react';
import { mount, ReactWrapper } from 'enzyme';
import { Provider } from 'react-redux';
import { useProjectOrNamespaceModel } from '@console/internal/components/utils';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { NamespaceModel } from '@console/internal/models';
import store from '@console/internal/redux';
import NamespaceMenuToggle from '@console/shared/src/components/namespace/NamespaceMenuToggle';
import NamespaceDropdown from '../NamespaceDropdown';
import { usePreferredNamespace } from '../usePreferredNamespace';
import { mockNamespaces } from './namespace.data';

jest.mock('@console/internal/components/utils/list-dropdown', () => ({
  useProjectOrNamespaceModel: jest.fn(),
}));

jest.mock('@console/internal/components/utils/k8s-watch-hook', () => ({
  useK8sWatchResource: jest.fn(),
}));

jest.mock('../usePreferredNamespace', () => ({
  usePreferredNamespace: jest.fn(),
}));

jest.mock('fuzzysearch', () => {
  return { default: jest.fn() };
});

jest.mock('@console/shared/src/hooks/useTelemetry', () => ({
  useTelemetry: () => {},
}));

const mockProjectOrNamespaceModel = useProjectOrNamespaceModel as jest.Mock;
const mockK8sWatchResource = useK8sWatchResource as jest.Mock;
const mockUsePreferredNamespace = usePreferredNamespace as jest.Mock;

describe('NamespaceDropdown', () => {
  let wrapper: ReactWrapper;
  const preferredNamespace: string = mockNamespaces[1].metadata.name;

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should render skeleton if extensions have not loaded', () => {
    mockProjectOrNamespaceModel.mockReturnValue([NamespaceModel, true]);
    mockK8sWatchResource.mockReturnValue([mockNamespaces, true, false]);
    mockUsePreferredNamespace.mockReturnValue(['', jest.fn(), false]);
    wrapper = mount(
      <Provider store={store}>
        <NamespaceDropdown />
      </Provider>,
    );
    expect(
      wrapper.find('[data-test="dropdown skeleton console.preferredNamespace"]').exists(),
    ).toBeTruthy();
  });

  it('should render menu with preferred namespace if extensions have loaded and user preference for namespace is defined', () => {
    mockProjectOrNamespaceModel.mockReturnValue([NamespaceModel, true]);
    mockK8sWatchResource.mockReturnValue([mockNamespaces, true, false]);
    mockUsePreferredNamespace.mockReturnValue([preferredNamespace, jest.fn(), true]);
    wrapper = mount(
      <Provider store={store}>
        <NamespaceDropdown />
      </Provider>,
    );
    expect(wrapper.find('[data-test="dropdown console.preferredNamespace"]').exists()).toBeTruthy();
    expect(wrapper.find(NamespaceMenuToggle).props().title).toEqual(preferredNamespace);
  });

  it('should render select with "Last viewed" if extensions have loaded but user preference for namespace is not defined', () => {
    mockProjectOrNamespaceModel.mockReturnValue([NamespaceModel, true]);
    mockK8sWatchResource.mockReturnValue([mockNamespaces, true, false]);
    mockUsePreferredNamespace.mockReturnValue([undefined, jest.fn(), true]);
    wrapper = mount(
      <Provider store={store}>
        <NamespaceDropdown />
      </Provider>,
    );
    expect(wrapper.find('[data-test="dropdown console.preferredNamespace"]').exists()).toBeTruthy();
    expect(wrapper.find(NamespaceMenuToggle).props().title).toEqual('Last viewed');
  });
});
