import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SecretModel } from '@console/internal/models';
import { k8sCreate } from '@console/internal/module/k8s';
import { HelmCreateBasicAuthSecretModal } from '../HelmCreateBasicAuthSecretModal';

jest.mock('@console/internal/module/k8s', () => ({
  ...jest.requireActual('@console/internal/module/k8s'),
  k8sCreate: jest.fn(),
}));

const mockCloseOverlay = jest.fn();
const mockSave = jest.fn();
const mockOnClose = jest.fn();

const defaultProps = {
  closeOverlay: mockCloseOverlay,
  namespace: 'test-ns',
  save: mockSave,
  onClose: mockOnClose,
};

describe('HelmCreateBasicAuthSecretModal', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render the modal with all form fields and buttons', () => {
    render(<HelmCreateBasicAuthSecretModal {...defaultProps} />);

    expect(screen.getByText('Secret name')).toBeVisible();
    expect(screen.getByText('Secret username')).toBeVisible();
    expect(screen.getByText('Secret password or token')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Create' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeVisible();
  });

  it('should disable the Create button when required fields are empty', () => {
    render(<HelmCreateBasicAuthSecretModal {...defaultProps} />);

    const createButton = screen.getByRole('button', { name: 'Create' });
    expect(createButton).toBeDisabled();
  });

  it('should enable the Create button when all required fields are filled', async () => {
    const user = userEvent.setup();
    render(<HelmCreateBasicAuthSecretModal {...defaultProps} />);

    await user.type(screen.getByTestId('helm-secret-name'), 'my-secret');
    await user.type(screen.getByTestId('helm-secret-username'), 'admin');
    await user.type(screen.getByTestId('helm-secret-password'), 'pass123');

    expect(screen.getByRole('button', { name: 'Create' })).toBeEnabled();
  });

  it('should call k8sCreate with correct Secret shape and invoke save callback on success', async () => {
    const user = userEvent.setup();
    (k8sCreate as jest.Mock).mockResolvedValue({});
    render(<HelmCreateBasicAuthSecretModal {...defaultProps} />);

    await user.type(screen.getByTestId('helm-secret-name'), '  my-secret  ');
    await user.type(screen.getByTestId('helm-secret-username'), 'admin');
    await user.type(screen.getByTestId('helm-secret-password'), 'pass123');
    await user.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() => {
      expect(k8sCreate).toHaveBeenCalledWith(SecretModel, {
        apiVersion: 'v1',
        kind: 'Secret',
        metadata: {
          name: 'my-secret',
          namespace: 'test-ns',
        },
        type: 'kubernetes.io/basic-auth',
        stringData: {
          username: 'admin',
          password: 'pass123',
        },
      });
    });

    expect(mockSave).toHaveBeenCalledWith('my-secret');
    expect(mockCloseOverlay).toHaveBeenCalled();
  });

  it('should display error message when k8sCreate fails', async () => {
    const user = userEvent.setup();
    (k8sCreate as jest.Mock).mockRejectedValue(new Error('Secret already exists'));
    render(<HelmCreateBasicAuthSecretModal {...defaultProps} />);

    await user.type(screen.getByTestId('helm-secret-name'), 'my-secret');
    await user.type(screen.getByTestId('helm-secret-username'), 'admin');
    await user.type(screen.getByTestId('helm-secret-password'), 'pass123');
    await user.click(screen.getByRole('button', { name: 'Create' }));

    expect(await screen.findByText('Secret already exists')).toBeVisible();
    expect(mockSave).not.toHaveBeenCalled();
    expect(mockCloseOverlay).not.toHaveBeenCalled();
  });

  it('should call closeOverlay and onClose when Cancel button is clicked', async () => {
    const user = userEvent.setup();
    render(<HelmCreateBasicAuthSecretModal {...defaultProps} />);

    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(mockCloseOverlay).toHaveBeenCalled();
    expect(mockOnClose).toHaveBeenCalled();
    expect(mockSave).not.toHaveBeenCalled();
  });

  it('should keep Create button disabled when only secret name and password are filled but username is empty', async () => {
    const user = userEvent.setup();
    render(<HelmCreateBasicAuthSecretModal {...defaultProps} />);

    await user.type(screen.getByTestId('helm-secret-name'), 'my-secret');
    await user.type(screen.getByTestId('helm-secret-password'), 'pass123');

    expect(screen.getByRole('button', { name: 'Create' })).toBeDisabled();
  });
});
