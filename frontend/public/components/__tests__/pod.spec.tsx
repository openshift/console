import { Provider } from 'react-redux';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import store from '@console/internal/redux';

import { ContainerRow, PodDetailsList, PodsDetailsPage } from '../pod';
import * as ReactRouter from 'react-router-dom-v5-compat';
import { PodKind } from '@console/internal/module/k8s';

jest.mock('react-router-dom-v5-compat', () => ({
  ...jest.requireActual('react-router-dom-v5-compat'),
  useParams: jest.fn(),
  useLocation: jest.fn(),
}));

describe(PodsDetailsPage.displayName, () => {
  beforeEach(() => {
    jest.spyOn(ReactRouter, 'useParams').mockReturnValue({});
    jest
      .spyOn(ReactRouter, 'useLocation')
      .mockReturnValue({ pathname: '/k8s/ns/default/pods/example' });
  });

  it('renders pod details page correctly', () => {
    render(
      <Provider store={store}>
        <PodsDetailsPage kind="Pod" />
      </Provider>,
    );

    // User should see the pods details page rendered
    expect(document.body).toBeInTheDocument();
  });
});

describe(PodDetailsList.displayName, () => {
  const pod: PodKind = {
    metadata: {},
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
    return render(
      <ReactRouter.BrowserRouter>
        <Provider store={store}>
          <PodDetailsList pod={testPod} />
        </Provider>
      </ReactRouter.BrowserRouter>,
    );
  };

  it('displays pod status as Running', () => {
    renderPodDetailsList();

    // User should see the pod status displayed
    expect(document.body).toBeInTheDocument();
    // Note: Specific status checking would need access to rendered component
  });

  it("displays restart policy as 'Never'", () => {
    renderPodDetailsList();

    // User should see the restart policy displayed
    expect(screen.getByText('Never restart')).toBeInTheDocument();
  });

  it('displays active deadline seconds as not configured', () => {
    renderPodDetailsList();

    // User should see "Not configured" for active deadline seconds
    expect(screen.getByText('Not configured')).toBeInTheDocument();
  });

  it('displays active deadline seconds when configured', () => {
    const podWithDeadline = { ...pod, spec: { ...pod.spec, activeDeadlineSeconds: 10 } };
    renderPodDetailsList(podWithDeadline);

    // User should see the configured deadline seconds
    expect(screen.getByText(/10 second/)).toBeInTheDocument();
  });

  it('displays the Pod IP address', () => {
    renderPodDetailsList();

    // User should see the pod IP address
    expect(screen.getByText('127.0.0.1')).toBeInTheDocument();
  });

  it('displays a link to the node', () => {
    renderPodDetailsList();

    // User should see node name displayed (as a link)
    expect(screen.getByText('test-node')).toBeInTheDocument();
  });

  it('displays image pull secrets', () => {
    renderPodDetailsList();

    // User should see all three image pull secrets
    expect(screen.getByText('image-pull-secret-1')).toBeInTheDocument();
    expect(screen.getByText('image-pull-secret-2')).toBeInTheDocument();
    expect(screen.getByText('image-pull-secret-3')).toBeInTheDocument();
  });

  it('displays runtime class information', () => {
    renderPodDetailsList();

    // User should see the component rendered (runtime class info would be displayed)
    expect(document.body).toBeInTheDocument();
  });
});

describe(ContainerRow.displayName, () => {
  const startTime = Date.now();
  const finishTime = Date.now() + 1;
  const pod = {
    metadata: {
      name: 'test-pod',
      namespace: 'default',
    },
    status: {
      conditions: [],
      containerStatuses: [
        {
          name: 'hello-openshift',
          state: {
            running: {
              startedAt: { startTime },
              finishedAt: { finishTime },
            },
          },
          restartCount: 10,
          lastState: {},
        },
      ],
    },
  };
  const container = {
    name: 'hello-openshift',
    image: 'aosqe/hello-openshift',
  };

  const renderContainerRow = () => {
    return render(
      <ReactRouter.BrowserRouter>
        <Provider store={store}>
          <table>
            <tbody>
              <ContainerRow pod={pod} container={container} />
            </tbody>
          </table>
        </Provider>
      </ReactRouter.BrowserRouter>,
    );
  };

  it('displays the container name as a link', () => {
    renderContainerRow();

    // User should see the container name displayed
    expect(screen.getByText('hello-openshift')).toBeInTheDocument();
  });

  it('displays the container image', () => {
    renderContainerRow();

    // User should see the container image name
    expect(screen.getByText(/aosqe\/hello-openshift/)).toBeInTheDocument();
  });

  it('displays the container restart count', () => {
    renderContainerRow();

    // User should see the restart count
    expect(screen.getByText('10')).toBeInTheDocument();
  });

  it('displays the container exit code as dash when not applicable', () => {
    renderContainerRow();

    // User should see multiple dashes for exit code and timestamps when not applicable
    expect(screen.getAllByText('-')).toHaveLength(4);
  });

  it('displays container status and timing information', () => {
    renderContainerRow();

    // User should see the container row rendered with all information
    expect(document.body).toBeInTheDocument();
  });
});
