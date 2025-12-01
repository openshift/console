import { screen, waitFor } from '@testing-library/react';
import { QuickStartsLoader } from '@console/app/src/components/quick-starts/loader/QuickStartsLoader';
import { useActiveNamespace } from '@console/shared/src/hooks/useActiveNamespace';
import { renderWithProviders } from '../../../test-utils/unit-test-utils';
import { QuickStartGettingStartedCard } from '../QuickStartGettingStartedCard';
import { loadingQuickStarts, loadedQuickStarts } from './QuickStartGettingStartedCard.data';

jest.mock('@console/shared/src/hooks/useActiveNamespace', () => ({
  useActiveNamespace: jest.fn(),
}));

jest.mock('@console/app/src/components/quick-starts/loader/QuickStartsLoader', () => ({
  QuickStartsLoader: jest.fn(),
}));

const useActiveNamespaceMock = useActiveNamespace as jest.Mock;
const QuickStartsLoaderMock = QuickStartsLoader as jest.Mock;

describe('QuickStartGettingStartedCard', () => {
  it('should render loading links until catalog service is loaded', async () => {
    useActiveNamespaceMock.mockReturnValue(['active-namespace']);
    QuickStartsLoaderMock.mockImplementation(({ children }) => children(loadingQuickStarts, false));

    renderWithProviders(
      <QuickStartGettingStartedCard featured={['quarkus-with-s2i', 'spring-with-s2i']} />,
    );

    await waitFor(() => {
      expect(screen.getByText('Build with guided documentation')).toBeVisible();
      expect(screen.getByText('View all quick starts')).toBeVisible();
    });
  });

  it('should render featured links when catalog service is loaded', async () => {
    useActiveNamespaceMock.mockReturnValue(['active-namespace']);
    QuickStartsLoaderMock.mockImplementation(({ children }) => children(loadedQuickStarts, true));

    renderWithProviders(
      <QuickStartGettingStartedCard featured={['quarkus-with-s2i', 'spring-with-s2i']} />,
    );

    await waitFor(() => {
      expect(screen.getByText('Build with guided documentation')).toBeVisible();
      expect(screen.getByText('Get started with Quarkus using s2i')).toBeVisible();
      expect(screen.getByText('Get started with Spring')).toBeVisible();
      expect(screen.getByText('View all quick starts')).toBeVisible();
    });
  });

  it('should render first samples when catalog service is loaded without featured links', async () => {
    useActiveNamespaceMock.mockReturnValue(['active-namespace']);
    QuickStartsLoaderMock.mockImplementation(({ children }) => children(loadedQuickStarts, true));

    renderWithProviders(<QuickStartGettingStartedCard />);

    await waitFor(() => {
      expect(screen.getByText('Build with guided documentation')).toBeVisible();
      expect(screen.getByText('Get started with Spring')).toBeVisible();
      expect(screen.getByText('Monitor your sample application')).toBeVisible();
      expect(screen.getByText('View all quick starts')).toBeVisible();
    });
  });
});
