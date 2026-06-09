import { screen } from '@testing-library/react';
import { useActiveNamespace } from '@console/shared/src/hooks/useActiveNamespace';
import { useLocation } from '@console/shared/src/hooks/useLocation';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import { NavItemHref } from '../NavItemHref';

jest.mock('@console/shared/src/hooks/useActiveNamespace', () => ({
  useActiveNamespace: jest.fn(),
}));

jest.mock('@console/shared/src/hooks/useLocation', () => ({
  useLocation: jest.fn(),
}));

describe('NavItemHref', () => {
  const mockSetNamespace = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useActiveNamespace as jest.Mock).mockReturnValue(['default', mockSetNamespace]);
    (useLocation as jest.Mock).mockReturnValue('/other/path');
  });

  it('should render children as link text', () => {
    renderWithProviders(<NavItemHref href="/dashboard">Dashboard</NavItemHref>);

    expect(screen.getByRole('link', { name: 'Dashboard' })).toBeVisible();
  });

  it('should use href directly when not namespaced', () => {
    renderWithProviders(<NavItemHref href="/cluster-settings">Cluster settings</NavItemHref>);

    const link = screen.getByRole('link', { name: 'Cluster settings' });
    expect(link).toHaveAttribute('href', '/cluster-settings');
  });

  it('should format namespaced route when namespaced prop is true', () => {
    renderWithProviders(
      <NavItemHref href="/pods" namespaced>
        Pods
      </NavItemHref>,
    );

    const link = screen.getByRole('link', { name: 'Pods' });
    expect(link).toHaveAttribute('href', '/pods/ns/default');
  });

  it('should format prefixNamespaced route correctly', () => {
    renderWithProviders(
      <NavItemHref href="/k8s/ns/test/configmaps" prefixNamespaced>
        ConfigMaps
      </NavItemHref>,
    );

    const link = screen.getByRole('link', { name: 'ConfigMaps' });
    expect(link).toHaveAttribute('href', '/k8s/ns/default/configmaps');
  });

  it('should mark nav item as active when location matches href', () => {
    (useLocation as jest.Mock).mockReturnValue('/dashboard');

    renderWithProviders(<NavItemHref href="/dashboard">Dashboard</NavItemHref>);

    expect(screen.getByRole('link', { name: 'Dashboard', current: 'page' })).toBeVisible();
  });

  it('should not be active when location does not match href', () => {
    (useLocation as jest.Mock).mockReturnValue('/other/path');

    renderWithProviders(<NavItemHref href="/dashboard">Dashboard</NavItemHref>);

    expect(screen.getByRole('link', { name: 'Dashboard' })).toBeVisible();
    expect(
      screen.queryByRole('link', { name: 'Dashboard', current: 'page' }),
    ).not.toBeInTheDocument();
  });

  it('should be active when location matches startsWith pattern', () => {
    (useLocation as jest.Mock).mockReturnValue('/monitoring/alerts');

    renderWithProviders(
      <NavItemHref href="/monitoring" startsWith={['monitoring/alerts', 'monitoring/dashboards']}>
        Monitoring
      </NavItemHref>,
    );

    expect(screen.getByRole('link', { name: 'Monitoring', current: 'page' })).toBeVisible();
  });

  it('should handle all-namespaces scope in active namespace', () => {
    (useActiveNamespace as jest.Mock).mockReturnValue(['#ALL_NS#', mockSetNamespace]);

    renderWithProviders(
      <NavItemHref href="/pods" namespaced>
        Pods
      </NavItemHref>,
    );

    const link = screen.getByRole('link', { name: 'Pods' });
    expect(link).toHaveAttribute('href', '/pods/all-namespaces');
  });
});
