import { act, render, screen } from '@testing-library/react';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import type { NodeKind, PodKind } from '@console/internal/module/k8s';
import { k8sCreate, k8sGet, k8sKillByName } from '@console/internal/module/k8s';
import NodeTerminal from '../NodeTerminal';

jest.mock('@console/internal/components/utils/k8s-watch-hook', () => ({
  useK8sWatchResource: jest.fn(),
}));

jest.mock('@console/internal/components/pod', () => ({
  PodConnectLoader: jest.fn(() => 'PodConnectLoader'),
}));

jest.mock('@console/internal/module/k8s', () => ({
  k8sCreate: jest.fn(),
  k8sGet: jest.fn(),
  k8sKillByName: jest.fn(),
}));

const mockNode = {
  apiVersion: 'v1',
  kind: 'Node',
  metadata: { name: 'test-node', uid: 'test-uid' },
  status: { nodeInfo: { operatingSystem: 'linux' } },
} as NodeKind;

const mockNamespace = { metadata: { name: 'openshift-debug-abc' } };

const mockPod = {
  apiVersion: 'v1',
  kind: 'Pod',
  metadata: { name: 'test-node-debug', namespace: 'openshift-debug-abc' },
};

const setupPodCreation = () => {
  (k8sCreate as jest.Mock).mockResolvedValueOnce(mockNamespace).mockResolvedValueOnce(mockPod);
  (k8sGet as jest.Mock).mockRejectedValue(new Error('not found'));
  (k8sKillByName as jest.Mock).mockResolvedValue({});
};

const renderAndCreatePod = async () => {
  jest.useFakeTimers();
  render(<NodeTerminal obj={mockNode} />);
  await act(async () => {
    await Promise.resolve();
  });
  await act(async () => {
    jest.runOnlyPendingTimers();
    await Promise.resolve();
  });
  jest.useRealTimers();
};

describe('NodeTerminal', () => {
  beforeEach(() => {
    jest.spyOn(console, 'warn').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  it('should show loading spinner while debug pod is being created', () => {
    (k8sCreate as jest.Mock).mockReturnValue(new Promise(() => {}));
    (k8sGet as jest.Mock).mockReturnValue(new Promise(() => {}));
    (useK8sWatchResource as jest.Mock).mockReturnValue([undefined, true, undefined]);

    render(<NodeTerminal obj={mockNode} />);

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(screen.queryByText('Debug pod not found or was deleted.')).not.toBeInTheDocument();
  });

  it('should show error when watch returns a load error', async () => {
    setupPodCreation();
    (useK8sWatchResource as jest.Mock).mockImplementation((resource) =>
      resource ? [{}, true, new Error('Connection refused')] : [undefined, true, undefined],
    );

    await renderAndCreatePod();

    expect(await screen.findByText('Connection refused')).toBeVisible();
  });

  it('should show loading when watch has not loaded yet', async () => {
    setupPodCreation();
    (useK8sWatchResource as jest.Mock).mockImplementation((resource) =>
      resource ? [{}, false, undefined] : [undefined, true, undefined],
    );

    await renderAndCreatePod();

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('should show not found error when pod is loaded but missing', async () => {
    setupPodCreation();
    (useK8sWatchResource as jest.Mock).mockImplementation((resource) =>
      resource ? [undefined, true, undefined] : [undefined, true, undefined],
    );

    await renderAndCreatePod();

    expect(await screen.findByText('Debug pod not found or was deleted.')).toBeVisible();
  });

  it('should show error with message when pod phase is Failed', async () => {
    const failedPod = ({
      ...mockPod,
      status: { phase: 'Failed', message: 'ImagePullBackOff' },
    } as unknown) as PodKind;

    setupPodCreation();
    (useK8sWatchResource as jest.Mock).mockImplementation((resource) =>
      resource ? [failedPod, true, undefined] : [undefined, true, undefined],
    );

    await renderAndCreatePod();

    expect(await screen.findByText(/The debug pod failed.*ImagePullBackOff/)).toBeVisible();
  });

  it('should render terminal when pod is Running', async () => {
    const runningPod = ({
      ...mockPod,
      status: { phase: 'Running' },
    } as unknown) as PodKind;

    setupPodCreation();
    (useK8sWatchResource as jest.Mock).mockImplementation((resource) =>
      resource ? [runningPod, true, undefined] : [undefined, true, undefined],
    );

    await renderAndCreatePod();

    expect(await screen.findByText('PodConnectLoader')).toBeInTheDocument();
  });

  it('should show error when pod creation fails', async () => {
    (k8sCreate as jest.Mock).mockRejectedValue(new Error('Forbidden'));
    (k8sGet as jest.Mock).mockRejectedValue(new Error('not found'));
    (k8sKillByName as jest.Mock).mockResolvedValue({});
    (useK8sWatchResource as jest.Mock).mockReturnValue([undefined, true, undefined]);

    await renderAndCreatePod();
    expect(await screen.findByText('Forbidden')).toBeVisible();
  });
});
