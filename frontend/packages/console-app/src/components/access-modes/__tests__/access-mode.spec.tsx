import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { PersistentVolumeClaimKind } from '@console/internal/module/k8s';
import { AccessModeSelector, getPVCAccessModes } from '../access-mode';

jest.mock('@console/internal/components/storage/shared', () => ({
  getAccessModeOptions: () => [
    { value: 'ReadWriteOnce', title: 'Single user (RWO)' },
    { value: 'ReadWriteMany', title: 'Shared access (RWX)' },
    { value: 'ReadOnlyMany', title: 'Read only (ROX)' },
    { value: 'ReadWriteOncePod', title: 'Read write once pod (RWOP)' },
  ],
  getAccessModeForProvisioner: jest.fn(() => ['ReadWriteOnce', 'ReadWriteMany']),
}));

describe('AccessModeSelector', () => {
  describe('getPVCAccessModes', () => {
    it('should return access mode titles from PVC resource', () => {
      const mockPVC = {
        apiVersion: 'v1',
        kind: 'PersistentVolumeClaim',
        metadata: { name: 'test-pvc', namespace: 'default' },
        spec: {
          accessModes: ['ReadWriteOnce'],
          resources: { requests: { storage: '1Gi' } },
          storageClassName: 'gp2',
        },
      } as PersistentVolumeClaimKind;

      const result = getPVCAccessModes(mockPVC, 'title');
      expect(result).toEqual(['Single user (RWO)']);
    });

    it('should return access mode values from PVC resource', () => {
      const mockPVC = {
        apiVersion: 'v1',
        kind: 'PersistentVolumeClaim',
        metadata: { name: 'test-pvc', namespace: 'default' },
        spec: {
          accessModes: ['ReadWriteMany'],
          resources: { requests: { storage: '1Gi' } },
          storageClassName: 'gp2',
        },
      } as PersistentVolumeClaimKind;

      const result = getPVCAccessModes(mockPVC, 'value');
      expect(result).toEqual(['ReadWriteMany']);
    });

    it('should return empty array when PVC has no access modes', () => {
      const mockPVC = {
        apiVersion: 'v1',
        kind: 'PersistentVolumeClaim',
        metadata: { name: 'test-pvc', namespace: 'default' },
        spec: {
          accessModes: [],
          resources: { requests: { storage: '1Gi' } },
          storageClassName: 'gp2',
        },
      } as PersistentVolumeClaimKind;

      const result = getPVCAccessModes(mockPVC, 'value');
      expect(result).toEqual([]);
    });

    it('should handle undefined PVC resource', () => {
      const result = getPVCAccessModes(undefined, 'value');
      expect(result).toEqual([]);
    });
  });

  describe('AccessModeSelector', () => {
    const defaultProps = {
      onChange: jest.fn(),
      loaded: true,
      provisioner: 'kubernetes.io/aws-ebs',
    };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should render access mode label', () => {
      render(<AccessModeSelector {...defaultProps} />);

      expect(screen.getByText('Access mode')).toBeVisible();
    });

    it('should show loading skeleton when not loaded', () => {
      render(<AccessModeSelector {...defaultProps} loaded={false} />);

      expect(screen.getByRole('status', { busy: true })).toBeVisible();
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('should render select dropdown when loaded', async () => {
      render(<AccessModeSelector {...defaultProps} />);

      expect(await screen.findByRole('button')).toBeVisible();
    });

    it('should display description when provided', async () => {
      const description = 'Select the access mode for your storage';
      render(<AccessModeSelector {...defaultProps} description={description} />);

      expect(await screen.findByText(description)).toBeVisible();
    });

    it('should open dropdown when clicked', async () => {
      const user = userEvent.setup();
      render(<AccessModeSelector {...defaultProps} />);

      const toggle = await screen.findByRole('button');
      await user.click(toggle);

      expect(await screen.findByRole('listbox')).toBeVisible();
    });

    it('should call onChange when access mode is selected', async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();
      render(<AccessModeSelector {...defaultProps} onChange={onChange} />);

      const toggle = await screen.findByRole('button');
      await user.click(toggle);

      expect(await screen.findByRole('listbox')).toBeVisible();

      const option = screen.getByText('Shared access (RWX)');
      await user.click(option);

      expect(onChange).toHaveBeenCalledWith('ReadWriteMany');
    });
  });
});
