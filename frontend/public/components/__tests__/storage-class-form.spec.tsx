import { screen, configure, fireEvent, waitFor } from '@testing-library/react';

import {
  renderWithProviders,
  verifyInputField,
} from '@console/shared/src/test-utils/unit-test-utils';
import { ConnectedStorageClassForm, StorageClassFormProps } from '../storage-class-form';

configure({ testIdAttribute: 'data-test-id' });

jest.mock('react-router-dom-v5-compat', () => ({
  ...jest.requireActual('react-router-dom-v5-compat'),
  useNavigate: jest.fn(),
}));

// Helper function to test dropdown components with options and help text
const verifyDropdownField = async ({
  dropdownName,
  expectedOptions,
  defaultSelection,
  helpTextPatterns,
  testInteraction = false,
}: {
  dropdownName: string;
  expectedOptions: string[];
  defaultSelection: string;
  helpTextPatterns: (string | RegExp)[];
  testInteraction?: boolean;
}) => {
  // Verify the dropdown button is visible
  const dropdown = screen.getByRole('button', { name: dropdownName });
  expect(dropdown).toBeVisible();

  // Verify help text is displayed
  helpTextPatterns.forEach((pattern) => {
    expect(screen.getByText(pattern)).toBeInTheDocument();
  });

  // Verify the default selection is displayed
  expect(screen.getByText(defaultSelection)).toBeInTheDocument();

  // Optionally test dropdown interaction
  if (testInteraction) {
    // Click to open the dropdown
    fireEvent.click(dropdown);

    // Wait for all expected options to appear
    for (const option of expectedOptions) {
      const optionElements = await screen.findAllByText(option);
      expect(optionElements.length).toBeGreaterThanOrEqual(1);
      expect(optionElements[0]).toBeInTheDocument();
    }
  }
};

describe(ConnectedStorageClassForm.displayName, () => {
  const Component: React.ComponentType<Omit<
    StorageClassFormProps,
    't' | 'i18n' | 'tReady'
  >> = ConnectedStorageClassForm.WrappedComponent as any;
  let onClose: jest.Mock;
  let watchK8sList: jest.Mock;
  let stopK8sWatch: jest.Mock;
  let k8s: jest.Mock;

  afterAll(() => {
    jest.restoreAllMocks();
  });

  beforeEach(async () => {
    onClose = jest.fn();
    watchK8sList = jest.fn();
    stopK8sWatch = jest.fn();
    k8s = jest.fn();

    renderWithProviders(
      <Component
        onClose={onClose}
        watchK8sList={watchK8sList}
        stopK8sWatch={stopK8sWatch}
        k8s={k8s}
      />,
    );

    // Wait for the component to fully render and settle
    await waitFor(() => {
      expect(screen.getByText('StorageClass')).toBeInTheDocument();
    });
  });

  it('displays StorageClass as the page title', async () => {
    expect(await screen.findByText('StorageClass')).toBeVisible();
  });

  it('displays the Edit YAML link', async () => {
    expect(await screen.findByText('Edit YAML')).toBeVisible();
  });

  it('displays a text input for storage class name', async () => {
    await waitFor(() => {
      verifyInputField({
        inputLabel: 'Name',
        inputType: 'text',
        containerId: 'storage-class-form',
      });
    });
  });

  it('displays a text input for storage class description', async () => {
    await waitFor(() => {
      verifyInputField({
        inputLabel: 'Description',
        containerId: 'storage-class-form',
        testValue: 'Test storage class description',
      });
    });
  });

  it('displays a dropdown for selecting reclaim policy with correct options and help text', async () => {
    await verifyDropdownField({
      dropdownName: 'Reclaim policy',
      expectedOptions: ['Delete', 'Retain'],
      defaultSelection: 'Delete',
      helpTextPatterns: [
        /Determines what happens to persistent volumes when the associated persistent volume claim is deleted/,
        /Defaults to "Delete"/,
      ],
    });
  });

  it('reclaim policy dropdown contains both Retain and Delete options when opened', async () => {
    await verifyDropdownField({
      dropdownName: 'Reclaim policy',
      expectedOptions: ['Delete', 'Retain'],
      defaultSelection: 'Delete',
      helpTextPatterns: [
        /Determines what happens to persistent volumes when the associated persistent volume claim is deleted/,
        /Defaults to "Delete"/,
      ],
      testInteraction: true,
    });
  });

  it('displays a dropdown for selecting volume binding mode with correct options and help text', async () => {
    await verifyDropdownField({
      dropdownName: 'Volume binding mode',
      expectedOptions: ['Immediate', 'WaitForFirstConsumer'],
      defaultSelection: 'WaitForFirstConsumer',
      helpTextPatterns: [
        /Determines when persistent volume claims will be provisioned and bound/,
        /Defaults to "WaitForFirstConsumer"/,
      ],
    });
  });

  it('volume binding mode dropdown contains both Immediate and WaitForFirstConsumer options when opened', async () => {
    await verifyDropdownField({
      dropdownName: 'Volume binding mode',
      expectedOptions: ['Immediate', 'WaitForFirstConsumer'],
      defaultSelection: 'WaitForFirstConsumer',
      helpTextPatterns: [
        /Determines when persistent volume claims will be provisioned and bound/,
        /Defaults to "WaitForFirstConsumer"/,
      ],
      testInteraction: true,
    });
  });

  it('displays a dropdown for selecting provisioner with correct help text', async () => {
    await verifyDropdownField({
      dropdownName: 'Provisioner',
      expectedOptions: ['kubernetes.io/aws-ebs', 'kubernetes.io/azure-file'],
      defaultSelection: 'Select Provisioner',
      helpTextPatterns: [
        /Determines what volume plugin is used for provisioning PersistentVolumes/,
      ],
    });
  });

  it('shows additional parameters section is not visible without selected provisioner', async () => {
    await waitFor(() => {
      expect(screen.queryByText('Additional parameters')).not.toBeInTheDocument();
    });
  });

  it('should render control buttons in a button bar', async () => {
    expect(await screen.findByRole('button', { name: 'Create' })).toBeVisible();
    expect(await screen.findByRole('button', { name: 'Cancel' })).toBeVisible();
  });
});
