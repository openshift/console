import { configure, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ConnectedPageHeading } from '../../../public/components/utils/headings';
import { testResourceInstance } from '../../../__mocks__/k8sResourcesMocks';
import { MemoryRouter } from 'react-router-dom';

configure({ testIdAttribute: 'data-test' });

describe(ConnectedPageHeading.displayName, () => {
  it('renders resource icon if given `kind`', () => {
    const kind = 'Pod';
    render(
      <MemoryRouter>
        <ConnectedPageHeading.WrappedComponent obj={null} kind={kind} />
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
        <ConnectedPageHeading.WrappedComponent obj={null} title={title} />
      </MemoryRouter>,
    );

    expect(screen.getByText('My Custom Title')).toBeInTheDocument();
  });

  it('renders breadcrumbs if given `breadcrumbsFor` function', () => {
    const breadcrumbs = [];
    render(
      <MemoryRouter>
        <ConnectedPageHeading.WrappedComponent
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
        <ConnectedPageHeading.WrappedComponent obj={null} breadcrumbsFor={() => []} />
      </MemoryRouter>,
    );

    expect(screen.queryByTestId('page-heading-breadcrumbs')).not.toBeInTheDocument();
  });
});
