import { configure, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import {
  PageHeading,
  BreadCrumbs,
  BreadCrumbsProps,
} from '../../../public/components/utils/headings';
import { testResourceInstance } from '../../../__mocks__/k8sResourcesMocks';
import { MemoryRouter } from 'react-router-dom-v5-compat';

describe(BreadCrumbs.displayName, () => {
  let breadcrumbs: BreadCrumbsProps['breadcrumbs'];

  beforeEach(() => {
    configure({ testIdAttribute: 'data-test' });

    breadcrumbs = [
      { name: 'pods', path: '/pods' },
      { name: 'containers', path: '/pods/containers' },
    ];
  });

  it('renders each given breadcrumb', () => {
    render(
      <MemoryRouter>
        <BreadCrumbs breadcrumbs={breadcrumbs} />
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

describe(PageHeading.displayName, () => {
  beforeEach(() => {
    configure({ testIdAttribute: 'data-test' });
  });

  it('renders resource icon if given `kind`', () => {
    const kind = 'Pod';
    render(
      <MemoryRouter>
        <PageHeading.WrappedComponent obj={null} kind={kind} />
      </MemoryRouter>,
    );

    const icon = screen.getByTitle(kind);
    expect(icon).toBeInTheDocument();
    expect(screen.getByText(kind)).toBeInTheDocument();
  });

  it('renders custom title component if given', () => {
    const title = <span>My Custom Title</span>;
    render(
      <MemoryRouter>
        <PageHeading.WrappedComponent obj={null} title={title} />
      </MemoryRouter>,
    );

    expect(screen.getByText('My Custom Title')).toBeInTheDocument();
  });

  it('renders breadcrumbs if given `breadcrumbsFor` function', () => {
    const breadcrumbs = [];
    render(
      <MemoryRouter>
        <PageHeading.WrappedComponent
          obj={{ data: testResourceInstance, loaded: true, loadError: null }}
          breadcrumbsFor={() => breadcrumbs}
        />
      </MemoryRouter>,
    );

    expect(screen.getByTestId('page-heading-breadcrumbs')).toBeInTheDocument();
  });

  it('does not render breadcrumbs if object has not loaded', () => {
    render(
      <MemoryRouter>
        <PageHeading.WrappedComponent obj={null} breadcrumbsFor={() => []} />
      </MemoryRouter>,
    );

    expect(screen.queryByTestId('page-heading-breadcrumbs')).not.toBeInTheDocument();
  });
});
