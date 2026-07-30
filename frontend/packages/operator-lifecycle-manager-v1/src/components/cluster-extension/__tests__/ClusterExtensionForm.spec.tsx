import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import ClusterExtensionForm from '../ClusterExtensionForm';

jest.mock('@console/internal/components/utils/k8s-watch-hook', () => ({
  useK8sWatchResource: jest.fn(() => [null, false]),
}));

jest.mock('@console/internal/components/utils', () => ({
  ...jest.requireActual('@console/internal/components/utils'),
  NsDropdown: ({ selectedKey, onChange }) => (
    <div data-testid="ns-dropdown">
      <div data-testid="ns-selected">{selectedKey}</div>
      <button type="button" onClick={() => onChange('selected-namespace')}>
        Select Namespace
      </button>
    </div>
  ),
  resourcePathFromModel: jest.fn(),
}));

jest.mock('@console/shared/src/hooks/useTextInputModal', () => ({
  ...jest.requireActual('@console/shared/src/hooks/useTextInputModal'),
  useTextInputModal: jest.fn(() => jest.fn()),
}));

jest.mock('../ServiceAccountDropdown', () => ({
  ServiceAccountDropdown: ({ selectedKey, onChange }) => (
    <div data-testid="sa-dropdown">
      <div data-testid="sa-selected">{selectedKey}</div>
      <button type="button" onClick={() => onChange('selected-sa')}>
        Select ServiceAccount
      </button>
    </div>
  ),
}));

/** Matches `setTimeout` debounce on name → `debouncedName` in ClusterExtensionForm */
const NAME_DEBOUNCE_MS = 500;

