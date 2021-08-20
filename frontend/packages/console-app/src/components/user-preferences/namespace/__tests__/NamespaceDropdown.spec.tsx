import * as React from 'react';
import { Select } from '@patternfly/react-core';
import { shallow, ShallowWrapper } from 'enzyme';
import { useProjectOrNamespaceModel } from '@console/internal/components/utils';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { NamespaceModel } from '@console/internal/models';
import NamespaceDropdown from '../NamespaceDropdown';
import { usePreferredNamespace } from '../usePreferredNamespace';
import { mockNamespaces } from './namespace.data';

jest.mock('react-i18next', () => {
  const reactI18next = require.requireActual('react-i18next');
  return {
    ...reactI18next,
    useTranslation: () => ({ t: (key: string) => key }),
  };
});

jest.mock('@console/internal/components/utils/list-dropdown', () => ({
  useProjectOrNamespaceModel: jest.fn(),
}));

jest.mock('@console/internal/components/utils/k8s-watch-hook', () => ({
  useK8sWatchResource: jest.fn(),
}));

jest.mock('../usePreferredNamespace', () => ({
  usePreferredNamespace: jest.fn(),
}));

const mockProjectOrNamespaceModel = useProjectOrNamespaceModel as jest.Mock;
const mockK8sWatchResource = useK8sWatchResource as jest.Mock;
const mockUsePreferredNamespace = usePreferredNamespace as jest.Mock;
const i18nPrefix = 'console-app~';

describe('NamespaceDropdown', () => {
  let wrapper: ShallowWrapper;
  const preferredNamespace: string = mockNamespaces[1].metadata.name;

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should render skeleton if extensions have not loaded', () => {
    mockProjectOrNamespaceModel.mockReturnValue([NamespaceModel, true]);
    mockK8sWatchResource.mockReturnValue([mockNamespaces, true, false]);
    mockUsePreferredNamespace.mockReturnValue(['', jest.fn(), false]);
    wrapper = shallow(<NamespaceDropdown />);
    expect(
      wrapper.find('[data-test="dropdown skeleton console.preferredNamespace"]').exists(),
    ).toBeTruthy();
  });

  it('should render select with preferred namespace if extensions have loaded and user preference for namespace is defined', () => {
    mockProjectOrNamespaceModel.mockReturnValue([NamespaceModel, true]);
    mockK8sWatchResource.mockReturnValue([mockNamespaces, true, false]);
    mockUsePreferredNamespace.mockReturnValue([preferredNamespace, jest.fn(), true]);
    wrapper = shallow(<NamespaceDropdown />);
    expect(wrapper.find('[data-test="dropdown console.preferredNamespace"]').exists()).toBeTruthy();
    expect(wrapper.find(Select).props().selections).toEqual(preferredNamespace);
  });

  it('should render select with "Last viewed" if extensions have loaded but user preference for namespace is not defined', () => {
    mockProjectOrNamespaceModel.mockReturnValue([NamespaceModel, true]);
    mockK8sWatchResource.mockReturnValue([mockNamespaces, true, false]);
    mockUsePreferredNamespace.mockReturnValue([undefined, jest.fn(), true]);
    wrapper = shallow(<NamespaceDropdown />);
    expect(wrapper.find('[data-test="dropdown console.preferredNamespace"]').exists()).toBeTruthy();
    expect(wrapper.find(Select).props().selections).toEqual(`${i18nPrefix}Last viewed`);
  });
});
