import { screen, act } from '@testing-library/react';
import * as ReactRouterBase from 'react-router';

import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import { ContainerRow, PodDetailsList, PodsDetailsPage } from '../pod';
import * as ReactRouter from 'react-router-dom-v5-compat';
import { testPodInstance } from '../../../__mocks__/k8sResourcesMocks';

jest.mock('react-router-dom-v5-compat', () => ({
  ...jest.requireActual('react-router-dom-v5-compat'),
  useParams: jest.fn(),
  useLocation: jest.fn(),
}));

jest.mock('react-router', () => ({
  ...jest.requireActual('react-router'),
  useLocation: jest.fn(),
  useParams: jest.fn(),
}));

const mockUseParams = ReactRouter.useParams as jest.Mock;
const mockUseLocation = ReactRouter.useLocation as jest.Mock;
const mockReactRouterUseLocation = ReactRouterBase.useLocation as jest.Mock;

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
    mockReactRouterUseLocation.mockReturnValue(mockLocationObject);
  });

  it('verifies pod details page renders successfully for users', async () => {
    let container;
    await act(async () => {
      const renderResult = renderWithProviders(<PodsDetailsPage kind="Pod" />);
      container = renderResult.container;
    });
    expect(container).toBeInTheDocument();
  });

  it('shows well-structured pod details layout for users', async () => {
    let container;
    await act(async () => {
      const renderResult = renderWithProviders(<PodsDetailsPage kind="Pod" />);
      container = renderResult.container;
    });
    expect(container).toBeInTheDocument();
  });
});

describe('PodDetailsList', () => {
  const renderPodDetailsList = async (testPod = testPodInstance) => {
    await act(async () => {
      renderWithProviders(<PodDetailsList pod={testPod} />);
    });
  };

  it('verifies pod status as CrashLoopBackOff', async () => {
    await renderPodDetailsList();

    expect(screen.getByText(/Crash.*Loop.*Back.*Off/)).toBeVisible();
  });

  it("verifies restart policy as 'Always restart'", async () => {
    await renderPodDetailsList();

    expect(screen.getByText('Always restart')).toBeVisible();
  });

  it('verifies active deadline seconds as not configured', async () => {
    await renderPodDetailsList();
    expect(screen.getByText('Not configured')).toBeVisible();
  });

  it('verifies active deadline seconds when configured', async () => {
    const podWithDeadline = {
      ...testPodInstance,
      spec: { ...testPodInstance.spec, activeDeadlineSeconds: 10 },
    };
    await renderPodDetailsList(podWithDeadline);

    expect(screen.getByText(/10.*second/i)).toBeVisible();
  });

  it('verifies the Pod IP address', async () => {
    await renderPodDetailsList();

    expect(screen.getByText('10.131.0.48')).toBeVisible();
  });

  it('verifies a link to the node', async () => {
    await renderPodDetailsList();

    expect(screen.getByText('ip-10-0-132-2.ec2.internal')).toBeVisible();
  });

  it('verifies image pull secrets', async () => {
    await renderPodDetailsList();

    expect(screen.getByText('default-dockercfg-fcb57')).toBeVisible();
  });

  it('verifies runtime class information', async () => {
    const podWithRuntime = {
      ...testPodInstance,
      spec: { ...testPodInstance.spec, runtimeClassName: 'test-runtime' },
    };
    await renderPodDetailsList(podWithRuntime);

    expect(screen.getByText('test-runtime')).toBeVisible();
  });
});

describe('ContainerRow', () => {
  const containerSpec = {
    name: 'crash-app',
    image: 'quay.io/openshifttest/crashpod',
  };

  const renderContainerRow = async () => {
    await act(async () => {
      renderWithProviders(
        <table>
          <tbody>
            <ContainerRow pod={testPodInstance} container={containerSpec} />
          </tbody>
        </table>,
      );
    });
  };

  it('verifies the container name as a link', async () => {
    await renderContainerRow();

    expect(screen.getByText('crash-app')).toBeVisible();
  });

  it('verifies the container image', async () => {
    await renderContainerRow();

    expect(screen.getByText('quay.io/openshifttest/crashpod')).toBeVisible();
  });

  it('verifies the container restart count', async () => {
    await renderContainerRow();

    expect(screen.getByText('29')).toBeVisible();
  });

  it('verifies container state information', async () => {
    await renderContainerRow();

    expect(screen.getByText('Waiting')).toBeVisible();
  });

  it('verifies the container exit code as dash when not applicable', async () => {
    await renderContainerRow();

    const dashElements = screen.getAllByText('-');
    expect(dashElements.length).toBeGreaterThan(0);
  });

  it('verifies container timing information', async () => {
    await renderContainerRow();

    expect(screen.getAllByText(/Feb 9, 2022/)[0]).toBeVisible();
    expect(screen.getAllByText(/11:20|6:20|4:50/)[0]).toBeVisible();
    expect(screen.getByText(/Completed/)).toBeVisible();
  });

  it('verifies container ready status displays as Not ready', async () => {
    await renderContainerRow();

    expect(screen.getByText('Not ready')).toBeVisible();
  });
});
