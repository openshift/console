import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Breadcrumbs, BreadcrumbsProps } from '../Breadcrumbs';

describe('Breadcrumbs', () => {
  let breadcrumbs: BreadcrumbsProps['breadcrumbs'];

  beforeEach(() => {
    breadcrumbs = [
      { name: 'pods', path: '/pods' },
      { name: 'containers', path: '/pods/containers' },
    ];
  });

  it('renders each given breadcrumb', () => {
    render(
      <MemoryRouter>
        <Breadcrumbs breadcrumbs={breadcrumbs} />
      </MemoryRouter>,
    );

    breadcrumbs.forEach((crumb) => {
      if (crumb.path) {
        const link = screen.getByRole('link', { name: crumb.name });
        expect(link).toHaveAttribute('href', crumb.path);
      } else {
        expect(screen.getByText(crumb.name)).toBeInTheDocument();
      }
    });
  });
});
