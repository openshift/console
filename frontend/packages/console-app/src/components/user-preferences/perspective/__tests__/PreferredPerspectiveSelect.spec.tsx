import { screen, configure, act } from '@testing-library/react';
import { useExtensions } from '@console/plugin-sdk/src';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
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
  const {
    id: preferredPerspectiveValue,
    name: preferredPerspectiveLabel,
  } = mockPerspectiveExtensions[1].properties;

  const setupMocks = (preferredPerspective?: string, loaded = true) => {
    useExtensionsMock.mockReturnValue(mockPerspectiveExtensions);
    usePreferredPerspectiveMock.mockReturnValue([preferredPerspective, jest.fn(), loaded]);
  };

  beforeAll(() => {
    configure({ testIdAttribute: 'data-test' });
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render skeleton when user preferences are loading', async () => {
    setupMocks('', false);

    await act(async () => {
      renderWithProviders(<PreferredPerspectiveSelect />);
    });

    expect(screen.getByTestId('select skeleton console.preferredPerspective')).toBeInTheDocument();
  });

  it('should display selected perspective when set', async () => {
    setupMocks(preferredPerspectiveValue, true);

    await act(async () => {
      renderWithProviders(<PreferredPerspectiveSelect />);
    });

    expect(screen.getByText(preferredPerspectiveLabel)).toBeVisible();
  });

  it('should display "Last viewed" when no preferred perspective is set', async () => {
    setupMocks(undefined, true);

    await act(async () => {
      renderWithProviders(<PreferredPerspectiveSelect />);
    });

    expect(screen.getByText('Last viewed')).toBeInTheDocument();
  });
});
