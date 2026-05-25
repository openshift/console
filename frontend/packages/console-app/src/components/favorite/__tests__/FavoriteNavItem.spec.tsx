import { screen } from '@testing-library/react';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import { FavoriteNavItem } from '../FavoriteNavItem';

describe('FavoriteNavItem', () => {
  it('should render children as link text', () => {
    renderWithProviders(
      <FavoriteNavItem to="/test" isActive={false} className="test-class">
        Test Link
      </FavoriteNavItem>,
    );

    expect(screen.getByRole('link', { name: 'Test Link' })).toBeVisible();
  });

  it('should render link with correct href', () => {
    renderWithProviders(
      <FavoriteNavItem to="/dashboard/pods" isActive={false} className="test-class">
        Pods
      </FavoriteNavItem>,
    );

    const link = screen.getByRole('link', { name: 'Pods' });
    expect(link).toHaveAttribute('href', '/dashboard/pods');
  });

  it('sets aria-current for active item when isActive is true', () => {
    renderWithProviders(
      <FavoriteNavItem to="/" isActive className="test-class">
        Active Link
      </FavoriteNavItem>,
    );

    expect(screen.getByRole('link', { name: 'Active Link' })).toBeVisible();
    expect(screen.getByRole('link', { name: 'Active Link' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('should not mark inactive link as current page', () => {
    renderWithProviders(
      <FavoriteNavItem to="/test" isActive={false} className="test-class">
        Inactive Link
      </FavoriteNavItem>,
    );

    const link = screen.getByRole('link', { name: 'Inactive Link' });
    expect(link).not.toHaveAttribute('aria-current', 'page');
  });

  it('should render link within list item when custom className is provided', () => {
    renderWithProviders(
      <FavoriteNavItem to="/test" isActive={false} className="custom-favorite-class">
        Custom Class Link
      </FavoriteNavItem>,
    );

    const link = screen.getByRole('link', { name: 'Custom Class Link' });
    expect(screen.getByRole('listitem')).toContainElement(link);
  });
});
