import { screen, configure, act } from '@testing-library/react';

import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import { useCanClusterUpgrade } from '@console/shared';

import { ClusterSetupGettingStartedCard } from '../cluster-setup-getting-started-card';
import { useIdentityProviderLink } from '../cluster-setup-identity-provider-link';
import { useAlertReceiverLink } from '../cluster-setup-alert-receiver-link';

jest.mock('react', () => ({
  ...jest.requireActual('react'),
  useLayoutEffect: jest.requireActual('react').useEffect,
}));

jest.mock('@console/shared/src/hooks/useCanClusterUpgrade', () => ({
  useCanClusterUpgrade: jest.fn(),
}));

jest.mock('../cluster-setup-identity-provider-link', () => ({
  useIdentityProviderLink: jest.fn(),
}));

jest.mock('../cluster-setup-alert-receiver-link', () => ({
  useAlertReceiverLink: jest.fn(),
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

const useCanClusterUpgradeMock = useCanClusterUpgrade as jest.Mock;
const useIdentityProviderLinkMock = useIdentityProviderLink as jest.Mock;
const useAlertReceiverLinkMock = useAlertReceiverLink as jest.Mock;

describe('ClusterSetupGettingStartedCard', () => {
  beforeAll(() => {
    configure({ testIdAttribute: 'data-test' });
  });

  beforeEach(() => {
    useCanClusterUpgradeMock.mockReset();
    useIdentityProviderLinkMock.mockReset();
    useAlertReceiverLinkMock.mockReset();
  });

  it('should render links if hooks provide them', async () => {
    useCanClusterUpgradeMock.mockReturnValue(true);
    useIdentityProviderLinkMock.mockReturnValue({
      id: 'identity-providers',
      title: 'Add identity providers',
      href: 'cluster',
    });
    useAlertReceiverLinkMock.mockReturnValue({
      id: 'alert-receivers',
      title: 'Configure alert receivers',
      href: '/settings/cluster/alertmanagerconfig',
    });

    await act(async () => {
      renderWithProviders(<ClusterSetupGettingStartedCard />);
    });

    expect(screen.getByRole('heading', { name: 'Set up your cluster' })).toBeVisible();

    expect(screen.getByTestId('item identity-providers')).toBeInTheDocument();
    expect(screen.getByText('Add identity providers')).toBeVisible();
    const identityProviderLink = screen.getByTestId('item identity-providers');
    expect(identityProviderLink).toHaveAttribute('href', '/cluster');

    expect(screen.getByTestId('item alert-receivers')).toBeInTheDocument();
    expect(screen.getByText('Configure alert receivers')).toBeVisible();
    const alertReceiverLink = screen.getByTestId('item alert-receivers');
    expect(alertReceiverLink).toHaveAttribute('href', '/settings/cluster/alertmanagerconfig');

    expect(screen.getByTestId('item machine-configuration')).toBeInTheDocument();
    expect(screen.getByText('View all steps in documentation')).toBeVisible();
    const moreLink = screen.getByTestId('item machine-configuration');
    expect(moreLink).toHaveAttribute('target', '_blank');
    expect(moreLink).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('should render nothing if hooks provide no links', async () => {
    useIdentityProviderLinkMock.mockReturnValue(null);
    useAlertReceiverLinkMock.mockReturnValue(null);

    await act(async () => {
      renderWithProviders(<ClusterSetupGettingStartedCard />);
    });

    // When no links are provided, the component should not render anything
    expect(screen.queryByRole('heading', { name: 'Set up your cluster' })).not.toBeInTheDocument();
    expect(screen.queryByTestId('item identity-providers')).not.toBeInTheDocument();
    expect(screen.queryByTestId('item alert-receivers')).not.toBeInTheDocument();
  });
});
