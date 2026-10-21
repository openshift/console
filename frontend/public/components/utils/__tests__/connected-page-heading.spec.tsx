import { screen, act, waitFor } from '@testing-library/react';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import { ConnectedPageHeading } from '../../../components/utils/headings';
import { testResourceInstance } from '../../../../__mocks__/k8sResourcesMocks';

describe('ConnectedPageHeading', () => {
  it('renders resource icon if given `kind`', async () => {
    const kind = 'Pod';
    await act(async () => {
      renderWithProviders(<ConnectedPageHeading.WrappedComponent obj={null} kind={kind} />);
    });

    await waitFor(() => {
      const icon = screen.getByTitle(kind);
      expect(icon).toBeInTheDocument();
      expect(screen.getByText(kind)).toBeInTheDocument();
    });
  });

  it('renders custom title component if given', async () => {
    const title = <span>My Custom Title</span>;
    await act(async () => {
      renderWithProviders(<ConnectedPageHeading.WrappedComponent obj={null} title={title} />);
    });

    await waitFor(() => {
      expect(screen.getByText('My Custom Title')).toBeInTheDocument();
    });
  });

  it('renders breadcrumbs if given `breadcrumbsFor` function', async () => {
    const breadcrumbs = [];
    await act(async () => {
      renderWithProviders(
        <ConnectedPageHeading.WrappedComponent
          obj={{ data: testResourceInstance, loaded: true, loadError: null }}
          breadcrumbsFor={() => breadcrumbs}
        />,
      );
    });

    await waitFor(() => {
      expect(screen.getByTestId('page-heading-breadcrumbs')).toBeInTheDocument();
    });
  });

  it('does not render breadcrumbs if object has not loaded', async () => {
    await act(async () => {
      renderWithProviders(
        <ConnectedPageHeading.WrappedComponent obj={null} breadcrumbsFor={() => []} />,
      );
    });

    await waitFor(() => {
      expect(screen.queryByTestId('page-heading-breadcrumbs')).not.toBeInTheDocument();
    });
  });
});
