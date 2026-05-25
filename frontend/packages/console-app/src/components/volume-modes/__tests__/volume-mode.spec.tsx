import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { PersistentVolumeClaimKind } from '@console/internal/module/k8s';
import { VolumeModeSelector } from '../volume-mode';

jest.mock('@console/internal/components/storage/shared', () => ({
  getVolumeModeRadios: () => [
    { value: 'Filesystem', label: 'Filesystem' },
    { value: 'Block', label: 'Block' },
  ],
  getVolumeModeForProvisioner: jest.fn(() => ['Filesystem', 'Block']),
  initialVolumeModes: ['Filesystem', 'Block'],
}));

jest.mock('@console/internal/components/utils/field-level-help', () => ({
  FieldLevelHelp: jest.fn(({ children }: { children: React.ReactNode }) => children),
}));

describe('VolumeModeSelector', () => {
  const defaultProps = {
    onChange: jest.fn(),
    loaded: true,
    provisioner: 'kubernetes.io/aws-ebs',
    storageClass: 'gp2',
    accessMode: 'ReadWriteOnce',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render volume mode label', () => {
    render(<VolumeModeSelector {...defaultProps} />);

    expect(screen.getByText('Volume mode')).toBeVisible();
  });

  it('should render radio buttons when multiple volume modes are allowed', () => {
    render(<VolumeModeSelector {...defaultProps} />);

    expect(screen.getByRole('radio', { name: 'Filesystem' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Block' })).toBeInTheDocument();
  });

  it('should call onChange when volume mode is selected', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    render(<VolumeModeSelector {...defaultProps} onChange={onChange} />);

    const blockRadio = screen.getByRole('radio', { name: 'Block' });
    await user.click(blockRadio);

    expect(onChange).toHaveBeenCalledWith('Block');
  });

  it('should show initial volume mode from PVC resource', () => {
    const mockPVC = {
      apiVersion: 'v1',
      kind: 'PersistentVolumeClaim',
      metadata: { name: 'test-pvc', namespace: 'default' },
      spec: {
        accessModes: ['ReadWriteOnce'],
        resources: { requests: { storage: '1Gi' } },
        storageClassName: 'gp2',
        volumeMode: 'Block',
      },
    } as PersistentVolumeClaimKind;

    render(<VolumeModeSelector {...defaultProps} pvcResource={mockPVC} />);

    const blockRadio = screen.getByRole('radio', { name: 'Block' });
    expect(blockRadio).toBeInTheDocument();
  });

  it('should use available volume mode when provided', () => {
    render(<VolumeModeSelector {...defaultProps} availableVolumeMode="Block" />);

    expect(screen.getByRole('radio', { name: 'Block' })).toBeInTheDocument();
  });

  it('should render as radiogroup for accessibility', () => {
    render(<VolumeModeSelector {...defaultProps} />);

    expect(screen.getByRole('radiogroup')).toBeInTheDocument();
  });

  it('should remain interactive when className is provided', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    render(<VolumeModeSelector {...defaultProps} className="custom-class" onChange={onChange} />);

    await user.click(screen.getByRole('radio', { name: 'Block' }));
    expect(onChange).toHaveBeenCalledWith('Block');
  });
});
