import * as React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';
import { useProjectOrNamespaceModel } from '@console/internal/components/utils';
import { NamespaceDropdown } from '@console/shared/src/components/namespace';
import { usePreferredNamespace } from '../usePreferredNamespace';
import UserPreferenceNamespaceDropdown from '../UserPreferenceNamespaceDropdown';

jest.mock('react-i18next', () => {
  const reactI18next = require.requireActual('react-i18next');
  return {
    ...reactI18next,
    useTranslation: () => ({
      t: (key: string) => key,
    }),
  };
});

jest.mock('../usePreferredNamespace', () => ({
  usePreferredNamespace: jest.fn(),
}));

jest.mock('@console/internal/components/utils/list-dropdown', () => ({
  useProjectOrNamespaceModel: jest.fn(),
}));

const mockUsePreferredNamespace = usePreferredNamespace as jest.Mock;
const mockUseProjectOrNamespaceModel = useProjectOrNamespaceModel as jest.Mock;
const i18nPrefix = 'console-app~';

describe('NamespaceDropdown', () => {
  let wrapper: ShallowWrapper;
  const preferredNamespace: string = 'preferred-ns';

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should render skeleton if extensions have not loaded', () => {
    mockUsePreferredNamespace.mockReturnValue(['', jest.fn(), false]);
    mockUseProjectOrNamespaceModel.mockReturnValue([{ kind: 'Project' }, true]);
    wrapper = shallow(<UserPreferenceNamespaceDropdown />);
    expect(
      wrapper.find('[data-test="dropdown skeleton console.preferredNamespace"]').exists(),
    ).toBeTruthy();
  });

  it('should render NamespaceDropdown with preferred namespace selected if extensions have loaded and user preference for namespace is defined', () => {
    mockUseProjectOrNamespaceModel.mockReturnValue([{ kind: 'Project' }, true]);
    mockUsePreferredNamespace.mockReturnValue([preferredNamespace, jest.fn(), true]);
    wrapper = shallow(<UserPreferenceNamespaceDropdown />);
    expect(wrapper.find('[data-test="dropdown console.preferredNamespace"]').exists()).toBeTruthy();
    expect(wrapper.find(NamespaceDropdown).props().selected).toEqual(preferredNamespace);
  });

  it('should render NamespaceDropdown with last viewed key selected if extensions have loaded but user preference for namespace is not defined', () => {
    mockUseProjectOrNamespaceModel.mockReturnValue([{ kind: 'Project' }, true]);
    mockUsePreferredNamespace.mockReturnValue([undefined, jest.fn(), true]);
    wrapper = shallow(<UserPreferenceNamespaceDropdown />);
    expect(wrapper.find('[data-test="dropdown console.preferredNamespace"]').exists()).toBeTruthy();
    expect(wrapper.find(NamespaceDropdown).props().selected).toEqual(`${i18nPrefix}Last viewed`);
  });
});
