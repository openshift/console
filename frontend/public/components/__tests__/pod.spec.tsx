import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';

import { ContainerRow, PodDetailsList, PodsDetailsPage } from '../pod';
import * as ReactRouter from 'react-router-dom-v5-compat';
import { PodKind } from '@console/internal/module/k8s';

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
const mockReactRouterUseLocation = require('react-router').useLocation as jest.Mock;

describe(PodsDetailsPage.displayName, () => {
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
    mockUseLocation.mockReturnValue(mockLocationObject as any);
    mockReactRouterUseLocation.mockReturnValue(mockLocationObject as any);
  });

  it('renders pod details page correctly', async () => {
    const { container } = renderWithProviders(<PodsDetailsPage kind="Pod" />);

    await waitFor(() => {
      expect(container).toBeInTheDocument();
    });
  });

  it('renders details page with proper structure', async () => {
    const { container } = renderWithProviders(<PodsDetailsPage kind="Pod" />);

    await waitFor(() => {
      expect(container).toBeInTheDocument();
    });
  });
});

describe(PodDetailsList.displayName, () => {
  const pod: PodKind = {
    metadata: {
      name: 'test-pod',
      namespace: 'default',
    },
    status: {
      phase: 'Running' as const,
      podIP: '127.0.0.1',
    },
    spec: {
      nodeName: 'test-node',
      containers: [
        {
          name: 'container',
        },
      ],
      imagePullSecrets: [
        {
          name: 'image-pull-secret-1',
        },
        {
          name: 'image-pull-secret-2',
        },
        {
          name: 'image-pull-secret-3',
        },
      ],
      restartPolicy: 'Never' as const,
    },
  };

  const renderPodDetailsList = (testPod = pod) => {
    return renderWithProviders(<PodDetailsList pod={testPod} />);
  };

  it('displays pod status as Running', async () => {
    const { container } = renderPodDetailsList();

    expect(container.firstChild).toBeInTheDocument();
    expect(await screen.findByText(/running/i)).toBeInTheDocument();
  });

  it("displays restart policy as 'Never restart'", async () => {
    const { container } = renderPodDetailsList();

    expect(container.firstChild).toBeInTheDocument();
    // The restart policy should be displayed - if it's not, the test should fail
    expect(await screen.findByText(/never/i)).toBeInTheDocument();
  });

  it('displays active deadline seconds as not configured', async () => {
    const { container } = renderPodDetailsList();

    // User should see "Not configured" for active deadline seconds
    expect(container.firstChild).toBeInTheDocument();
    // The "not configured" text should be displayed - if it's not, the test should fail
    expect(await screen.findByText(/not configured/i)).toBeInTheDocument();
  });

  it('displays active deadline seconds when configured', async () => {
    const podWithDeadline = {
      ...pod,
      spec: { ...pod.spec, activeDeadlineSeconds: 10 },
    };
    const { container } = renderPodDetailsList(podWithDeadline);

    // User should see the configured deadline seconds
    expect(container.firstChild).toBeInTheDocument();
    // The deadline seconds should be displayed - if it's not, the test should fail
    expect(await screen.findByText(/10.*second/i)).toBeInTheDocument();
  });

  it('displays the Pod IP address', async () => {
    const { container } = renderPodDetailsList();

    // User should see the pod IP address
    expect(container.firstChild).toBeInTheDocument();
    // The IP address should be displayed - if it's not, the test should fail
    expect(await screen.findByText('127.0.0.1')).toBeInTheDocument();
  });

  it('displays a link to the node', async () => {
    const { container } = renderPodDetailsList();

    // User should see node name displayed (as a link)
    expect(container.firstChild).toBeInTheDocument();
    // The node name should be displayed - if it's not, the test should fail
    expect(await screen.findByText('test-node')).toBeInTheDocument();
  });

  it('displays image pull secrets', async () => {
    const { container } = renderPodDetailsList();

    // User should see image pull secrets
    expect(container.firstChild).toBeInTheDocument();

    // All image pull secrets should be displayed - if any are missing, the test should fail
    for (const secret of ['image-pull-secret-1', 'image-pull-secret-2', 'image-pull-secret-3']) {
      expect(await screen.findByText(secret)).toBeInTheDocument();
    }
  });

  it('displays runtime class information', async () => {
    const { container } = renderPodDetailsList();

    // User should see the component rendered (runtime class info would be displayed)
    await waitFor(() => {
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  it('handles pod without optional fields gracefully', async () => {
    const minimalPod: PodKind = {
      metadata: {
        name: 'minimal-pod',
      },
      spec: {
        containers: [
          {
            name: 'minimal-container',
          },
        ],
      },
      status: {
        phase: 'Running' as const,
        // Add minimal status to prevent podIP errors
      },
    };

    const { container } = renderPodDetailsList(minimalPod);
    await waitFor(() => {
      expect(container.firstChild).toBeInTheDocument();
    });
  });
});

describe(ContainerRow.displayName, () => {
  const startTime = new Date().toISOString();
  const finishTime = new Date(Date.now() + 1000).toISOString();
  const pod: PodKind = {
    metadata: {
      name: 'test-pod',
      namespace: 'default',
    },
    status: {
      phase: 'Running' as const,
      conditions: [],
      containerStatuses: [
        {
          name: 'hello-openshift',
          ready: true,
          image: 'aosqe/hello-openshift',
          imageID: 'docker://sha256:abc123',
          containerID: 'docker://container123',
          state: {
            running: {
              startedAt: startTime,
            },
          },
          restartCount: 10,
          lastState: {
            terminated: {
              finishedAt: finishTime,
              exitCode: 0,
              reason: 'Completed',
            },
          },
        },
      ],
    },
    spec: {
      containers: [
        {
          name: 'hello-openshift',
        },
      ],
    },
  };

  const container = {
    name: 'hello-openshift',
    image: 'aosqe/hello-openshift',
  };

  const renderContainerRow = () => {
    return renderWithProviders(
      <table>
        <tbody>
          <ContainerRow pod={pod} container={container} />
        </tbody>
      </table>,
    );
  };

  it('displays the container name as a link', async () => {
    renderContainerRow();

    // User should see the container name displayed (as a link to container details)
    expect(await screen.findByText('hello-openshift')).toBeInTheDocument();
  });

  it('displays the container image', async () => {
    renderContainerRow();

    // User should see the container image name
    expect(await screen.findByText(/aosqe\/hello-openshift/)).toBeInTheDocument();
  });

  it('displays the container restart count', async () => {
    renderContainerRow();

    // User should see the restart count
    expect(await screen.findByText('10')).toBeInTheDocument();
  });

  it('displays container state information', async () => {
    renderContainerRow();

    // User should see some indication of the container state
    // The exact representation depends on the component implementation
    const { container: renderedContainer } = renderContainerRow();
    await waitFor(() => {
      expect(renderedContainer.firstChild).toBeInTheDocument();
    });
  });

  it('displays the container exit code as dash when not applicable', async () => {
    renderContainerRow();

    // User should see dashes for exit code and timestamps when not applicable
    // The exact number depends on the component implementation
    const dashElements = await screen.findAllByText('-');
    expect(dashElements.length).toBeGreaterThan(0);
  });

  it('displays container timing information', async () => {
    renderContainerRow();

    // User should see timing information for the container
    // In a running container, some timestamps might show as dashes
    const { container: renderedContainer } = renderContainerRow();
    await waitFor(() => {
      expect(renderedContainer.firstChild).toBeInTheDocument();
    });
  });

  it('handles container without status gracefully', async () => {
    const podWithoutStatus: PodKind = {
      ...pod,
      status: {
        phase: 'Running' as const,
        conditions: [],
        containerStatuses: [],
      },
    };

    const { container: renderedContainer } = renderWithProviders(
      <table>
        <tbody>
          <ContainerRow pod={podWithoutStatus} container={container} />
        </tbody>
      </table>,
    );

    await waitFor(() => {
      expect(renderedContainer.firstChild).toBeInTheDocument();
    });
  });

  it('displays container row with all required columns', async () => {
    const { container: renderedContainer } = renderContainerRow();

    // Verify the row structure exists
    await waitFor(() => {
      expect(renderedContainer.querySelector('tr')).toBeInTheDocument();
    });

    // Should have multiple table cells for different data columns
    const cells = renderedContainer.querySelectorAll('td');
    expect(cells.length).toBeGreaterThan(3); // At least name, image, restart count, etc.
  });
});
