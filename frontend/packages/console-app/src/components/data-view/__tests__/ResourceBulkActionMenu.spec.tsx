import type { ComponentProps } from 'react';
import type { LoadedAndResolvedExtension } from '@openshift/dynamic-plugin-sdk';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useResolvedExtensions } from '@console/dynamic-plugin-sdk/src/api/useResolvedExtensions';
import type {
  Action,
  ActionFilter,
  ActionGroup,
  ResourceActionProvider,
} from '@console/dynamic-plugin-sdk/src/extensions/actions';
import type { K8sResourceCommon } from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import type { Extension } from '@console/dynamic-plugin-sdk/src/types';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import { ResourceBulkActionMenu } from '../ResourceBulkActionMenu';

jest.mock('@console/dynamic-plugin-sdk/src/api/useResolvedExtensions', () => ({
  useResolvedExtensions: jest.fn(),
}));

type MenuExtension =
  | LoadedAndResolvedExtension<ActionFilter>
  | LoadedAndResolvedExtension<ActionGroup>
  | LoadedAndResolvedExtension<ResourceActionProvider>;
const matchingSelectedResources: K8sResourceCommon[] = ['alpha', 'bravo'].map((name) => ({
  apiVersion: 'v1',
  kind: 'Pod',
  metadata: { name, namespace: 'default' },
}));

const makeGroup = (id: string, label: string, submenu = false): MenuExtension => ({
  type: 'console.action/group',
  pluginName: 'test-plugin',
  uid: id,
  properties: { id, label, submenu },
});

const makeFilter = (
  id: string,
  filter: (resource: K8sResourceCommon, action: Action) => boolean,
  contextId = 'core~v1~Pod',
): MenuExtension => ({
  type: 'console.action/filter',
  pluginName: 'test-plugin',
  uid: id,
  properties: { contextId, filter },
});

const renderMenu = (
  localActions: Action[],
  extensions: MenuExtension[] = [],
  overrides: Partial<ComponentProps<typeof ResourceBulkActionMenu>> = {},
  unresolvedType?: Extension['type'],
) => {
  const results = new WeakMap<Function, [MenuExtension[], boolean, unknown[]]>();
  (useResolvedExtensions as jest.Mock).mockImplementation(
    (predicate: (extension: MenuExtension) => boolean) => {
      if (!results.has(predicate)) {
        const matches = extensions.filter(predicate);
        results.set(predicate, [matches, !matches.some(({ type }) => type === unresolvedType), []]);
      }
      return results.get(predicate);
    },
  );
  return renderWithProviders(
    <ResourceBulkActionMenu
      reference="core~v1~Pod"
      matchingSelectedResources={matchingSelectedResources}
      getResourceId={(resource) => resource.metadata.name}
      clearSelection={jest.fn()}
      deselect={jest.fn()}
      localActions={localActions}
      selectedCount={matchingSelectedResources.length}
      selectionKey="alpha,bravo"
      {...overrides}
    />,
  );
};

