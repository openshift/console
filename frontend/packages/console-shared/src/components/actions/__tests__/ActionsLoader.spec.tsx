import type { FC } from 'react';
import { useState } from 'react';
import type { LoadedAndResolvedExtension } from '@openshift/dynamic-plugin-sdk';
import { render, screen } from '@testing-library/react';
import { useResolvedExtensions } from '@console/dynamic-plugin-sdk/src/api/useResolvedExtensions';
import type {
  Action,
  ActionFilter,
  ActionProvider,
  ResourceActionProvider,
} from '@console/dynamic-plugin-sdk/src/extensions/actions';
import type { K8sResourceCommon } from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import ActionsLoader from '../loader/ActionsLoader';

jest.mock('@console/dynamic-plugin-sdk/src/api/useResolvedExtensions', () => ({
  useResolvedExtensions: jest.fn(),
}));

type LoaderExtension =
  | LoadedAndResolvedExtension<ActionProvider>
  | LoadedAndResolvedExtension<ResourceActionProvider>
  | LoadedAndResolvedExtension<ActionFilter>;

const DEPLOYMENT_CONTEXT_ID = 'apps~v1~Deployment';

const deployment: K8sResourceCommon = {
  apiVersion: 'apps/v1',
  kind: 'Deployment',
  metadata: { name: 'nginx', namespace: 'default' },
};

const action = (id: string, label: string): Action => ({ id, label, cta: jest.fn() });

/** A `console.action/resource-provider`, the extension Console itself uses for resource menus. */
const makeResourceProvider = (uid: string, actions: Action[], loaded = true): LoaderExtension => ({
  type: 'console.action/resource-provider',
  pluginName: 'test-plugin',
  uid,
  properties: {
    model: { group: 'apps', version: 'v1', kind: 'Deployment' },
    provider: () => [actions, loaded, undefined],
  },
});

/** A `console.action/provider` keyed by a context ID string rather than by a model. */
const makeProvider = (
  uid: string,
  actions: Action[],
  contextId = DEPLOYMENT_CONTEXT_ID,
): LoaderExtension => ({
  type: 'console.action/provider',
  pluginName: 'test-plugin',
  uid,
  properties: { contextId, provider: () => [actions, true, undefined] },
});

const makeFilter = (
  uid: string,
  filter: (scope: K8sResourceCommon, menuAction: Action) => boolean,
  contextId = DEPLOYMENT_CONTEXT_ID,
): LoaderExtension => ({
  type: 'console.action/filter',
  pluginName: 'test-plugin',
  uid,
  properties: { contextId, filter },
});

/**
 * ActionsLoader reports through `onActionsLoaded` instead of rendering anything, so this harness
 * renders what it reports and the tests assert on that.
 */
const ActionsLoaderHarness: FC<{ contextId: string }> = ({ contextId }) => {
  const [actions, setActions] = useState<Action[] | null>(null);
  return (
    <>
      <ActionsLoader
        contextId={contextId}
        scope={deployment}
        onActionsLoaded={setActions}
        onContextChange={jest.fn()}
        onLoadError={jest.fn()}
      />
      {actions === null ? (
        <p>Loading actions</p>
      ) : (
        <ul aria-label="Resource actions">
          {actions.map(({ id, label }) => (
            <li key={id}>{label}</li>
          ))}
        </ul>
      )}
    </>
  );
};

const renderLoader = (extensions: LoaderExtension[], contextId = DEPLOYMENT_CONTEXT_ID) => {
  // Each guard ActionsLoader passes is referentially stable, so cache per guard to keep the
  // resolved arrays stable across renders.
  const resolved = new WeakMap<Function, [LoaderExtension[], boolean, unknown[]]>();
  (useResolvedExtensions as jest.Mock).mockImplementation(
    (guard: (extension: LoaderExtension) => boolean) => {
      if (!resolved.has(guard)) {
        resolved.set(guard, [extensions.filter(guard), true, []]);
      }
      return resolved.get(guard);
    },
  );
  return render(<ActionsLoaderHarness contextId={contextId} />);
};

const reportedActions = () => screen.getAllByRole('listitem').map((item) => item.textContent);

describe('ActionsLoader', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should contribute actions from a resource provider whose model matches the context ID', async () => {
    renderLoader([makeResourceProvider('console', [action('edit-pod-count', 'Edit Pod count')])]);

    expect(await screen.findByRole('listitem')).toHaveTextContent('Edit Pod count');
  });

  it('should merge actions from a context ID provider into the same menu as the resource provider', async () => {
    renderLoader([
      makeResourceProvider('console', [action('edit-pod-count', 'Edit Pod count')]),
      makeProvider('plugin', [action('plugin-action', 'Plugin action')]),
    ]);

    expect(await screen.findByRole('list', { name: 'Resource actions' })).toBeVisible();
    expect(reportedActions()).toEqual(expect.arrayContaining(['Edit Pod count', 'Plugin action']));
  });

  it('should remove an action contributed by another provider when a filter rejects it', async () => {
    renderLoader([
      makeResourceProvider('console', [
        action('edit-pod-count', 'Edit Pod count'),
        action('delete-resource', 'Delete Deployment'),
      ]),
      makeFilter('plugin', (_scope, menuAction) => menuAction.id !== 'edit-pod-count'),
    ]);

    expect(await screen.findByRole('list', { name: 'Resource actions' })).toBeVisible();
    expect(reportedActions()).toEqual(['Delete Deployment']);
  });

  it('should keep an action when only one of two filters accepts it', async () => {
    renderLoader([
      makeResourceProvider('console', [action('edit-pod-count', 'Edit Pod count')]),
      makeFilter('rejects-everything', () => false),
      makeFilter('accepts-everything', () => true),
    ]);

    expect(await screen.findByRole('list', { name: 'Resource actions' })).toBeVisible();
    expect(reportedActions()).toEqual(['Edit Pod count']);
  });

  it('should ignore providers registered for a different context ID', async () => {
    renderLoader([
      makeResourceProvider('console', [action('edit-pod-count', 'Edit Pod count')]),
      makeProvider('topology', [action('topology-action', 'Topology action')], 'topology-actions'),
    ]);

    expect(await screen.findByRole('list', { name: 'Resource actions' })).toBeVisible();
    expect(reportedActions()).toEqual(['Edit Pod count']);
  });

  it('should not report any actions until every matching provider has resolved', () => {
    renderLoader([
      makeResourceProvider('console', [action('edit-pod-count', 'Edit Pod count')]),
      makeResourceProvider('slow-plugin', [], false),
    ]);

    expect(screen.getByText('Loading actions')).toBeVisible();
    expect(screen.queryByRole('list', { name: 'Resource actions' })).not.toBeInTheDocument();
  });
});
