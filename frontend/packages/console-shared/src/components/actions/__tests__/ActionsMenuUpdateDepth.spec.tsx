/**
 * Regression test: opening the side pane Actions menu must not trigger a React
 * maximum-update-depth loop under React 19 (a ref/identity churn feedback cycle).
 *
 * Registers the real topology/dev-console/knative/helm action provider hooks
 * as loaded extensions in a real plugin store, renders the real
 * ActionServiceProvider -> ActionsLoader -> ActionsHookResolver chain and the
 * real ActionMenu, then clicks the Actions toggle. No hooks are mocked.
 */
import type { FC } from 'react';
import type { Extension } from '@openshift/dynamic-plugin-sdk';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  createTestPluginStore,
  addLoadedPluginFromManifest,
  createLocalPluginManifest,
} from '@console/app/src/components/console-operator/__tests__/pluginTestUtils';
import { NamespaceContext } from '@console/app/src/providers/detect-context/namespace';
import { useTopologyGraphActionProvider } from '@console/dev-console/src/actions/providers';
import { useHelmActionProviderForTopology } from '@console/helm-plugin/src/actions/providers';
import { DeploymentModel } from '@console/internal/models';
import {
  useModifyApplicationActionProvider,
  useUriActionsProvider,
  useKnativeConnectorActionProvider,
} from '@console/knative-plugin/src/actions/providers';
import { ActionServiceProvider } from '@console/shared/src/components/actions/ActionServiceProvider';
import { ActionMenu } from '@console/shared/src/components/actions/menu/ActionMenu';
import { ActionMenuVariant } from '@console/shared/src/components/actions/types';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import {
  useTopologyWorkloadActionProvider,
  useTopologyVisualConnectorActionProvider,
} from '@console/topology/src/actions/provider';

// Provider hooks return [actions, loaded, error]; the exact tuple shape varies
// by hook, so accept any call signature matching the extension contract.
type ProviderHook = (scope: any) => any;

const deployment = {
  apiVersion: 'apps/v1',
  kind: 'Deployment',
  metadata: { name: 'console', namespace: 'openshift-console', uid: 'x', resourceVersion: '1' },
  spec: { replicas: 2 },
  status: {},
};

const makeFakeElement = () => {
  const element: any = {
    _data: {
      resource: deployment,
      resources: { obj: deployment },
      data: {},
    },
    getType: () => 'workload',
    getId: () => 'fake-id',
    getData: () => element._data,
    getResource: () => deployment,
    getGraph: () => ({ getElementsById: () => [] }),
    getController: () => ({ getElements: () => [] }),
    getKind: () => 'node',
    getSource: () => ({
      getData: () => ({ resources: {} }),
      getResource: () => null,
      getSourceEdges: () => [],
      getTarget: () => element,
    }),
    getLabel: () => 'console',
  };
  return element;
};

const providerExtension = (contextId: string, hook: ProviderHook): Extension =>
  ({
    type: 'console.action/provider',
    properties: { contextId, provider: hook },
  }) as Extension;
const Harness: FC<{ element: any }> = ({ element }) => {
  const context = {
    'topology-actions': element,
    'topology-context-actions': { element, connectorSource: element },
    'apps~v1~Deployment': deployment,
  };
  return (
    <ActionServiceProvider context={context}>
      {({ actions, options, loaded }) =>
        loaded && (
          <ActionMenu actions={actions} options={options} variant={ActionMenuVariant.DROPDOWN} />
        )
      }
    </ActionServiceProvider>
  );
};

describe('topology side pane Actions menu', () => {
  it('does not hit max update depth when opening the Actions menu', async () => {
    const store = createTestPluginStore();
    addLoadedPluginFromManifest(store, createLocalPluginManifest('loop-diagnostic-plugin'), [
      providerExtension('topology-actions', useTopologyWorkloadActionProvider),
      providerExtension('topology-actions', useTopologyVisualConnectorActionProvider),
      providerExtension('topology-actions', useHelmActionProviderForTopology),
      providerExtension('topology-actions', useModifyApplicationActionProvider),
      providerExtension('topology-actions', useUriActionsProvider),
      providerExtension('topology-actions', useKnativeConnectorActionProvider),
      providerExtension('topology-context-actions', useTopologyGraphActionProvider),
    ]);

    const element = makeFakeElement();
    const user = userEvent.setup();
    renderWithProviders(
      <NamespaceContext.Provider
        value={{ namespace: 'openshift-console', setNamespace: jest.fn() }}
      >
        <Harness element={element} />
      </NamespaceContext.Provider>,
      {
        pluginStore: store,
        initialState: {
          k8s: {
            RESOURCES: {
              models: {
                'apps~v1~Deployment': DeploymentModel,
                Deployment: DeploymentModel,
              },
              loaded: true,
              inFlight: false,
            },
          },
        } as any,
      },
    );

    const toggle = await screen.findByRole('button', { name: 'Actions' }, { timeout: 10000 });
    await user.click(toggle);

    await waitFor(
      () => {
        expect(screen.getAllByRole('menuitem').length).toBeGreaterThan(0);
      },
      { timeout: 3000 },
    );
    expect(screen.getByRole('button', { name: 'Actions' })).toBeInTheDocument();
  }, 60000);
});
