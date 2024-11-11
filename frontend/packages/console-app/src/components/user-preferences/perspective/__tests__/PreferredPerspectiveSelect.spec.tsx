import * as React from 'react';
import { render, screen, configure } from '@testing-library/react';
import { useExtensions } from '@console/plugin-sdk/src';
import PreferredPerspectiveSelect from '../PreferredPerspectiveSelect';
import { usePreferredPerspective } from '../usePreferredPerspective';
import { mockPerspectiveExtensions } from './perspective.data';

jest.mock('@console/plugin-sdk/src/api/useExtensions', () => ({
  useExtensions: jest.fn(),
}));

jest.mock('../usePreferredPerspective', () => ({
  usePreferredPerspective: jest.fn(),
}));

jest.mock('@console/shared/src/hooks/useTelemetry', () => ({
  useTelemetry: () => {},
}));

const useExtensionsMock = useExtensions as jest.Mock;
const usePreferredPerspectiveMock = usePreferredPerspective as jest.Mock;

describe('PreferredPerspectiveSelect', () => {
  configure({
    testIdAttribute: 'data-test',
  });

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
    render(<PreferredPerspectiveSelect />);
    expect(screen.findByTestId('select skeleton console.preferredPerspective')).toBeTruthy();
  });

  it('should render select with value corresponding to preferred perspective if user preferences have loaded and preferred perspective is defined', () => {
    useExtensionsMock.mockReturnValue(mockPerspectiveExtensions);
    usePreferredPerspectiveMock.mockReturnValue([preferredPerspectiveValue, jest.fn(), true]);
    render(<PreferredPerspectiveSelect />);
    expect(screen.findByTestId('select console.preferredPerspective')).toBeTruthy();
    expect(screen.findByText(preferredPerspectiveLabel)).toBeTruthy();
  });

  it('should render select with value "Last viewed" if user preferences have loaded but preferred perspective is not defined', () => {
    useExtensionsMock.mockReturnValue(mockPerspectiveExtensions);
    usePreferredPerspectiveMock.mockReturnValue([undefined, jest.fn(), true]);
    render(<PreferredPerspectiveSelect />);
    expect(screen.findByTestId('select console.preferredPerspective"]')).toBeTruthy();
    expect(screen.findByText('Last viewed')).toBeTruthy();
  });
});
