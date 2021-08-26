import * as React from 'react';
import { Select } from '@patternfly/react-core';
import { shallow, ShallowWrapper } from 'enzyme';
import { useExtensions } from '@console/plugin-sdk/src';
import PerspectiveDropdown from '../PerspectiveDropdown';
import { usePreferredPerspective } from '../usePreferredPerspective';
import { mockPerspectiveExtensions } from './perspective.data';

jest.mock('@console/plugin-sdk/src/api/useExtensions', () => ({
  useExtensions: jest.fn(),
}));

jest.mock('../usePreferredPerspective', () => ({
  usePreferredPerspective: jest.fn(),
}));

const useExtensionsMock = useExtensions as jest.Mock;
const usePreferredPerspectiveMock = usePreferredPerspective as jest.Mock;

describe('PerspectiveDropdown', () => {
  let wrapper: ShallowWrapper;
  const {
    id: preferredPerspectiveValue,
    name: preferredPerspectiveLabel,
  } = mockPerspectiveExtensions[1].properties;

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should render skeleton if user preferences have not loaded', () => {
    useExtensionsMock.mockReturnValue(mockPerspectiveExtensions);
    usePreferredPerspectiveMock.mockReturnValue(['', jest.fn(), false]);
    wrapper = shallow(<PerspectiveDropdown />);
    expect(
      wrapper.find('[data-test="dropdown skeleton console.preferredPerspective"]').exists(),
    ).toBeTruthy();
  });

  it('should render select with value corresponding to preferred perspective if user preferences have loaded and preferred perspective is defined', () => {
    useExtensionsMock.mockReturnValue(mockPerspectiveExtensions);
    usePreferredPerspectiveMock.mockReturnValue([preferredPerspectiveValue, jest.fn(), true]);
    wrapper = shallow(<PerspectiveDropdown />);
    expect(
      wrapper.find('[data-test="dropdown console.preferredPerspective"]').exists(),
    ).toBeTruthy();
    expect(wrapper.find(Select).props().selections).toBe(preferredPerspectiveLabel);
  });

  it('should render select with value "Last viewed" if user preferences have loaded but preferred perspective is not defined', () => {
    useExtensionsMock.mockReturnValue(mockPerspectiveExtensions);
    usePreferredPerspectiveMock.mockReturnValue([undefined, jest.fn(), true]);
    wrapper = shallow(<PerspectiveDropdown />);
    expect(
      wrapper.find('[data-test="dropdown console.preferredPerspective"]').exists(),
    ).toBeTruthy();
    expect(wrapper.find(Select).props().selections).toEqual('Last viewed');
  });
});
