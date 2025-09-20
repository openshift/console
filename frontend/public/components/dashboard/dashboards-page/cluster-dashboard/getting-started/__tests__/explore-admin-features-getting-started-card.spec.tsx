import { screen, configure, act } from '@testing-library/react';

import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import { ExploreAdminFeaturesGettingStartedCard } from '../explore-admin-features-getting-started-card';

jest.mock('react', () => ({
  ...jest.requireActual('react'),
  useLayoutEffect: jest.requireActual('react').useEffect,
}));

jest.mock('@console/shared/src', () => ({
  ...jest.requireActual('@console/shared/src'),
  useOpenShiftVersion: () => '4.16.0',
}));

// Workaround because getting-started exports also RestoreGettingStartedButton
jest.mock('@console/shared/src/hooks/useUserSettings', () => ({
  useUserSettings: jest.fn(() => [null, jest.fn(), false]),
}));

// Workaround because getting-started exports also QuickStartGettingStartedCard
jest.mock(
  '@console/app/src/components/quick-starts/loader/QuickStartsLoader',
  () =>
    function QuickStartsLoaderMock({ children }) {
      return children;
    },
);

jest.mock('@console/shared/src/hooks/flag', () => ({
  useFlag: jest.fn(),
}));

// Get the mocked version after the mock is set up
const { useFlag } = require('@console/shared/src/hooks/flag');
const mockUseFlag = useFlag as jest.Mock;

describe('ExploreAdminFeaturesGettingStartedCard', () => {
  beforeAll(() => {
    configure({ testIdAttribute: 'data-test' });
  });

  beforeEach(() => {
    mockUseFlag.mockReturnValue(false);
  });

  it('should contain the right static content and structure', async () => {
    await act(async () => {
      renderWithProviders(<ExploreAdminFeaturesGettingStartedCard />);
    });

    expect(
      screen.getByRole('heading', { name: 'Explore new features and capabilities' }),
    ).toBeVisible();

    expect(screen.getByTestId('card admin-features')).toBeInTheDocument();

    expect(screen.getByTestId('item openshift-ai')).toBeInTheDocument();
    expect(screen.getByText('OpenShift AI')).toBeVisible();
    expect(screen.getByText('Build, deploy, and manage AI-enabled applications.')).toBeVisible();

    expect(screen.getByTestId('item whats-new')).toBeInTheDocument();
    expect(screen.getByText("See what's new in OpenShift 4.16")).toBeVisible();
  });

  it('should have correct link destinations', async () => {
    await act(async () => {
      renderWithProviders(<ExploreAdminFeaturesGettingStartedCard />);
    });

    const openShiftAiLink = screen.getByTestId('item openshift-ai');
    expect(openShiftAiLink).toHaveAttribute(
      'href',
      '/catalog?catalogType=operator&keyword=openshift+ai&selectedId=rhods-operator-redhat-operators-openshift-marketplace',
    );

    const whatsNewLink = screen.getByTestId('item whats-new');
    expect(whatsNewLink).toHaveAttribute('href', 'https://www.openshift.com/learn/whats-new');
    expect(whatsNewLink).toHaveAttribute('target', '_blank');
    expect(whatsNewLink).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('should display language options when lightspeed is not available', async () => {
    await act(async () => {
      renderWithProviders(<ExploreAdminFeaturesGettingStartedCard />);
    });

    // Since useFlag returns false (lightspeed not available), should show language link instead
    expect(screen.getByText('French and Spanish now available')).toBeVisible();
    expect(
      screen.getByText('Console language options now include French and Spanish.'),
    ).toBeVisible();

    const languageLink = screen.getByTestId('item new-translations');
    expect(languageLink).toHaveAttribute('href', '/user-preferences/language');
  });

  it('should display lightspeed link when flags are enabled', async () => {
    // Mock all required flags to be true for lightspeed
    mockUseFlag.mockImplementation((flag) => {
      switch (flag) {
        case 'CAN_LIST_PACKAGE_MANIFEST':
        case 'CAN_LIST_OPERATOR_GROUP':
        case 'LIGHTSPEED_IS_AVAILABLE_TO_INSTALL':
          return true;
        default:
          return false;
      }
    });

    await act(async () => {
      renderWithProviders(<ExploreAdminFeaturesGettingStartedCard />);
    });

    // Should show lightspeed link instead of language options
    expect(screen.getByText('OpenShift Lightspeed')).toBeVisible();
    expect(screen.getByText('Your personal AI helper.')).toBeVisible();
  });
});
