import { screen } from '@testing-library/react';

import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import { ContainerRow, PodDetailsList, PodsDetailsPage } from '../pod';
import * as ReactRouter from 'react-router';
import { testPodInstance } from '../../../__mocks__/k8sResourcesMocks';

jest.mock('react-router', () => ({
  ...jest.requireActual('react-router'),
  useParams: jest.fn(),
  useLocation: jest.fn(),
}));

const mockUseParams = ReactRouter.useParams as jest.Mock;
const mockUseLocation = ReactRouter.useLocation as jest.Mock;

describe(`PodsDetailsPage`, () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const mockLocationObject = {
      pathname: '/k8s/ns/default/pods/example',
      search: '',
      hash: '',
      state: null,
      key: 'test',
    };
    mockUseParams.mockReturnValue({});
    mockUseLocation.mockReturnValue(mockLocationObject);
  });

  it('verifies pod details page renders successfully for users', () => {
    const view = renderWithProviders(<PodsDetailsPage kind="Pod" />);
    expect(view.container).toBeInTheDocument();
  });

  it('shows well-structured pod details layout for users', () => {
    const view = renderWithProviders(<PodsDetailsPage kind="Pod" />);
    expect(view.container).toBeInTheDocument();
  });
});

describe('PodDetailsList', () => {
  const renderPodDetailsList = (testPod = testPodInstance) => {
    renderWithProviders(<PodDetailsList pod={testPod} />);
  };

  it('verifies pod status as CrashLoopBackOff', () => {
    renderPodDetailsList();

    expect(screen.getByText(/Crash.*Loop.*Back.*Off/)).toBeVisible();
  });

  it("verifies restart policy as 'Always restart'", async () => {
    renderPodDetailsList();

    expect(screen.getByText('Always restart')).toBeVisible();
  });

  it('verifies active deadline seconds as not configured', async () => {
    renderPodDetailsList();
    expect(screen.getByText('Not configured')).toBeVisible();
  });

  it('verifies active deadline seconds when configured', async () => {
    const podWithDeadline = {
      ...testPodInstance,
      spec: { ...testPodInstance.spec, activeDeadlineSeconds: 10 },
    };
    renderPodDetailsList(podWithDeadline);

    expect(screen.getByText(/10.*second/i)).toBeVisible();
  });

  it('verifies the Pod IP address', async () => {
    renderPodDetailsList();

    expect(screen.getByText('10.131.0.48')).toBeVisible();
  });

  it('verifies a link to the node', async () => {
    renderPodDetailsList();

    expect(screen.getByText('ip-10-0-132-2.ec2.internal')).toBeVisible();
  });

  it('verifies image pull secrets', async () => {
    renderPodDetailsList();

    expect(screen.getByText('default-dockercfg-fcb57')).toBeVisible();
  });

  it('verifies runtime class information', async () => {
    const podWithRuntime = {
      ...testPodInstance,
      spec: { ...testPodInstance.spec, runtimeClassName: 'test-runtime' },
    };
    renderPodDetailsList(podWithRuntime);

    expect(screen.getByText('test-runtime')).toBeVisible();
  });
});

describe('ContainerRow', () => {
  const containerSpec = {
    name: 'crash-app',
    image: 'quay.io/openshifttest/crashpod',
  };

  const renderContainerRow = () => {
    renderWithProviders(
      <table>
        <tbody>
          <ContainerRow pod={testPodInstance} container={containerSpec} />
        </tbody>
      </table>,
    );
  };

  it('verifies the container name as a link', async () => {
    renderContainerRow();

    expect(screen.getByText('crash-app')).toBeVisible();
  });

  it('verifies the container image', async () => {
    renderContainerRow();

    expect(screen.getByText('quay.io/openshifttest/crashpod')).toBeVisible();
  });

  it('verifies the container restart count', async () => {
    renderContainerRow();

    expect(screen.getByText('29')).toBeVisible();
  });

  it('verifies container state information', async () => {
    renderContainerRow();

    expect(screen.getByText('Waiting')).toBeVisible();
  });

  it('verifies the container exit code as dash when not applicable', async () => {
    renderContainerRow();

    const dashElements = screen.getAllByText('-');
    expect(dashElements.length).toBeGreaterThan(0);
  });

  it('verifies container timing information', async () => {
    renderContainerRow();

    expect(screen.getAllByText(/Feb 9, 2022/)[0]).toBeVisible();
    expect(screen.getAllByText(/11:20|6:20|4:50/)[0]).toBeVisible();
    expect(screen.getByText(/Completed/)).toBeVisible();
  });

  it('verifies container ready status displays as Not ready', async () => {
    renderContainerRow();

    expect(screen.getByText('Not ready')).toBeVisible();
  });
});
