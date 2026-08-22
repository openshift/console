import * as Router from 'react-router';
import { CreateYAML } from '@console/internal/components/create-yaml';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { EditorType } from '@console/shared/src/components/synced-editor/editor-toggle';
import { SyncedEditor } from '@console/shared/src/components/synced-editor/SyncedEditor';
import { useK8sModel } from '@console/shared/src/hooks/useK8sModel';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import { testClusterServiceVersion, testModel, testCRD } from '../../../../mocks';
import { CreateOperand } from '../create-operand';
import { OperandYAML } from '../operand-yaml';

jest.mock('@console/shared/src/hooks/useK8sModel', () => ({ useK8sModel: jest.fn() }));

jest.mock('@console/internal/components/utils/k8s-watch-hook', () => ({
  useK8sWatchResource: jest.fn(),
}));

jest.mock('react-router', () => ({
  ...jest.requireActual('react-router'),
  useParams: jest.fn(),
}));

jest.mock('@console/dynamic-plugin-sdk', () => ({
  useActivePerspective: jest.fn(() => ['admin']),
}));

jest.mock('@console/shared/src/components/synced-editor/SyncedEditor', () => ({
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
const mockSyncedEditor = SyncedEditor as unknown as jest.Mock;
const mockCreateYAML = CreateYAML as unknown as jest.Mock;

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
    renderWithProviders(
      <CreateOperand
        initialEditorType={EditorType.YAML}
        csv={testClusterServiceVersion}
        loaded
        loadError={undefined}
      />,
    );

    expect(mockSyncedEditor).toHaveBeenCalledTimes(1);
    const [syncedEditorProps] = mockSyncedEditor.mock.calls[0];
    expect(syncedEditorProps.initialType).toEqual(EditorType.YAML);
  });

  it('configures SyncedEditor with Form as initialType when initialEditorType is Form', () => {
    renderWithProviders(
      <CreateOperand
        initialEditorType={EditorType.Form}
        csv={testClusterServiceVersion}
        loaded
        loadError={undefined}
      />,
    );

    expect(mockSyncedEditor).toHaveBeenCalledTimes(1);
    const [syncedEditorProps] = mockSyncedEditor.mock.calls[0];
    expect(syncedEditorProps.initialType).toEqual(EditorType.Form);
  });

  it('passes sample data to SyncedEditor when CSV contains alm-examples annotation', () => {
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

  it('applies CRD schema defaults to sample data when starting in YAML mode (OCPBUGS-70361)', () => {
    // When the editor starts directly in YAML mode (from a saved user preference),
    // the @rjsf/core Form never mounts, so it never applies the CRD schema defaults
    // as a side effect. CreateOperand must enrich the sample with schema defaults
    // itself, so the YAML editor shows the same complete content as the Form-first path.

    // A CRD whose schema defines a spec default that is NOT in alm-examples
    const crdWithSchemaDefault = {
      ...testCRD,
      spec: {
        ...testCRD.spec,
        versions: [
          {
            name: 'v1alpha1',
            served: true,
            storage: true,
            schema: {
              openAPIV3Schema: {
                type: 'object',
                properties: {
                  spec: {
                    type: 'object',
                    properties: {
                      replicas: { type: 'integer', default: 3 },
                    },
                  },
                },
              },
            },
          },
        ],
      },
    };
    mockUseK8sWatchResource.mockReturnValue([crdWithSchemaDefault, true, undefined]);

    const csvWithMinimalExample = {
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
              spec: {},
            },
          ]),
        },
      },
    };

    renderWithProviders(
      <CreateOperand
        initialEditorType={EditorType.YAML}
        csv={csvWithMinimalExample}
        loaded
        loadError={undefined}
      />,
    );

    // The schema default was merged into the sample before reaching SyncedEditor
    expect(mockSyncedEditor).toHaveBeenCalledTimes(1);
    const [syncedEditorProps] = mockSyncedEditor.mock.calls[0];
    expect(syncedEditorProps.initialData.spec.replicas).toBe(3);
  });

  it('does not render SyncedEditor until the CRD watch has loaded (OCPBUGS-70361)', () => {
    // Regression test for OCPBUGS-70361. SyncedEditor snapshots its initial YAML
    // from the sample exactly once, on mount, and never re-syncs it. The sample is
    // only enriched with CRD schema defaults once the CRD has loaded, so mounting
    // SyncedEditor before the CRD watch resolves would freeze the raw, un-enriched
    // YAML. CreateOperand must wait for the CRD watch to load before rendering.

    // CRD watch not yet loaded
    mockUseK8sWatchResource.mockReturnValue([{}, false, undefined]);

    renderWithProviders(
      <CreateOperand
        initialEditorType={EditorType.YAML}
        csv={testClusterServiceVersion}
        loaded
        loadError={undefined}
      />,
    );

    // Editor is withheld until the schema is available
    expect(mockSyncedEditor).not.toHaveBeenCalled();
  });

  it('passes an onCancel handler to the YAML editor via yamlContext (OCPBUGS-70361)', () => {
    // Regression test for OCPBUGS-70361. The YAML view must cancel the same way the
    // Form view does (back to the operator context) instead of falling through to
    // EditYAML's generic navigate-to-list behavior, which drops the user onto the
    // generic create page. CreateOperand supplies that handler via yamlContext.
    renderWithProviders(
      <CreateOperand
        initialEditorType={EditorType.YAML}
        csv={testClusterServiceVersion}
        loaded
        loadError={undefined}
      />,
    );

    expect(mockSyncedEditor).toHaveBeenCalledTimes(1);
    const [syncedEditorProps] = mockSyncedEditor.mock.calls[0];
    expect(typeof syncedEditorProps.context.yamlContext.onCancel).toBe('function');
  });

  it('provides onChangeEditorType callback to SyncedEditor', () => {
    renderWithProviders(
      <CreateOperand
        initialEditorType={EditorType.Form}
        csv={testClusterServiceVersion}
        loaded
        loadError={undefined}
      />,
    );

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

  it('forwards onCancel to CreateYAML when provided (OCPBUGS-70361)', () => {
    const onCancel = jest.fn();

    renderWithProviders(<OperandYAML onCancel={onCancel} />);

    expect(mockCreateYAML).toHaveBeenCalledTimes(1);
    const [createYAMLProps] = mockCreateYAML.mock.calls[0];
    expect(createYAMLProps.onCancel).toBe(onCancel);
  });

  it('leaves onCancel undefined when not provided, so EditYAML falls back to its default cancel behavior', () => {
    renderWithProviders(<OperandYAML />);

    expect(mockCreateYAML).toHaveBeenCalledTimes(1);
    const [createYAMLProps] = mockCreateYAML.mock.calls[0];
    expect(createYAMLProps.onCancel).toBeUndefined();
  });
});
