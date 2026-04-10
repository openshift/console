import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import { UpdateStatus } from '../cluster-status';
import {
  ClusterVersionConditionType,
  ClusterVersionKind,
  K8sResourceConditionStatus,
  k8sPatch,
} from '../../../module/k8s';

// Mock functions
const mockLaunchModal = jest.fn();

// Mock the useOverlay hook
jest.mock('@console/dynamic-plugin-sdk/src/app/modal-support/useOverlay', () => ({
  useOverlay: jest.fn(() => mockLaunchModal),
}));

// Mock k8sPatch
jest.mock('../../../module/k8s', () => ({
  ...jest.requireActual('../../../module/k8s'),
  k8sPatch: jest.fn(),
}));

const mockK8sPatch = k8sPatch as jest.Mock;

describe('UpdateStatus', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  const createMockClusterVersion = (
    conditions = [],
    availableUpdates = [],
    desiredVersion = '4.16.0',
  ): ClusterVersionKind => ({
    apiVersion: 'config.openshift.io/v1',
    kind: 'ClusterVersion',
    metadata: {
      name: 'version',
      resourceVersion: '12345',
      uid: 'test-uid',
    },
    spec: {
      channel: 'stable-4.16',
      clusterID: 'test-cluster-id',
    },
    status: {
      availableUpdates,
      conditions,
      desired: {
        version: desiredVersion,
        image: 'test-image',
      },
      history: [
        {
          state: 'Completed',
          version: desiredVersion,
          image: 'test-image',
          verified: false,
          startedTime: '2024-01-04T05:15:00Z',
          completionTime: '2024-01-04T05:35:14Z',
        },
      ],
      observedGeneration: 1,
      versionHash: 'test-hash',
    },
  });

  describe('when cluster version is invalid', () => {
    it('should display invalid message with cancel update button', () => {
      const cv = createMockClusterVersion([
        {
          type: ClusterVersionConditionType.Invalid,
          status: K8sResourceConditionStatus.True,
          message: 'Invalid cluster version',
          lastTransitionTime: '2024-01-11T13:15:41Z',
        },
      ]);

      renderWithProviders(<UpdateStatus cv={cv} />);

      expect(screen.getByTestId('cv-update-status-invalid')).toBeVisible();
      expect(screen.getByText(/Invalid cluster version/)).toBeVisible();
      expect(screen.getByRole('button', { name: /Cancel update/ })).toBeVisible();
    });

    it('should call k8sPatch when cancel update button is clicked successfully', async () => {
      const user = userEvent.setup();
      mockK8sPatch.mockResolvedValue({});
      const cv = createMockClusterVersion([
        {
          type: ClusterVersionConditionType.Invalid,
          status: K8sResourceConditionStatus.True,
          message: 'Invalid cluster version',
          lastTransitionTime: '2024-01-11T13:15:41Z',
        },
      ]);

      renderWithProviders(<UpdateStatus cv={cv} />);

      const cancelButton = screen.getByRole('button', { name: /Cancel update/ });
      await user.click(cancelButton);

      expect(mockK8sPatch).toHaveBeenCalledWith(expect.anything(), cv, [
        { path: '/spec/desiredUpdate', op: 'remove' },
      ]);
      expect(mockLaunchModal).not.toHaveBeenCalled();
    });

    it('should launch error modal when k8sPatch fails', async () => {
      const user = userEvent.setup();
      const errorMessage = 'Failed to cancel update';
      mockK8sPatch.mockRejectedValue(new Error(errorMessage));
      const cv = createMockClusterVersion([
        {
          type: ClusterVersionConditionType.Invalid,
          status: K8sResourceConditionStatus.True,
          message: 'Invalid cluster version',
          lastTransitionTime: '2024-01-11T13:15:41Z',
        },
      ]);

      renderWithProviders(<UpdateStatus cv={cv} />);

      const cancelButton = screen.getByRole('button', { name: /Cancel update/ });
      await user.click(cancelButton);

      expect(mockK8sPatch).toHaveBeenCalled();
      // Wait for the promise to reject and the modal to be launched
      await expect(
        screen.findByRole('button', { name: /Cancel update/ }),
      ).resolves.toBeInTheDocument();
      expect(mockLaunchModal).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({ error: errorMessage }),
      );
    });
  });

  describe('when release is not accepted', () => {
    it('should display release not accepted message with conditions link', () => {
      const cv = createMockClusterVersion([
        {
          type: ClusterVersionConditionType.ReleaseAccepted,
          status: K8sResourceConditionStatus.False,
          message: 'Release verification failed',
          reason: 'RetrievePayload',
          lastTransitionTime: '2024-01-11T19:09:43Z',
        },
      ]);

      renderWithProviders(<UpdateStatus cv={cv} />);

      expect(screen.getByTestId('cv-update-status-release-accepted-false')).toBeVisible();
      expect(screen.getByRole('button', { name: /Release not accepted/ })).toBeVisible();
      expect(screen.getByRole('link', { name: /View conditions/ })).toBeVisible();
    });
  });

  describe('when updates are available', () => {
    it('should display available updates message', () => {
      const cv = createMockClusterVersion(
        [
          {
            type: ClusterVersionConditionType.RetrievedUpdates,
            status: K8sResourceConditionStatus.True,
            lastTransitionTime: '2024-01-04T05:37:10Z',
          },
        ],
        [{ version: '4.16.1', image: 'test-image-1' }],
      );

      renderWithProviders(<UpdateStatus cv={cv} />);

      expect(screen.getByTestId('cv-update-status-available-updates')).toBeVisible();
      expect(screen.getByText(/Available updates/)).toBeVisible();
    });
  });

  describe('when cluster is updating', () => {
    it('should display updating message with version and conditions link', () => {
      const cv = createMockClusterVersion(
        [
          {
            type: ClusterVersionConditionType.Progressing,
            status: K8sResourceConditionStatus.True,
            message: 'Cluster version is 4.16.2',
            lastTransitionTime: '2024-01-11T13:45:34Z',
          },
        ],
        [],
        '4.16.2',
      );

      renderWithProviders(<UpdateStatus cv={cv} />);

      expect(screen.getByTestId('cv-update-status-updating')).toBeVisible();
      expect(screen.getByText(/Update to 4.16.2 in progress/)).toBeVisible();
      expect(screen.getByRole('link', { name: /View conditions/ })).toBeVisible();
    });
  });

  describe('when update is failing', () => {
    it('should display failing message when not progressing', () => {
      const cv = createMockClusterVersion([
        {
          type: ClusterVersionConditionType.Failing,
          status: K8sResourceConditionStatus.True,
          message: 'Cluster operator has not reported success',
          lastTransitionTime: '2024-01-11T13:45:34Z',
        },
      ]);

      renderWithProviders(<UpdateStatus cv={cv} />);

      expect(screen.getByTestId('cv-update-status-failing')).toBeVisible();
      expect(screen.getByRole('button', { name: /Failing/ })).toBeVisible();
      expect(screen.getByRole('link', { name: /View conditions/ })).toBeVisible();
    });

    it('should display both updating and failing messages when update is progressing and failing', () => {
      const cv = createMockClusterVersion(
        [
          {
            type: ClusterVersionConditionType.Progressing,
            status: K8sResourceConditionStatus.True,
            message: 'Cluster version is 4.16.2',
            lastTransitionTime: '2024-01-11T13:45:34Z',
          },
          {
            type: ClusterVersionConditionType.Failing,
            status: K8sResourceConditionStatus.True,
            message: 'Cluster operator has not reported success',
            lastTransitionTime: '2024-01-11T13:45:34Z',
          },
        ],
        [],
        '4.16.2',
      );

      renderWithProviders(<UpdateStatus cv={cv} />);

      expect(screen.getByTestId('cv-update-status-updating')).toBeVisible();
      expect(screen.getByTestId('cv-update-status-failing')).toBeVisible();
      expect(screen.getByText(/Update to 4.16.2 in progress/)).toBeVisible();
      expect(screen.getByRole('button', { name: /Failing/ })).toBeVisible();
    });
  });

  describe('when failed to retrieve updates', () => {
    it('should display no channel message when channel is not configured', () => {
      const cv = createMockClusterVersion([
        {
          type: ClusterVersionConditionType.RetrievedUpdates,
          status: K8sResourceConditionStatus.False,
          message: 'The update channel has not been configured.',
          reason: 'NoChannel',
          lastTransitionTime: '2024-01-10T18:10:53Z',
        },
      ]);
      cv.spec.channel = '';

      renderWithProviders(<UpdateStatus cv={cv} />);

      expect(screen.getByTestId('cv-update-status-no-channel')).toBeVisible();
      expect(screen.getByText(/The update channel has not been configured/)).toBeVisible();
    });

    it('should display not retrieving updates message for other retrieval errors', () => {
      const cv = createMockClusterVersion([
        {
          type: ClusterVersionConditionType.RetrievedUpdates,
          status: K8sResourceConditionStatus.False,
          message: 'Unable to retrieve available updates',
          reason: 'VersionNotFound',
          lastTransitionTime: '2024-01-11T13:15:41Z',
        },
      ]);

      renderWithProviders(<UpdateStatus cv={cv} />);

      expect(screen.getByTestId('cv-update-status-no-updates')).toBeVisible();
      expect(screen.getByRole('button', { name: /Not retrieving updates/ })).toBeVisible();
      expect(screen.getByRole('link', { name: /View conditions/ })).toBeVisible();
    });
  });

  describe('when cluster is up to date', () => {
    it('should display up to date message', () => {
      const cv = createMockClusterVersion([
        {
          type: ClusterVersionConditionType.RetrievedUpdates,
          status: K8sResourceConditionStatus.True,
          lastTransitionTime: '2024-01-04T05:37:10Z',
        },
        {
          type: ClusterVersionConditionType.Available,
          status: K8sResourceConditionStatus.True,
          message: 'Done applying 4.16.0',
          lastTransitionTime: '2024-01-04T05:35:14Z',
        },
      ]);

      renderWithProviders(<UpdateStatus cv={cv} />);

      expect(screen.getByTestId('cv-update-status-up-to-date')).toBeVisible();
      expect(screen.getByText(/Up to date/)).toBeVisible();
    });
  });
});
