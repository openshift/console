import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import type { BreadcrumbsProps } from '../Breadcrumbs';
import { Breadcrumbs } from '../Breadcrumbs';

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

    const podsLink = screen.getByRole('link', { name: breadcrumbs[0].name });
    expect(podsLink).toHaveAttribute('href', breadcrumbs[0].path);

    const containersLink = screen.getByRole('link', { name: breadcrumbs[1].name });
    expect(containersLink).toHaveAttribute('href', breadcrumbs[1].path);
  });
});
