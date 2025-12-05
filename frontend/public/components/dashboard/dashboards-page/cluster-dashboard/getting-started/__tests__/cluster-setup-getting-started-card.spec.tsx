import { screen, waitFor } from '@testing-library/react';

import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import { useCanClusterUpgrade } from '@console/shared';

import { ClusterSetupGettingStartedCard } from '../cluster-setup-getting-started-card';
import { useIdentityProviderLink } from '../cluster-setup-identity-provider-link';
import { useAlertReceiverLink } from '../cluster-setup-alert-receiver-link';

jest.mock('@console/shared/src/hooks/useCanClusterUpgrade', () => ({
  useCanClusterUpgrade: jest.fn(),
}));

jest.mock('../cluster-setup-identity-provider-link', () => ({
  useIdentityProviderLink: jest.fn(),
}));

jest.mock('../cluster-setup-alert-receiver-link', () => ({
  useAlertReceiverLink: jest.fn(),
}));

jest.mock('@console/shared/src/hooks/useTelemetry', () => ({
  useTelemetry: () => jest.fn(),
}));

const useCanClusterUpgradeMock = useCanClusterUpgrade as jest.Mock;
const useIdentityProviderLinkMock = useIdentityProviderLink as jest.Mock;
const useAlertReceiverLinkMock = useAlertReceiverLink as jest.Mock;

describe('ClusterSetupGettingStartedCard', () => {
  beforeEach(() => {
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

    renderWithProviders(<ClusterSetupGettingStartedCard />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Set up your cluster' })).toBeVisible();
    });

    expect(screen.getByText('Add identity providers')).toBeVisible();
    expect(screen.getByTestId('item identity-providers')).toHaveAttribute('href', '/cluster');

    expect(screen.getByText('Configure alert receivers')).toBeVisible();
    expect(screen.getByTestId('item alert-receivers')).toHaveAttribute(
      'href',
      '/settings/cluster/alertmanagerconfig',
    );

    expect(screen.getByText('View all steps in documentation')).toBeVisible();
    const moreLink = screen.getByTestId('item machine-configuration');
    expect(moreLink).toHaveAttribute('target', '_blank');
    expect(moreLink).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('should render nothing if hooks provide no links', async () => {
    useIdentityProviderLinkMock.mockReturnValue(null);
    useAlertReceiverLinkMock.mockReturnValue(null);

    renderWithProviders(<ClusterSetupGettingStartedCard />);

    // When no links are provided, the component should not render anything
    await waitFor(() => {
      expect(
        screen.queryByRole('heading', { name: 'Set up your cluster' }),
      ).not.toBeInTheDocument();
    });
    expect(screen.queryByText('Add identity providers')).not.toBeInTheDocument();
    expect(screen.queryByText('Configure alert receivers')).not.toBeInTheDocument();
  });
});
