import { screen, waitFor } from '@testing-library/react';
import {
  renderWithProviders,
  verifyInputField,
} from '@console/shared/src/test-utils/unit-test-utils';
import { StorageClassForm } from '../storage-class-form';

// Mock router
jest.mock('react-router-dom-v5-compat', () => ({
  ...jest.requireActual('react-router-dom-v5-compat'),
  useNavigate: jest.fn(),
}));

// Mock Firehose
jest.mock('../utils/firehose', () => ({
  Firehose: ({ children }) => children,
}));

describe('StorageClassForm', () => {
  let onClose: jest.Mock;

  beforeEach(async () => {
    onClose = jest.fn();

    renderWithProviders(<StorageClassForm onClose={onClose} />);

    await waitFor(() => {
      expect(screen.getByText('StorageClass')).toBeInTheDocument();
    });
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('verifies StorageClass as the page title', async () => {
    expect(await screen.findByText('StorageClass')).toBeVisible();
  });

  it('verifies the Edit YAML link', async () => {
    expect(await screen.findByText('Edit YAML')).toBeVisible();
  });

  it('verifies a text input for storage class name', async () => {
    await waitFor(() => {
      verifyInputField({
        inputLabel: 'Name',
        inputType: 'text',
      });
    });
  });

  it('verifies a text input for storage class description', async () => {
    await waitFor(() => {
      verifyInputField({
        inputLabel: 'Description',
        testValue: 'Test storage class description',
      });
    });
  });

  it('verifies a dropdown for selecting reclaim policy with correct options and help text', async () => {
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
    await waitFor(() => {
      expect(screen.getByLabelText('Volume binding mode')).toBeInTheDocument();
    });

    expect(
      screen.getByText(/Determines when persistent volume claims will be provisioned and bound/),
    ).toBeVisible();
  });

  it('verifies a dropdown for selecting provisioner with correct help text', async () => {
    await waitFor(() => {
      expect(screen.getByLabelText('Provisioner')).toBeInTheDocument();
    });

    expect(
      screen.getByText(/Determines what volume plugin is used for provisioning PersistentVolumes/),
    ).toBeVisible();
  });

  it('shows additional parameters section is not visible without selected provisioner', async () => {
    await waitFor(() => {
      expect(screen.queryByText('Additional parameters')).not.toBeInTheDocument();
    });
  });

  it('should render control buttons', async () => {
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /create/i })).toBeVisible();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeVisible();
    });
  });
});
