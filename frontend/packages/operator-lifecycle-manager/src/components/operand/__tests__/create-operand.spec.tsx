import * as Router from 'react-router-dom-v5-compat';
import { CreateYAML } from '@console/internal/components/create-yaml';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { SyncedEditor } from '@console/shared/src/components/synced-editor';
import { EditorType } from '@console/shared/src/components/synced-editor/editor-toggle';
import { useK8sModel } from '@console/shared/src/hooks/useK8sModel';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import { testClusterServiceVersion, testModel, testCRD } from '../../../../mocks';
import { CreateOperand } from '../create-operand';
import { OperandYAML } from '../operand-yaml';

jest.mock('@console/shared/src/hooks/useK8sModel', () => ({ useK8sModel: jest.fn() }));

jest.mock('@console/internal/components/utils/k8s-watch-hook', () => ({
  useK8sWatchResource: jest.fn(),
}));

jest.mock('react-router-dom-v5-compat', () => ({
  ...jest.requireActual('react-router-dom-v5-compat'),
  useParams: jest.fn(),
}));

jest.mock('@console/dynamic-plugin-sdk', () => ({
  useActivePerspective: jest.fn(() => ['admin']),
}));

jest.mock('@console/shared/src/components/synced-editor', () => ({
  SyncedEditor: jest.fn(() => null),
}));

jest.mock('@console/internal/components/create-yaml', () => ({
  CreateYAML: jest.fn(() => null),
}));

jest.mock('@console/shared/src/components/heading/PageHeading', () => ({
  PageHeading: jest.fn(() => null),
}));

const mockUseK8sModel = useK8sModel as jest.Mock;
const mockUseK8sWatchResource = useK8sWatchResource as jest.Mock;
const mockSyncedEditor = (SyncedEditor as unknown) as jest.Mock;
const mockCreateYAML = (CreateYAML as unknown) as jest.Mock;

describe('CreateOperand', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Router, 'useParams').mockReturnValue({ ns: 'default', plural: 'testresources' });
    mockUseK8sModel.mockReturnValue([testModel, true]);
    mockUseK8sWatchResource.mockReturnValue([testCRD, true, undefined]);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('configures SyncedEditor with YAML as initialType when initialEditorType is YAML', () => {
    // Arrange
    renderWithProviders(
      <CreateOperand
        initialEditorType={EditorType.YAML}
        csv={testClusterServiceVersion}
        loaded
        loadError={undefined}
      />,
    );

    // Assert
    expect(mockSyncedEditor).toHaveBeenCalledTimes(1);
    const [syncedEditorProps] = mockSyncedEditor.mock.calls[0];
    expect(syncedEditorProps.initialType).toEqual(EditorType.YAML);
  });

  it('configures SyncedEditor with Form as initialType when initialEditorType is Form', () => {
    // Arrange
    renderWithProviders(
      <CreateOperand
        initialEditorType={EditorType.Form}
        csv={testClusterServiceVersion}
        loaded
        loadError={undefined}
      />,
    );

    // Assert
    expect(mockSyncedEditor).toHaveBeenCalledTimes(1);
    const [syncedEditorProps] = mockSyncedEditor.mock.calls[0];
    expect(syncedEditorProps.initialType).toEqual(EditorType.Form);
  });

  it('passes sample data to SyncedEditor when CSV contains alm-examples annotation', () => {
    // Arrange
    const csvWithExamples = {
      ...testClusterServiceVersion,
      metadata: {
        ...testClusterServiceVersion.metadata,
        annotations: {
          ...testClusterServiceVersion.metadata.annotations,
          'alm-examples': JSON.stringify([
            {
              apiVersion: 'testapp.coreos.com/v1alpha1',
              kind: 'TestResource',
              metadata: { name: 'example-resource' },
              spec: { size: 3 },
            },
          ]),
        },
      },
    };

    renderWithProviders(
      <CreateOperand
        initialEditorType={EditorType.YAML}
        csv={csvWithExamples}
        loaded
        loadError={undefined}
      />,
    );

    // Assert
    expect(mockSyncedEditor).toHaveBeenCalledTimes(1);
    const [syncedEditorProps] = mockSyncedEditor.mock.calls[0];
    expect(syncedEditorProps.initialData).toMatchObject({
      kind: 'TestResource',
      metadata: expect.objectContaining({
        name: 'example-resource',
      }),
      spec: expect.objectContaining({
        size: 3,
      }),
    });
  });

  it('provides onChangeEditorType callback to SyncedEditor', () => {
    // Arrange
    renderWithProviders(
      <CreateOperand
        initialEditorType={EditorType.Form}
        csv={testClusterServiceVersion}
        loaded
        loadError={undefined}
      />,
    );

    // Assert
    expect(mockSyncedEditor).toHaveBeenCalledTimes(1);
    const [syncedEditorProps] = mockSyncedEditor.mock.calls[0];
    expect(syncedEditorProps.onChangeEditorType).toBeDefined();
    expect(typeof syncedEditorProps.onChangeEditorType).toBe('function');
  });
});

describe('OperandYAML', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders CreateYAML with hideHeader prop set to true', () => {
    renderWithProviders(<OperandYAML />);

    expect(mockCreateYAML).toHaveBeenCalledTimes(1);
    const [createYAMLProps] = mockCreateYAML.mock.calls[0];
    expect(createYAMLProps.hideHeader).toBe(true);
  });

  it('passes initialYAML as template prop to CreateYAML', () => {
    const initialYAML = 'apiVersion: v1\nkind: Pod';

    renderWithProviders(<OperandYAML initialYAML={initialYAML} />);

    expect(mockCreateYAML).toHaveBeenCalledTimes(1);
    const [createYAMLProps] = mockCreateYAML.mock.calls[0];
    expect(createYAMLProps.template).toEqual(initialYAML);
  });

  it('defaults initialYAML to empty string when not provided', () => {
    renderWithProviders(<OperandYAML />);

    expect(mockCreateYAML).toHaveBeenCalledTimes(1);
    const [createYAMLProps] = mockCreateYAML.mock.calls[0];
    expect(createYAMLProps.template).toEqual('');
  });

  it('passes onChange callback to CreateYAML', () => {
    const onChange = jest.fn();

    renderWithProviders(<OperandYAML onChange={onChange} />);

    expect(mockCreateYAML).toHaveBeenCalledTimes(1);
    const [createYAMLProps] = mockCreateYAML.mock.calls[0];
    expect(createYAMLProps.onChange).toEqual(onChange);
  });

  it('passes resourceObjPath function when next prop is provided', () => {
    const next = '/next-path';

    renderWithProviders(<OperandYAML next={next} />);

    expect(mockCreateYAML).toHaveBeenCalledTimes(1);
    const [createYAMLProps] = mockCreateYAML.mock.calls[0];
    expect(createYAMLProps.resourceObjPath).toBeDefined();
    expect(typeof createYAMLProps.resourceObjPath).toBe('function');
    expect(createYAMLProps.resourceObjPath()).toEqual(next);
  });

  it('does not pass resourceObjPath when next prop is not provided', () => {
    renderWithProviders(<OperandYAML />);

    expect(mockCreateYAML).toHaveBeenCalledTimes(1);
    const [createYAMLProps] = mockCreateYAML.mock.calls[0];
    expect(createYAMLProps.resourceObjPath).toBeUndefined();
  });
});