describe('ClusterExtensionForm', () => {
  const mockOnChange = jest.fn();

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render all form fields', () => {
    renderWithProviders(<ClusterExtensionForm formData={{}} onChange={mockOnChange} />);

    expect(screen.getByLabelText('Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Package name')).toBeInTheDocument();
    expect(screen.getByText('Namespace')).toBeInTheDocument();
    expect(screen.getByText('Service Account')).toBeInTheDocument();
    expect(screen.getByLabelText('Version or Version range')).toBeInTheDocument();
    expect(screen.getByLabelText('Channels')).toBeInTheDocument();
    expect(screen.getByLabelText('Catalogs')).toBeInTheDocument();
  });

  it('should initialize with provided formData', () => {
    const formData = {
      metadata: { name: 'test-extension' },
      spec: {
        source: {
          catalog: {
            packageName: 'test-package',
            version: '1.0.0',
          },
        },
        namespace: 'test-namespace',
        serviceAccount: { name: 'test-sa' },
      },
    };

    renderWithProviders(<ClusterExtensionForm formData={formData} onChange={mockOnChange} />);

    expect(screen.getByLabelText('Name')).toHaveValue('test-extension');
    expect(screen.getByLabelText('Package name')).toHaveValue('test-package');
    expect(screen.getByLabelText('Version or Version range')).toHaveValue('1.0.0');
  });

  it('should auto-generate namespace and service account names based on ClusterExtension name', async () => {
    const user = userEvent.setup();
    let currentFormData = {};

    // Render with onChange that tracks formData updates
    const { rerender } = renderWithProviders(
      <ClusterExtensionForm formData={currentFormData} onChange={mockOnChange} />,
    );

    const nameInput = screen.getByRole('textbox', { name: /^Name$/i });
    await user.click(nameInput);
    await user.paste('my-operator');

    // Wait for onChange to be called with the name
    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({ name: 'my-operator' }),
        }),
      );
    });

    // Simulate parent component updating formData
    [currentFormData] = mockOnChange.mock.calls[mockOnChange.mock.calls.length - 1];
    rerender(<ClusterExtensionForm formData={currentFormData} onChange={mockOnChange} />);

    // After debounce, effects sync auto-generated namespace and service account (may be separate onChange calls)
    await waitFor(
      () => {
        const payloads = mockOnChange.mock.calls.map(([data]) => data);
        expect(payloads.some((d) => d?.spec?.namespace === 'my-operator')).toBe(true);
        expect(
          payloads.some((d) => d?.spec?.serviceAccount?.name === 'my-operator-service-account'),
        ).toBe(true);
      },
      { timeout: NAME_DEBOUNCE_MS + 1000 },
    );
  });

  it('should show "Automatically create a new Namespace" radio button checked by default', () => {
    renderWithProviders(<ClusterExtensionForm formData={{}} onChange={mockOnChange} />);

    const createNewRadio = screen.getByRole('radio', {
      name: /Automatically create a new Namespace/,
    });
    expect(createNewRadio).toBeChecked();
  });

  it('should show "Automatically create a new ServiceAccount" radio button checked by default', () => {
    renderWithProviders(<ClusterExtensionForm formData={{}} onChange={mockOnChange} />);

    const createNewRadio = screen.getByRole('radio', {
      name: /Automatically create a new ServiceAccount/,
    });
    expect(createNewRadio).toBeChecked();
  });

  it('should switch to "Select from cluster" when radio button is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ClusterExtensionForm formData={{}} onChange={mockOnChange} />);

    const selectFromClusterRadios = screen.getAllByLabelText('Select from cluster');
    const namespaceRadio = selectFromClusterRadios[0];
    await user.click(namespaceRadio);

    expect(namespaceRadio).toBeChecked();
  });

  it('should update formData when package name changes', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ClusterExtensionForm formData={{}} onChange={mockOnChange} />);

    const packageNameInput = screen.getByRole('textbox', { name: /Package name/i });
    await user.click(packageNameInput);
    await user.paste('test-package');

    // Wait for onChange to be called with updated package name
    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({
          spec: expect.objectContaining({
            source: expect.objectContaining({
              catalog: expect.objectContaining({
                packageName: 'test-package',
              }),
            }),
          }),
        }),
      );
    });
  });

  it('should update formData when version changes', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ClusterExtensionForm formData={{}} onChange={mockOnChange} />);

    const versionInput = screen.getByRole('textbox', { name: /Version or Version range/i });
    await user.click(versionInput);
    await user.paste('1.2.3');

    // Wait for onChange to be called with updated version
    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({
          spec: expect.objectContaining({
            source: expect.objectContaining({
              catalog: expect.objectContaining({
                version: '1.2.3',
              }),
            }),
          }),
        }),
      );
    });
  });

  it('should add channel when Enter is pressed', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ClusterExtensionForm formData={{}} onChange={mockOnChange} />);

    const channelInput = screen.getByLabelText('Channels');
    await user.click(channelInput);
    await user.clear(channelInput);
    await user.type(channelInput, 'stable');
    await user.keyboard('{Enter}');

    await waitFor(() => {
      expect(mockOnChange).toHaveBeenLastCalledWith(
        expect.objectContaining({
          spec: expect.objectContaining({
            source: expect.objectContaining({
              catalog: expect.objectContaining({
                channels: ['stable'],
              }),
            }),
          }),
        }),
      );
    });
  });

  it('should add catalog when Enter is pressed', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ClusterExtensionForm formData={{}} onChange={mockOnChange} />);

    const catalogInput = screen.getByLabelText('Catalogs');
    await user.click(catalogInput);
    await user.clear(catalogInput);
    await user.type(catalogInput, 'redhat-operators');
    await user.keyboard('{Enter}');

    await waitFor(() => {
      expect(mockOnChange).toHaveBeenLastCalledWith(
        expect.objectContaining({
          spec: expect.objectContaining({
            source: expect.objectContaining({
              catalog: expect.objectContaining({
                selector: expect.objectContaining({
                  matchLabels: expect.objectContaining({
                    'olm.operatorframework.io/metadata.name': 'redhat-operators',
                  }),
                }),
              }),
            }),
          }),
        }),
      );
    });
  });

  it('should render channel labels when channels are added', () => {
    const formData = {
      spec: {
        source: {
          catalog: {
            channels: ['stable', 'beta'],
          },
        },
      },
    };

    renderWithProviders(<ClusterExtensionForm formData={formData} onChange={mockOnChange} />);

    expect(screen.getByText('stable')).toBeInTheDocument();
    expect(screen.getByText('beta')).toBeInTheDocument();
  });

  it('should render catalog labels when catalogs are added', () => {
    const formData = {
      spec: {
        source: {
          catalog: {
            selector: {
              matchLabels: {
                'olm.operatorframework.io/metadata.name': 'redhat-operators',
              },
            },
          },
        },
      },
    };

    renderWithProviders(<ClusterExtensionForm formData={formData} onChange={mockOnChange} />);

    expect(screen.getByText('redhat-operators')).toBeInTheDocument();
  });

  it('should show pencil icon for editing auto-generated namespace name', () => {
    const formData = {
      metadata: { name: 'test-operator' },
      spec: {
        namespace: 'test-operator',
      },
    };

    renderWithProviders(<ClusterExtensionForm formData={formData} onChange={mockOnChange} />);

    // Should show the namespace name in the Create new Namespace radio label
    expect(screen.getByText('test-operator', { selector: 'strong' })).toBeInTheDocument();

    // Should show pencil icon button for editing
    const editButtons = screen.getAllByLabelText(/Edit namespace name/i);
    expect(editButtons.length).toBeGreaterThan(0);
  });

  it('should show pencil icon for editing auto-generated service account name', () => {
    const formData = {
      metadata: { name: 'test-operator' },
      spec: {
        serviceAccount: { name: 'test-operator-service-account' },
      },
    };

    renderWithProviders(<ClusterExtensionForm formData={formData} onChange={mockOnChange} />);

    // Should show the service account name in the Create new ServiceAccount radio label
    expect(
      screen.getByText('test-operator-service-account', { selector: 'strong' }),
    ).toBeInTheDocument();

    // Should show pencil icon button for editing
    const editButtons = screen.getAllByLabelText(/Edit service account name/i);
    expect(editButtons.length).toBeGreaterThan(0);
  });

  it('should render Create button with correct text', () => {
    renderWithProviders(<ClusterExtensionForm formData={{}} onChange={mockOnChange} />);

    const createButton = screen.getByRole('button', { name: 'Create' });
    expect(createButton).toBeInTheDocument();
    expect(createButton).toHaveAttribute('type', 'submit');
  });

  it('should render Cancel button', () => {
    renderWithProviders(<ClusterExtensionForm formData={{}} onChange={mockOnChange} />);

    const cancelButton = screen.getByRole('button', { name: 'Cancel' });
    expect(cancelButton).toBeInTheDocument();
    expect(cancelButton).toHaveAttribute('type', 'button');
  });
});
