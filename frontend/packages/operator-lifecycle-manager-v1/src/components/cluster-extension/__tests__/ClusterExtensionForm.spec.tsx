import { screen, fireEvent } from '@testing-library/react';
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

jest.mock('@console/shared/src/hooks', () => ({
  ...jest.requireActual('@console/shared/src/hooks'),
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

  it('should auto-generate namespace and service account names based on ClusterExtension name', () => {
    renderWithProviders(<ClusterExtensionForm formData={{}} onChange={mockOnChange} />);

    const nameInput = screen.getByLabelText('Name');
    fireEvent.change(nameInput, { target: { value: 'my-operator' } });

    // Should call onChange with auto-generated names
    expect(mockOnChange).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.objectContaining({ name: 'my-operator' }),
      }),
    );
  });

  it('should show "Create new Namespace" radio button checked by default', () => {
    renderWithProviders(<ClusterExtensionForm formData={{}} onChange={mockOnChange} />);

    const createNewRadio = screen.getByLabelText(/Create new Namespace/);
    expect(createNewRadio).toBeChecked();
  });

  it('should show "Create new ServiceAccount" radio button checked by default', () => {
    renderWithProviders(<ClusterExtensionForm formData={{}} onChange={mockOnChange} />);

    const createNewRadio = screen.getByLabelText(/Create new ServiceAccount/);
    expect(createNewRadio).toBeChecked();
  });

  it('should switch to "Select from cluster" when radio button is clicked', () => {
    renderWithProviders(<ClusterExtensionForm formData={{}} onChange={mockOnChange} />);

    const selectFromClusterRadios = screen.getAllByLabelText('Select from cluster');
    const namespaceRadio = selectFromClusterRadios[0];
    fireEvent.click(namespaceRadio);

    expect(namespaceRadio).toBeChecked();
  });

  it('should update formData when package name changes', () => {
    renderWithProviders(<ClusterExtensionForm formData={{}} onChange={mockOnChange} />);

    const packageNameInput = screen.getByLabelText('Package name');
    fireEvent.change(packageNameInput, { target: { value: 'test-package' } });

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

  it('should update formData when version changes', () => {
    renderWithProviders(<ClusterExtensionForm formData={{}} onChange={mockOnChange} />);

    const versionInput = screen.getByLabelText('Version or Version range');
    fireEvent.change(versionInput, { target: { value: '1.2.3' } });

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

  it('should add channel when Enter is pressed', () => {
    renderWithProviders(<ClusterExtensionForm formData={{}} onChange={mockOnChange} />);

    const channelInput = screen.getByLabelText('Channels');
    fireEvent.change(channelInput, { target: { value: 'stable' } });
    fireEvent.keyDown(channelInput, { key: 'Enter', code: 'Enter' });

    expect(mockOnChange).toHaveBeenCalledWith(
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

  it('should add catalog when Enter is pressed', () => {
    renderWithProviders(<ClusterExtensionForm formData={{}} onChange={mockOnChange} />);

    const catalogInput = screen.getByLabelText('Catalogs');
    fireEvent.change(catalogInput, { target: { value: 'redhat-operators' } });
    fireEvent.keyDown(catalogInput, { key: 'Enter', code: 'Enter' });

    expect(mockOnChange).toHaveBeenCalledWith(
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
});
