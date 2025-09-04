import { waitFor } from '@testing-library/react';
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

const mockUseParams = ReactRouter.useParams as jest.Mock;
const mockUseLocation = ReactRouter.useLocation as jest.Mock;
const mockReactRouterUseLocation = useLocation as jest.Mock;
const mockUseFavoritesOptions = require('@console/internal/components/useFavoritesOptions')
  .useFavoritesOptions as jest.Mock;

describe(ContainersDetailsPage.displayName, () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseParams.mockReturnValue({ podName: 'test-name', ns: 'default' });
    mockUseLocation.mockReturnValue({ pathname: '/k8s/ns/default/pods/test-name/containers' });
    mockReactRouterUseLocation.mockReturnValue({
      pathname: '/k8s/ns/default/pods/test-name/containers',
    });
    mockUseFavoritesOptions.mockReturnValue([[], jest.fn(), true]);
  });

  it('renders a Firehose component with correct resource props', () => {
    const { container } = renderWithProviders(<ContainersDetailsPage />);

    expect(container).toBeInTheDocument();
  });
});

describe(ContainerDetails.displayName, () => {
  const obj = { data: { ...testPodInstance } };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseLocation.mockReturnValue({
      pathname: '/k8s/ns/default/pods/test-name/containers/hello-openshift',
    });
    mockReactRouterUseLocation.mockReturnValue({
      pathname: '/k8s/ns/default/pods/test-name/containers/hello-openshift',
    });
  });

  it('renders PageHeading and ContainerDetailsList when container exists', async () => {
    mockUseParams.mockReturnValue({ podName: 'test-name', ns: 'default', name: 'hello-openshift' });

    const { container } = renderWithProviders(<ContainerDetails obj={obj} loaded />);

    expect(container.firstChild).toBeInTheDocument();

    await waitFor(() => {
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  it("renders an ErrorPage404 if the container doesn't exist", () => {
    mockUseParams.mockReturnValue({
      podName: 'test-name',
      ns: 'default',
      name: 'non-existing-container',
    });

    const { container } = renderWithProviders(<ContainerDetails obj={obj} loaded />);

    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders a LoadingBox when props are not loaded yet', () => {
    mockUseParams.mockReturnValue({ podName: 'test-name', ns: 'default', name: 'hello-openshift' });

    const { container } = renderWithProviders(<ContainerDetails obj={obj} loaded={false} />);

    expect(container.firstChild).toBeInTheDocument();
  });
});

describe(ContainerDetailsList.displayName, () => {
  it("renders an ErrorPage404 if the container doesn't exist", () => {
    mockUseParams.mockReturnValue({
      podName: 'test-name',
      ns: 'default',
      name: 'non-existing-container',
    });

    const { container } = renderWithProviders(<ContainerDetailsList obj={testPodInstance} />);

    expect(container.firstChild).toBeInTheDocument();
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
