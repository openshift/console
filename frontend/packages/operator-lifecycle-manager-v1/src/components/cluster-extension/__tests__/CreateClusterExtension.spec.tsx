import { screen } from '@testing-library/react';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import CreateClusterExtension from '../CreateClusterExtension';

const mockSyncedEditor = jest.fn();
const mockFormEditor = jest.fn();
const mockUseLocation = jest.fn(() => ({ search: '' }));

jest.mock('@console/shared/src/components/synced-editor', () => ({
  SyncedEditor: (props) => {
    mockSyncedEditor(props);
    return <div data-test="synced-editor">Mocked SyncedEditor</div>;
  },
}));

jest.mock('../ClusterExtensionYAMLEditor', () => ({
  ClusterExtensionYAMLEditor: () => <div>YAML Editor</div>,
}));

jest.mock('../ClusterExtensionForm', () => ({
  __esModule: true,
  default: (props) => {
    mockFormEditor(props);
    return <div data-test="cluster-extension-form">Form Editor</div>;
  },
}));

jest.mock('react-router', () => ({
  ...jest.requireActual('react-router'),
  useLocation: () => mockUseLocation(),
}));

describe('CreateClusterExtension', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render page with correct title', () => {
    renderWithProviders(<CreateClusterExtension />);

    expect(screen.getByRole('heading', { name: 'Create ClusterExtension' })).toBeInTheDocument();
  });

  it('should render help text with correct wording', () => {
    renderWithProviders(<CreateClusterExtension />);

    expect(
      screen.getByText(
        'Create a ClusterExtension to add functionality to your cluster. Operator Lifecycle Manager v1 manages ClusterExtensions.',
      ),
    ).toBeInTheDocument();
  });

  it('should render SyncedEditor component', () => {
    renderWithProviders(<CreateClusterExtension />);

    expect(mockSyncedEditor).toHaveBeenCalled();
  });

  it('should initialize with empty data when no URL params are provided', () => {
    renderWithProviders(<CreateClusterExtension />);

    const syncedEditorProps = mockSyncedEditor.mock.calls[0][0];
    const { initialData } = syncedEditorProps;

    expect(initialData.metadata.name).toBe('');
    expect(initialData.spec.namespace).toBe('');
    expect(initialData.spec.source.catalog.packageName).toBe('');
  });

  it('should initialize data from URL query parameters', () => {
    mockUseLocation.mockReturnValueOnce({
      search: '?packageName=test-operator&version=1.0.0&catalog=redhat-operators',
    });

    renderWithProviders(<CreateClusterExtension />);

    const syncedEditorProps = mockSyncedEditor.mock.calls[0][0];
    const { initialData } = syncedEditorProps;

    expect(initialData.metadata.name).toBe('test-operator');
    expect(initialData.spec.namespace).toBe('test-operator');
    expect(initialData.spec.serviceAccount.name).toBe('test-operator-service-account');
    expect(initialData.spec.source.catalog.packageName).toBe('test-operator');
    expect(initialData.spec.source.catalog.version).toBe('1.0.0');
    expect(initialData.spec.source.catalog.selector.matchLabels).toEqual({
      'olm.operatorframework.io/metadata.name': 'redhat-operators',
    });
  });

  it('should initialize data with packageName only from URL', () => {
    mockUseLocation.mockReturnValueOnce({
      search: '?packageName=my-operator',
    });

    renderWithProviders(<CreateClusterExtension />);

    const syncedEditorProps = mockSyncedEditor.mock.calls[0][0];
    const { initialData } = syncedEditorProps;

    expect(initialData.metadata.name).toBe('my-operator');
    expect(initialData.spec.namespace).toBe('my-operator');
    expect(initialData.spec.source.catalog.packageName).toBe('my-operator');
    expect(initialData.spec.source.catalog.version).toBeUndefined();
    expect(initialData.spec.source.catalog.selector).toBeUndefined();
  });
});
