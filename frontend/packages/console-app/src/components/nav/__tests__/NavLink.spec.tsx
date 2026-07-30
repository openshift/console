import { createRef } from 'react';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import { NavLink } from '../NavLink';

describe('NavLink', () => {
  it('should render children correctly', () => {
    renderWithProviders(
      <NavLink to="/test">
        <span>Test Link Content</span>
      </NavLink>,
    );

    expect(screen.getByText('Test Link Content')).toBeVisible();
  });

  it('should render as a link with correct href', () => {
    renderWithProviders(<NavLink to="/dashboard">Dashboard</NavLink>);

    const link = screen.getByRole('link', { name: 'Dashboard' });
    expect(link).toHaveAttribute('href', '/dashboard');
  });

  it('should pass additional link props to the underlying Link component', () => {
    renderWithProviders(
      <NavLink to="/settings" className="custom-nav-link" aria-label="Settings page">
        Settings
      </NavLink>,
    );

    const link = screen.getByRole('link', { name: 'Settings page' });
    expect(link).toHaveAttribute('href', '/settings');
  });

  it('should forward dragRef to the Link element', () => {
    const dragRef = createRef<HTMLAnchorElement>();

    renderWithProviders(
      <NavLink to="/draggable" dragRef={dragRef}>
        Draggable Item
      </NavLink>,
    );

    expect(dragRef.current).toBeInstanceOf(HTMLAnchorElement);
    expect(dragRef.current).toHaveAttribute('href', '/draggable');
  });
});
