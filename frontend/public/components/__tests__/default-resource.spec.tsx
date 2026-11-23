import type { LoadedAndResolvedExtension } from '@openshift/dynamic-plugin-sdk';
import { screen } from '@testing-library/react';
import { createUserSettingsStore } from '@console/app/src/providers/user-preferences/UserPreferenceContext';
import { useResolvedExtensions } from '@console/dynamic-plugin-sdk/src/api/useResolvedExtensions';
import { OverlayProvider } from '@console/dynamic-plugin-sdk/src/app/modal-support/OverlayProvider';
import type { ResourceActionProvider } from '@console/dynamic-plugin-sdk/src/extensions/actions';
import { useK8sModel } from '@console/dynamic-plugin-sdk/src/utils/k8s/hooks/useK8sModel';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import { PodModel } from '../../models';
import type { K8sResourceKind } from '../../module/k8s';
import { DefaultList, DefaultDetailsPage } from '../default-resource';
import { DetailsPage } from '../factory/details';

jest.mock('../factory/details', () => ({
  DetailsPage: jest.fn(() => null),
}));

jest.mock('@console/dynamic-plugin-sdk/src/api/useResolvedExtensions', () => ({
  useResolvedExtensions: jest.fn(),
}));

jest.mock('@console/dynamic-plugin-sdk/src/utils/k8s/hooks/useK8sModel', () => ({
  useK8sModel: jest.fn(),
}));

// Render the two action-menu branches as text so the tests can assert which one was chosen,
// and which context ID the extension branch resolved against.
jest.mock('@console/shared/src/components/actions/LazyActionMenu', () => ({
  LazyActionMenu: ({ context }) => `extension actions for ${Object.keys(context).join(',')}`,
}));
jest.mock('@console/shared/src/components/actions/menu/ActionMenu', () => ({
  ActionMenu: () => 'common actions only',
}));

jest.mock('@console/shared/src/hooks/useCRDAdditionalPrinterColumns', () => ({
  useCRDAdditionalPrinterColumns: () => [[], true],
}));

const pod: K8sResourceKind = {
  apiVersion: 'v1',
  kind: 'Pod',
  metadata: { name: 'nginx', namespace: 'default' },
};

const podActionProvider: LoadedAndResolvedExtension<ResourceActionProvider> = {
  type: 'console.action/resource-provider',
  pluginName: 'test-plugin',
  uid: 'test-pod-actions',
  properties: {
    model: { version: 'v1', kind: 'Pod' },
    provider: () => [[], true, undefined],
  },
};

const deploymentActionProvider: LoadedAndResolvedExtension<ResourceActionProvider> = {
  type: 'console.action/resource-provider',
  pluginName: 'test-plugin',
  uid: 'test-deployment-actions',
  properties: {
    model: { group: 'apps', version: 'v1', kind: 'Deployment' },
    provider: () => [[], true, undefined],
  },
};

const renderList = (
  kinds: string[],
  extensions: LoadedAndResolvedExtension<ResourceActionProvider>[],
  { modelResolved = true } = {},
) => {
  (useK8sModel as jest.Mock).mockReturnValue([modelResolved ? PodModel : undefined, false]);

  const resolved = new WeakMap<Function, [unknown[], boolean, unknown[]]>();
  (useResolvedExtensions as jest.Mock).mockImplementation(
    (predicate: (extension: unknown) => boolean) => {
      if (!resolved.has(predicate)) {
        resolved.set(predicate, [extensions.filter(predicate), true, []]);
      }
      return resolved.get(predicate);
    },
  );

  const userSettingsStore = createUserSettingsStore();
  userSettingsStore.setSnapshot({ data: {}, loaded: true, isLocalStorage: true });
  userSettingsStore.setUpdateKey(async () => undefined);

  return renderWithProviders(
    <OverlayProvider>
      <DefaultList kinds={kinds} data={[pod]} loaded />
    </OverlayProvider>,
    { userSettingsStore },
  );
};

/**
 * DefaultDetailsPage reaches its menu through DetailsPage, so render only the customActionMenu
 * it builds. That callback is the whole of the branch under test.
 */
const renderDetailsActionMenu = (
  kind: string,
  extensions: LoadedAndResolvedExtension<ResourceActionProvider>[],
  { modelResolved = true } = {},
) => {
  (useK8sModel as jest.Mock).mockReturnValue([modelResolved ? PodModel : undefined, false]);

  const resolved = new WeakMap<Function, [unknown[], boolean, unknown[]]>();
  (useResolvedExtensions as jest.Mock).mockImplementation(
    (predicate: (extension: unknown) => boolean) => {
      if (!resolved.has(predicate)) {
        resolved.set(predicate, [extensions.filter(predicate), true, []]);
      }
      return resolved.get(predicate);
    },
  );

  let customActionMenu;
  (DetailsPage as unknown as jest.Mock).mockImplementation((props) => {
    customActionMenu = props.customActionMenu;
    return null;
  });

  renderWithProviders(
    <OverlayProvider>
      <DefaultDetailsPage kind={kind} />
    </OverlayProvider>,
  );

  return renderWithProviders(<>{customActionMenu(PodModel, pod)}</>);
};

describe('DefaultDetailsPage action menu', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should resolve extension actions when the kind is a bare kind string', () => {
    renderDetailsActionMenu('Pod', [podActionProvider]);

    expect(screen.getByText('extension actions for core~v1~Pod')).toBeVisible();
  });

  it('should fall back to common actions when no provider is registered for the model', () => {
    renderDetailsActionMenu('Pod', []);

    expect(screen.getByText('common actions only')).toBeVisible();
  });

  it('should fall back to common actions while the model is still being discovered', () => {
    renderDetailsActionMenu('Pod', [podActionProvider], { modelResolved: false });

    expect(screen.getByText('common actions only')).toBeVisible();
  });
});

describe('DefaultList action menu', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should resolve extension actions when the kind is a bare kind string', async () => {
    // A plural URL such as /k8s/ns/default/pods yields the bare kind "Pod", never a
    // group~version~Kind reference, so the guard has to resolve the model to match.
    renderList(['Pod'], [podActionProvider]);

    expect(await screen.findByText('extension actions for core~v1~Pod')).toBeVisible();
    expect(screen.queryByText('common actions only')).not.toBeInTheDocument();
  });

  it('should resolve extension actions when the kind is already a group~version~Kind reference', async () => {
    renderList(['core~v1~Pod'], [podActionProvider]);

    expect(await screen.findByText('extension actions for core~v1~Pod')).toBeVisible();
  });

  it('should fall back to common actions when no provider is registered for the model', async () => {
    renderList(['Pod'], []);

    expect(await screen.findByText('common actions only')).toBeVisible();
    expect(screen.queryByText(/extension actions/)).not.toBeInTheDocument();
  });

  it('should fall back to common actions when the only provider targets a different model', async () => {
    renderList(['Pod'], [deploymentActionProvider]);

    expect(await screen.findByText('common actions only')).toBeVisible();
  });

  it('should fall back to common actions while the model is still being discovered', async () => {
    renderList(['Pod'], [podActionProvider], { modelResolved: false });

    expect(await screen.findByText('common actions only')).toBeVisible();
  });
});
