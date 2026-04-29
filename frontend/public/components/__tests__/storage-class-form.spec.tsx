import { screen, waitFor } from '@testing-library/react';
import {
  renderWithProviders,
  verifyInputField,
} from '@console/shared/src/test-utils/unit-test-utils';
import { StorageClassForm } from '../storage-class-form';

// Mock router
jest.mock('react-router', () => ({
  ...jest.requireActual('react-router'),
  useNavigate: jest.fn(),
}));

describe('StorageClassForm', () => {
  let onClose: jest.Mock;

  const renderForm = () => {
    renderWithProviders(<StorageClassForm onClose={onClose} />);
  };

  beforeEach(() => {
    onClose = jest.fn();
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('verifies StorageClass as the page title', async () => {
    renderForm();
    expect(await screen.findByText('StorageClass')).toBeVisible();
  });

  it('verifies the Edit YAML link', async () => {
    renderForm();
    const editYamlLink = await screen.findByRole('link', { name: 'Edit YAML' });
    expect(editYamlLink).toHaveAttribute('href', '/k8s/cluster/storageclasses/~new');
  });

  it('verifies a text input for storage class name', async () => {
    renderForm();
    await verifyInputField({
      inputLabel: 'Name',
      inputType: 'text',
    });
  });

  it('verifies a text input for storage class description', async () => {
    renderForm();
    await waitFor(() => {
      expect(screen.getByLabelText('Description')).toBeInTheDocument();
    });
    await verifyInputField({
      inputLabel: 'Description',
      testValue: 'Test storage class description',
    });
  });

  it('verifies a dropdown for selecting reclaim policy with correct options and help text', async () => {
    renderForm();
    await waitFor(() => {
      expect(screen.getByLabelText('Reclaim policy')).toBeInTheDocument();
    });

    expect(
      screen.getByText(
        /Determines what happens to persistent volumes when the associated persistent volume claim is deleted/,
      ),
    ).toBeVisible();
  });

  it('verifies a dropdown for selecting volume binding mode with correct options and help text', async () => {
    renderForm();
    await waitFor(() => {
      expect(screen.getByLabelText('Volume binding mode')).toBeInTheDocument();
    });

    expect(
      screen.getByText(/Determines when persistent volume claims will be provisioned and bound/),
    ).toBeVisible();
  });

  it('verifies a dropdown for selecting provisioner with correct help text', async () => {
    renderForm();
    await waitFor(() => {
      expect(screen.getByLabelText('Provisioner')).toBeInTheDocument();
    });

    expect(
      screen.getByText(/Determines what volume plugin is used for provisioning PersistentVolumes/),
    ).toBeVisible();
  });

  it('shows additional parameters section is not visible without selected provisioner', async () => {
    renderForm();
    await waitFor(() => {
      expect(screen.queryByText('Additional parameters')).not.toBeInTheDocument();
    });
  });

  it('should render control buttons', async () => {
    renderForm();
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /create/i })).toBeVisible();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeVisible();
    });
  });
});