describe('ResourceBulkActionMenu', () => {
  it('renders contributed groups and nested submenus and executes their actions', async () => {
    const user = userEvent.setup();
    const inspect = jest.fn();
    renderMenu(
      [
        { id: 'clear', label: 'Clear selection', path: 'selection', cta: jest.fn() },
        { id: 'inspect', label: 'Inspect pods', path: 'tools/details', cta: inspect },
      ],
      [
        makeGroup('selection', 'Selection'),
        makeGroup('tools', 'Tools', true),
        makeGroup('details', 'Details', true),
      ],
    );

    await user.click(screen.getByRole('button', { name: 'Actions' }));
    expect(screen.getByText('Selection')).toBeVisible();
    expect(screen.getByRole('menuitem', { name: 'Clear selection' })).toBeVisible();
    await user.hover(screen.getByRole('button', { name: 'Tools' }));
    await user.hover(await screen.findByRole('button', { name: 'Details' }));
    await user.click(await screen.findByRole('menuitem', { name: 'Inspect pods' }));

    expect(inspect).toHaveBeenCalledTimes(1);
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Actions' })).toHaveAttribute(
        'aria-expanded',
        'false',
      ),
    );
  });

  it('orders actions within the top and bottom groups', async () => {
    const user = userEvent.setup();
    renderMenu([
      { id: 'bottom', label: 'Bottom', path: '$bottom', cta: jest.fn() },
      { id: 'middle', label: 'Middle', cta: jest.fn() },
      { id: 'top-last', label: 'Top last', path: '$top', cta: jest.fn() },
      {
        id: 'top-first',
        label: 'Top first',
        path: '$top',
        insertBefore: 'top-last',
        cta: jest.fn(),
      },
    ]);

    await user.click(screen.getByRole('button', { name: 'Actions' }));

    expect(screen.getAllByRole('menuitem').map((item) => item.textContent)).toEqual([
      'Top first',
      'Top last',
      'Middle',
      'Bottom',
    ]);
  });

  it('filters local and provider actions against every matching selected resource', async () => {
    const user = userEvent.setup();
    const providerActions: Action[] = [
      { id: 'delete', label: 'Delete pods', path: 'manage', cta: jest.fn() },
      { id: 'inspect', label: 'Inspect pods', path: 'manage', cta: jest.fn() },
    ];
    const provider: MenuExtension = {
      type: 'console.action/resource-provider',
      pluginName: 'test-plugin',
      uid: 'pod-actions',
      properties: {
        model: { version: 'v1', kind: 'Pod' },
        provider: () => [[], true, undefined],
        bulkProvider: () => [providerActions, true, undefined],
      },
    };
    renderMenu(
      [{ id: 'local-delete', label: 'Local delete', cta: jest.fn() }],
      [
        provider,
        makeGroup('manage', 'Manage pods'),
        makeFilter(
          'pod-filter',
          (resource, action) => action.id === 'inspect' || resource.metadata.name === 'alpha',
        ),
        makeFilter('unrelated-filter', () => false, 'topology'),
      ],
    );

    await waitFor(() => expect(screen.getByRole('button', { name: 'Actions' })).toBeEnabled());
    await user.click(screen.getByRole('button', { name: 'Actions' }));

    expect(screen.getByText('Manage pods')).toBeVisible();
    expect(screen.getByRole('menuitem', { name: 'Inspect pods' })).toBeVisible();
    expect(screen.queryByRole('menuitem', { name: 'Delete pods' })).not.toBeInTheDocument();
    expect(screen.queryByRole('menuitem', { name: 'Local delete' })).not.toBeInTheDocument();
  });

  it('preserves the single-resource menu rule that any matching filter may accept an action', async () => {
    const user = userEvent.setup();
    renderMenu(
      [{ id: 'inspect', label: 'Inspect pods', cta: jest.fn() }],
      [
        makeFilter('alpha-filter', (resource) => resource.metadata.name === 'alpha'),
        makeFilter('bravo-filter', (resource) => resource.metadata.name === 'bravo'),
      ],
    );

    await user.click(screen.getByRole('button', { name: 'Actions' }));

    expect(screen.getByRole('menuitem', { name: 'Inspect pods' })).toBeVisible();
  });

  it('disables the menu when all actions are rejected', () => {
    renderMenu(
      [{ id: 'delete', label: 'Delete pods', cta: jest.fn() }],
      [makeFilter('reject-filter', () => false)],
    );

    expect(screen.getByRole('button', { name: 'Actions' })).toBeDisabled();
  });

  it('does not expose actions before model filters finish resolving', () => {
    renderMenu(
      [{ id: 'delete', label: 'Delete pods', cta: jest.fn() }],
      [makeFilter('pending-filter', () => true)],
      {},
      'console.action/filter',
    );

    expect(screen.getByRole('button', { name: 'Actions' })).toBeDisabled();
  });

  it('keeps generic table actions available without a resource-model context', async () => {
    const user = userEvent.setup();
    renderMenu(
      [{ id: 'inspect', label: 'Inspect items', cta: jest.fn() }],
      [makeFilter('reject-filter', () => false)],
      { reference: undefined, matchingSelectedResources: [] },
    );

    await user.click(screen.getByRole('button', { name: 'Actions' }));

    expect(screen.getByRole('menuitem', { name: 'Inspect items' })).toBeVisible();
  });
});
