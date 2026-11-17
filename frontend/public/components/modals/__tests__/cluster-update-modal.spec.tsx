// Unit tests: store/router hooks are mocked; plain render is enough.
import { screen, configure, render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { useFlag } from '@console/shared/src/hooks/useFlag';
import type { ClusterVersionKind, MachineConfigPoolKind } from '../../../module/k8s';
import { ClusterUpdateModal } from '../cluster-update-modal';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, string>) => {
      if (!options) {
        return key;
      }
      return Object.keys(options).reduce(
        (result, optionKey) => result.replace(`{{${optionKey}}}`, String(options[optionKey])),
        key,
      );
    },
  }),
}));

jest.mock('@console/internal/components/utils/k8s-watch-hook', () => ({
  useK8sWatchResource: jest.fn(),
}));

jest.mock('@console/shared/src/hooks/useFlag', () => ({
  useFlag: jest.fn(),
}));

jest.mock('@console/shared/src/hooks/usePromiseHandler', () => ({
  usePromiseHandler: () => [jest.fn().mockResolvedValue(undefined), false, ''],
}));

const mockUseK8sWatchResource = useK8sWatchResource as jest.Mock;
const mockUseFlag = useFlag as jest.Mock;

const clusterVersion = {
  apiVersion: 'config.openshift.io/v1',
  kind: 'ClusterVersion',
  metadata: { name: 'version' },
  spec: { channel: 'stable-4.16' },
  status: {
    desired: { version: '4.16.0', image: 'test-image' },
    availableUpdates: [{ version: '4.16.1', image: 'test-image-4.16.1' }],
    conditions: [],
  },
} as ClusterVersionKind;

const masterMCP = {
  apiVersion: 'machineconfiguration.openshift.io/v1',
  kind: 'MachineConfigPool',
  metadata: { name: 'master', creationTimestamp: '2020-08-06T11:52:19Z' },
  spec: { paused: false },
} as MachineConfigPoolKind;

const pausedWorkerMCP = {
  apiVersion: 'machineconfiguration.openshift.io/v1',
  kind: 'MachineConfigPool',
  metadata: { name: 'worker', creationTimestamp: '2020-08-06T11:52:20Z' },
  spec: { paused: true },
} as MachineConfigPoolKind;

const pausedCustomMCP = {
  apiVersion: 'machineconfiguration.openshift.io/v1',
  kind: 'MachineConfigPool',
  metadata: { name: 'infra', creationTimestamp: '2020-08-06T11:52:21Z' },
  spec: { paused: true },
} as MachineConfigPoolKind;

const unpausedWorkerMCP = {
  ...pausedWorkerMCP,
  spec: { paused: false },
} as MachineConfigPoolKind;

const baseProps = {
  cv: clusterVersion,
  close: jest.fn(),
  cancel: jest.fn(),
  closeOverlay: jest.fn(),
};

describe('ClusterUpdateModal paused MachineConfigPools acknowledgement', () => {
  beforeAll(() => {
    configure({ testIdAttribute: 'data-test' });
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseFlag.mockReturnValue(false);
  });

  it('lists paused pool names, requires acknowledgement for Full update, and clears the gate for Control plane only', async () => {
    const user = userEvent.setup();
    mockUseK8sWatchResource.mockReturnValue([
      [masterMCP, pausedWorkerMCP, pausedCustomMCP],
      true,
      null,
    ]);

    render(<ClusterUpdateModal {...baseProps} />);

    const warning = screen.getByTestId('update-cluster-modal-paused-nodes-warning');
    expect(warning).toBeVisible();
    expect(warning).toHaveTextContent('worker');
    expect(warning).toHaveTextContent('infra');

    const ackCheckbox = screen.getByTestId('update-cluster-modal-paused-pools-ack');
    expect(ackCheckbox).toBeVisible();
    expect(ackCheckbox).not.toBeChecked();

    const updateButton = screen.getByTestId('confirm-action');
    expect(updateButton).toBeDisabled();

    await user.click(ackCheckbox);
    expect(ackCheckbox).toBeChecked();
    expect(updateButton).toBeEnabled();

    await user.click(screen.getByTestId('update-cluster-modal-partial-update-radio'));
    expect(screen.queryByTestId('update-cluster-modal-paused-nodes-warning')).toBeNull();
    expect(screen.queryByTestId('update-cluster-modal-paused-pools-ack')).toBeNull();
    expect(updateButton).toBeEnabled();
  });

  it('does not show the paused pools warning or acknowledgement when no non-master pools are paused', () => {
    mockUseK8sWatchResource.mockReturnValue([[masterMCP, unpausedWorkerMCP], true, null]);

    render(<ClusterUpdateModal {...baseProps} />);

    expect(screen.queryByTestId('update-cluster-modal-paused-nodes-warning')).toBeNull();
    expect(screen.queryByTestId('update-cluster-modal-paused-pools-ack')).toBeNull();
    expect(screen.getByTestId('confirm-action')).toBeEnabled();
  });

  it('disables Full update until MachineConfigPools have loaded', () => {
    mockUseK8sWatchResource.mockReturnValue([[], false, null]);

    render(<ClusterUpdateModal {...baseProps} />);

    expect(screen.queryByTestId('update-cluster-modal-paused-nodes-warning')).toBeNull();
    expect(screen.getByTestId('confirm-action')).toBeDisabled();
  });

  it('requires acknowledgement again when the paused pool set changes after acknowledgement', async () => {
    const user = userEvent.setup();
    mockUseK8sWatchResource.mockReturnValue([[masterMCP, pausedWorkerMCP], true, null]);

    const { rerender } = render(<ClusterUpdateModal {...baseProps} />);

    const ackCheckbox = screen.getByTestId('update-cluster-modal-paused-pools-ack');
    await user.click(ackCheckbox);
    expect(ackCheckbox).toBeChecked();
    expect(screen.getByTestId('confirm-action')).toBeEnabled();

    mockUseK8sWatchResource.mockReturnValue([
      [masterMCP, pausedWorkerMCP, pausedCustomMCP],
      true,
      null,
    ]);
    rerender(<ClusterUpdateModal {...baseProps} />);

    expect(screen.getByTestId('update-cluster-modal-paused-pools-ack')).not.toBeChecked();
    expect(screen.getByTestId('confirm-action')).toBeDisabled();
    expect(screen.getByTestId('update-cluster-modal-paused-nodes-warning')).toHaveTextContent(
      'infra',
    );
  });
});
