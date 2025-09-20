import { screen, act } from '@testing-library/react';
import * as ReactRouter from 'react-router-dom-v5-compat';
import { useLocation } from 'react-router';

import { testPodInstance } from '../../../__mocks__/k8sResourcesMocks';
import { PodKind } from '../../module/k8s';
import { getContainerStatus } from '../../module/k8s/container';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import { ContainersDetailsPage, ContainerDetails, ContainerDetailsList } from '../container';

// Mock router hooks
jest.mock('react-router-dom-v5-compat', () => ({
  ...jest.requireActual('react-router-dom-v5-compat'),
  useParams: jest.fn(),
  useLocation: jest.fn(),
}));

jest.mock('react-router', () => ({
  ...jest.requireActual('react-router'),
  useLocation: jest.fn(),
}));

jest.mock('@console/internal/components/useFavoritesOptions', () => ({
  useFavoritesOptions: jest.fn(),
}));

// Mock ScrollToTopOnMount to avoid DOM access issues in tests
jest.mock('../utils/scroll-to-top-on-mount', () => ({
  ScrollToTopOnMount: ({ children }: { children }) => children || null,
}));

jest.mock('../utils/firehose', () => ({
  Firehose: jest.fn(({ children }) => children),
}));

const mockUseParams = ReactRouter.useParams as jest.Mock;
const mockUseLocation = ReactRouter.useLocation as jest.Mock;
const mockReactRouterUseLocation = useLocation as jest.Mock;
const mockUseFavoritesOptions = require('@console/internal/components/useFavoritesOptions')
  .useFavoritesOptions as jest.Mock;

describe('ContainersDetailsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseParams.mockReturnValue({ podName: 'test-name', ns: 'default' });
    mockUseLocation.mockReturnValue({ pathname: '/k8s/ns/default/pods/test-name/containers' });
    mockReactRouterUseLocation.mockReturnValue({
      pathname: '/k8s/ns/default/pods/test-name/containers',
    });
    mockUseFavoritesOptions.mockReturnValue([[], jest.fn(), true]);
  });

  it('verifies loading state while container data is being fetched', () => {
    renderWithProviders(<ContainersDetailsPage />);

    expect(screen.getByRole('progressbar', { name: 'Contents' })).toBeVisible();
  });
});

describe('ContainerDetails', () => {
  const obj = { data: { ...testPodInstance } };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseLocation.mockReturnValue({
      pathname: '/k8s/ns/default/pods/test-name/containers/crash-app',
    });
    mockReactRouterUseLocation.mockReturnValue({
      pathname: '/k8s/ns/default/pods/test-name/containers/crash-app',
    });
    mockUseFavoritesOptions.mockReturnValue([[], jest.fn(), true]);
  });

  it('verifies container details page with proper title and status', async () => {
    mockUseParams.mockReturnValue({
      podName: testPodInstance.metadata.name,
      ns: testPodInstance.metadata.namespace,
      name: testPodInstance.spec.containers[0].name,
    });

    await act(async () => {
      renderWithProviders(<ContainerDetails obj={obj} loaded />);
    });

    expect(screen.getByText('crash-app')).toBeVisible();
    expect(screen.getByText('Waiting')).toBeVisible();
  });

  it('verifies the 404 error page when user tries to access non-existent container', async () => {
    mockUseParams.mockReturnValue({
      podName: testPodInstance.metadata.name,
      ns: testPodInstance.metadata.namespace,
      name: 'non-existing-container',
    });

    await act(async () => {
      renderWithProviders(<ContainerDetails obj={obj} loaded />);
    });

    expect(screen.getByRole('heading', { name: '404: Page Not Found' })).toBeVisible();
    expect(screen.getByText("We couldn't find that page.")).toBeVisible();
    expect(screen.getByRole('button', { name: 'Return to homepage' })).toBeVisible();
  });

  it('verifies loading state while container data is being fetched', async () => {
    mockUseParams.mockReturnValue({
      podName: testPodInstance.metadata.name,
      ns: testPodInstance.metadata.namespace,
      name: testPodInstance.spec.containers[0].name,
    });

    await act(async () => {
      renderWithProviders(<ContainerDetails obj={obj} loaded={false} />);
    });

    expect(screen.getByRole('progressbar', { name: 'Contents' })).toBeVisible();
  });
});

describe('ContainerDetailsList', () => {
  beforeEach(() => {
    mockUseParams.mockReturnValue({
      podName: testPodInstance.metadata.name,
      ns: testPodInstance.metadata.namespace,
      name: testPodInstance.spec.containers[0].name,
    });
    mockUseFavoritesOptions.mockReturnValue([[], jest.fn(), true]);
  });

  it('verifies container information when user views existing container', async () => {
    renderWithProviders(<ContainerDetailsList obj={testPodInstance} />);

    expect(screen.getByText('Waiting')).toBeVisible();
    expect(screen.getByText('Restarts')).toBeVisible();
    expect(screen.getByText('29')).toBeVisible();
  });

  it("verifies the 404 error page when user accesses container that doesn't exist in pod", () => {
    mockUseParams.mockReturnValue({
      podName: 'test-name',
      ns: 'default',
      name: 'non-existing-container',
    });

    renderWithProviders(<ContainerDetailsList obj={testPodInstance} />);

    expect(screen.getByRole('heading', { name: '404: Page Not Found' })).toBeVisible();
    expect(screen.getByText("We couldn't find that page.")).toBeVisible();
    expect(screen.getByRole('button', { name: 'Return to homepage' })).toBeVisible();
  });
});

describe('k8sDocker', () => {
  describe('#getContainerStatus', () => {
    it('returns falsy when pod has no container status with given name', () => {
      expect(
        getContainerStatus(
          {
            status: {
              containerStatuses: [
                { name: 'ACAEB740-01D1-4D43-BB7B-68EBFD484701' },
                { name: '06DB4D15-3A24-482B-82B1-A46337D8C2DD' },
                { name: '7AE75BB5-B562-4D5A-B880-F529797CAD5F' },
              ],
            },
          } as PodKind,

          // container name
          '9242B9F6-A50A-4330-8C0E-B18EA4672A89',
        ),
      ).toBeFalsy();
    });

    it('returns container status with given name', () => {
      expect(
        getContainerStatus(
          {
            status: {
              containerStatuses: [
                { name: 'ACAEB740-01D1-4D43-BB7B-68EBFD484701' },
                { name: '9242B9F6-A50A-4330-8C0E-B18EA4672A89', status: 'running' },
                { name: '7AE75BB5-B562-4D5A-B880-F529797CAD5F' },
              ],
            },
          } as PodKind,

          // container name
          '9242B9F6-A50A-4330-8C0E-B18EA4672A89',
        ),
      ).toEqual({ name: '9242B9F6-A50A-4330-8C0E-B18EA4672A89', status: 'running' });
    });
  });
});
