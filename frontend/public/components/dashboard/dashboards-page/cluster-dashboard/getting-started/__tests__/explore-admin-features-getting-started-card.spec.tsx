import { screen, waitFor } from '@testing-library/react';

import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import { useFlag } from '@console/shared/src/hooks/flag';
import { expectExternalLinkAttributes } from '../../../../getting-started-test-utils';
import { ExploreAdminFeaturesGettingStartedCard } from '../explore-admin-features-getting-started-card';

jest.mock('@console/shared/src/hooks/version', () => ({
  useOpenShiftVersion: () => '4.16.0',
}));

jest.mock('@console/shared/src/hooks/flag', () => ({
  useFlag: jest.fn<boolean, []>(),
}));

const mockUseFlag = useFlag as jest.Mock;

describe('ExploreAdminFeaturesGettingStartedCard', () => {
  beforeEach(() => {
    mockUseFlag.mockReturnValue(false);
  });

  it('should contain the right static content and structure', async () => {
    renderWithProviders(<ExploreAdminFeaturesGettingStartedCard />);

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: 'Explore new features and capabilities' }),
      ).toBeVisible();
    });

    expect(screen.getByText('OpenShift AI')).toBeVisible();
    expect(screen.getByText('Build, deploy, and manage AI-enabled applications.')).toBeVisible();
    expect(screen.getByText('Trusted Software Supply Chain')).toBeVisible();
    expect(
      screen.getByText('Assess risk, validate integrity, secure artifacts, release safely.'),
    ).toBeVisible();
    expect(screen.getByText("See what's new in OpenShift 4.16")).toBeVisible();
  });

  it('should have correct link destinations', async () => {
    renderWithProviders(<ExploreAdminFeaturesGettingStartedCard />);

    await waitFor(() => {
      expect(screen.getByTestId('item openshift-ai')).toBeTruthy();
      expect(screen.getByTestId('item trusted-software-supply-chain')).toBeTruthy();
    });

    expect(screen.getByTestId('item openshift-ai')).toHaveAttribute(
      'href',
      '/catalog?catalogType=operator&keyword=openshift+ai&selectedId=rhods-operator-redhat-operators-openshift-marketplace',
    );

    expect(screen.getByTestId('item trusted-software-supply-chain')).toHaveAttribute(
      'href',
      '/quickstart?keyword=trusted',
    );

    expectExternalLinkAttributes(
      screen.getByTestId('item whats-new'),
      'https://www.openshift.com/learn/whats-new',
    );
  });

  it('should display language options when lightspeed is not available', async () => {
    renderWithProviders(<ExploreAdminFeaturesGettingStartedCard />);

    // Since useFlag returns false (lightspeed not available), should show language link instead
    await waitFor(() => {
      expect(screen.getByText('French and Spanish now available')).toBeVisible();
    });
    expect(
      screen.getByText('Console language options now include French and Spanish.'),
    ).toBeVisible();

    expect(screen.getByTestId('item new-translations')).toHaveAttribute(
      'href',
      '/user-preferences/language',
    );
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

    renderWithProviders(<ExploreAdminFeaturesGettingStartedCard />);

    // Should show lightspeed link instead of language options
    await waitFor(() => {
      expect(screen.getByText('OpenShift Lightspeed')).toBeVisible();
    });
    expect(screen.getByText('Your personal AI helper.')).toBeVisible();
  });
});
