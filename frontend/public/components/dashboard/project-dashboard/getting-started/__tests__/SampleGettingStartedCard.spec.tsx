import { screen, waitFor } from '@testing-library/react';

import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import { useActiveNamespace } from '@console/shared/src/hooks/useActiveNamespace';
import CatalogServiceProvider from '@console/shared/src/components/catalog/service/CatalogServiceProvider';
import { loadingCatalogService, loadedCatalogService } from './SampleGettingStartedCard.data';
import { SampleGettingStartedCard } from '../SampleGettingStartedCard';
import { cleanupServerFlag } from '../../../getting-started-test-utils';

jest.mock('@console/shared/src/hooks/useActiveNamespace', () => ({
  useActiveNamespace: jest.fn(),
}));

jest.mock('@console/shared/src/components/catalog/service/CatalogServiceProvider', () => ({
  default: jest.fn(),
}));

const useActiveNamespaceMock = useActiveNamespace as jest.Mock;
const CatalogServiceProviderMock = CatalogServiceProvider as jest.Mock;

describe('SampleGettingStartedCard', () => {
  beforeEach(() => {
    useActiveNamespaceMock.mockReset();
    CatalogServiceProviderMock.mockReset();
  });

  afterEach(() => {
    cleanupServerFlag('addPage');
  });

  it('should not render when Samples add card is disabled', async () => {
    window.SERVER_FLAGS.addPage = '{ "disabledActions": "import-from-samples" }';

    useActiveNamespaceMock.mockReturnValue(['active-namespace']);
    CatalogServiceProviderMock.mockImplementation((props) => props.children(loadedCatalogService));

    renderWithProviders(<SampleGettingStartedCard />);

    await waitFor(() => {
      expect(screen.queryByText('Create applications using samples')).not.toBeInTheDocument();
    });
    expect(screen.queryByText('View all samples')).not.toBeInTheDocument();
  });

  it('should render loading links until catalog service is loaded', async () => {
    useActiveNamespaceMock.mockReturnValue(['active-namespace']);
    CatalogServiceProviderMock.mockImplementation((props) => props.children(loadingCatalogService));

    renderWithProviders(
      <SampleGettingStartedCard featured={['code-with-quarkus', 'java-springboot-basic']} />,
    );

    await waitFor(() => {
      expect(screen.getByText('Create applications using samples')).toBeInTheDocument();
    });

    const viewAllSamplesLink = screen.getByRole('link', { name: 'View all samples' });
    expect(viewAllSamplesLink).toBeVisible();
    expect(viewAllSamplesLink).toHaveAttribute('href', '/samples/ns/active-namespace');

    expect(screen.getByTestId('card samples')).toBeInTheDocument();

    // Verify that loading skeletons are present for the featured items
    const loadingSkeletons = screen.getAllByTestId('getting-started-skeleton');
    expect(loadingSkeletons).toHaveLength(2); // Should have 2 loading skeletons for the 2 featured items
  });

  it('should render featured links when catalog service is loaded', async () => {
    useActiveNamespaceMock.mockReturnValue(['active-namespace']);
    CatalogServiceProviderMock.mockImplementation((props) => props.children(loadedCatalogService));

    renderWithProviders(
      <SampleGettingStartedCard featured={['code-with-quarkus', 'java-springboot-basic']} />,
    );

    await waitFor(() => {
      expect(screen.getByText('Create applications using samples')).toBeInTheDocument();
    });

    const quarkusLink = screen.getByRole('link', { name: 'Basic Quarkus' });
    expect(quarkusLink).toBeVisible();
    expect(quarkusLink).toHaveAttribute(
      'href',
      '/import?importType=devfile&formType=sample&devfileName=code-with-quarkus&gitRepo=https://github.com/devfile-samples/devfile-sample-code-with-quarkus.git',
    );

    const springBootLink = screen.getByRole('link', { name: 'Basic Spring Boot' });
    expect(springBootLink).toBeVisible();
    expect(springBootLink).toHaveAttribute(
      'href',
      '/import?importType=devfile&formType=sample&devfileName=java-springboot-basic&gitRepo=https://github.com/devfile-samples/devfile-sample-java-springboot-basic.git',
    );

    const viewAllSamplesLink = screen.getByRole('link', { name: 'View all samples' });
    expect(viewAllSamplesLink).toBeVisible();
    expect(viewAllSamplesLink).toHaveAttribute('href', '/samples/ns/active-namespace');
  });

  it('should render first samples when catalog service is loaded without featured links', async () => {
    useActiveNamespaceMock.mockReturnValue(['active-namespace']);
    CatalogServiceProviderMock.mockImplementation((props) => props.children(loadedCatalogService));

    renderWithProviders(<SampleGettingStartedCard />);

    await waitFor(() => {
      expect(screen.getByText('Create applications using samples')).toBeInTheDocument();
    });

    // When no featured items are specified, it should show the first 2 items from the catalog
    const dotnetLink = screen.getByRole('link', { name: '.NET Core' });
    expect(dotnetLink).toBeVisible();
    expect(dotnetLink).toHaveAttribute('href', '/samples/ns/active-namespace/dotnet/openshift');

    const nodejsLink = screen.getByRole('link', { name: 'Basic Node.js' });
    expect(nodejsLink).toBeVisible();
    expect(nodejsLink).toHaveAttribute(
      'href',
      '/import?importType=devfile&formType=sample&devfileName=nodejs-basic&gitRepo=https://github.com/nodeshift-starters/devfile-sample.git',
    );

    const viewAllSamplesLink = screen.getByRole('link', { name: 'View all samples' });
    expect(viewAllSamplesLink).toBeVisible();
    expect(viewAllSamplesLink).toHaveAttribute('href', '/samples/ns/active-namespace');
  });
});
