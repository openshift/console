import { useMemo } from 'react';
import type { LoadedAndResolvedExtension } from '@openshift/dynamic-plugin-sdk';
import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createUserSettingsStore } from '@console/app/src/providers/user-preferences/UserPreferenceContext';
import type { ExtensionK8sKindVersionModel } from '@console/dynamic-plugin-sdk/src/api/common-types';
import { useResolvedExtensions } from '@console/dynamic-plugin-sdk/src/api/useResolvedExtensions';
import { OverlayProvider } from '@console/dynamic-plugin-sdk/src/app/modal-support/OverlayProvider';
import type {
  Action,
  BulkResourceActionHook,
  ResourceActionProvider,
} from '@console/dynamic-plugin-sdk/src/extensions/actions';
import type {
  ConsoleDataViewColumn,
  ConsoleDataViewProps,
  GetDataViewRows,
  K8sGroupVersionKind,
} from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import type { ConsoleDataViewTableColumn } from '@console/dynamic-plugin-sdk/src/extensions/dataview';
import {
  COLUMN_MANAGEMENT_ORDER_USER_PREFERENCE_KEY,
  COLUMN_MANAGEMENT_USER_PREFERENCE_KEY,
  COLUMN_WIDTH_USER_PREFERENCE_KEY,
} from '@console/shared/src/constants/common';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import { ConsoleDataView } from '../ConsoleDataView';
import { getConsoleDataViewID } from '../getConsoleDataViewID';
import { orderConsoleDataViewColumns } from '../useConsoleDataViewColumns';

jest.mock('@console/dynamic-plugin-sdk/src/api/useResolvedExtensions', () => ({
  useResolvedExtensions: jest.fn(),
}));

type Item = { metadata: { name: string }; status: string; kind?: string; apiVersion?: string };
type ResolvedTableColumn = LoadedAndResolvedExtension<ConsoleDataViewTableColumn<Item>>;
type ResolvedResourceActionProvider = LoadedAndResolvedExtension<ResourceActionProvider>;

const data: Item[] = [
  { metadata: { name: 'alpha' }, status: 'ready' },
  { metadata: { name: 'bravo' }, status: 'pending' },
];
const defaultTable: ExtensionK8sKindVersionModel = { version: 'v1', kind: 'Pod' };
const defaultTableID = 'core~v1~Pod';
const columns: ConsoleDataViewColumn<Item>[] = [
  { id: 'name', type: 'name', title: 'Name', sort: 'metadata.name' },
  { id: 'status', title: 'Status' },
  { id: 'actions', type: 'actions' },
];
const getDataViewRows: GetDataViewRows<Item> = (rows, activeColumns) =>
  rows.map(({ obj }) =>
    activeColumns.map(({ id }) => ({
      id,
      cell: id === 'name' ? obj.metadata.name : id === 'status' ? obj.status : null,
    })),
  );

const podRowActions: Action[] = [{ id: 'inspect-pod', label: 'Inspect pod', cta: jest.fn() }];
const makePodActionProvider = (
  bulkProvider?: BulkResourceActionHook,
): ResolvedResourceActionProvider => ({
  type: 'console.action/resource-provider',
  pluginName: 'test-plugin',
  uid: 'test-pod-actions',
  properties: {
    model: { version: 'v1', kind: 'Pod' },
    provider: () => [podRowActions, true, undefined],
    bulkProvider,
  },
});

const useBulkPodActions: BulkResourceActionHook = ({ resources, clearSelection }) => {
  const actions = useMemo<Action[]>(
    () => [
      {
        id: 'inspect-selected-pods',
        label: `Inspect ${resources.length} pods`,
        cta: clearSelection,
      },
    ],
    [resources.length, clearSelection],
  );
  return [actions, true, undefined];
};

const makeExtension = (
  id: string,
  title: string,
  options: {
    pluginName?: string;
    table?: ExtensionK8sKindVersionModel | string;
    additional?: boolean;
    insertBefore?: string;
    insertAfter?: string;
    resizable?: boolean;
    tooltip?: string;
    getCellContent?: (rows: { obj: Item }[]) => { cell: string }[];
  } = {},
): ResolvedTableColumn => ({
  type: 'console.dataview/table-column',
  pluginName: options.pluginName ?? 'test-plugin',
  uid: `${options.pluginName ?? 'test-plugin'}-${id}`,
  properties: {
    table: options.table ?? defaultTable,
    columnData: {
      id,
      title,
      tooltip: options.tooltip,
      additional: options.additional,
      resizableProps: options.resizable ? { isResizable: true } : undefined,
    },
    getCellContent:
      options.getCellContent ??
      ((rows) => rows.map(({ obj }) => ({ cell: `${title} ${obj.metadata.name}` }))),
    insertBefore: options.insertBefore,
    insertAfter: options.insertAfter,
  },
});

const renderTable = (
  extensions: ResolvedTableColumn[],
  preference?: string[],
  options: {
    id?: K8sGroupVersionKind | string;
    isResizable?: boolean;
    useDefaultResizable?: boolean;
    columnWidths?: Record<string, number>;
    columnOrder?: string[];
    columns?: ConsoleDataViewColumn<Item>[];
    getDataViewRows?: GetDataViewRows<Item>;
    data?: Item[];
    selection?: ConsoleDataViewProps<Item>['selection'];
    actionProviders?: ResolvedResourceActionProvider[];
  } = {},
) => {
  const resolvedResults = new WeakMap<Function, [unknown[], boolean, unknown[]]>();
  (useResolvedExtensions as jest.Mock).mockImplementation(
    (predicate: (extension: unknown) => boolean) => {
      if (!resolvedResults.has(predicate)) {
        resolvedResults.set(predicate, [
          [...extensions, ...(options.actionProviders ?? [])].filter(predicate),
          true,
          [],
        ]);
      }
      return resolvedResults.get(predicate);
    },
  );
  const userSettingsStore = createUserSettingsStore();
  userSettingsStore.setSnapshot({
    data: {
      ...(preference && {
        [COLUMN_MANAGEMENT_USER_PREFERENCE_KEY]: JSON.stringify({ [defaultTableID]: preference }),
      }),
      ...(options.columnOrder && {
        [COLUMN_MANAGEMENT_ORDER_USER_PREFERENCE_KEY]: JSON.stringify({
          [defaultTableID]: options.columnOrder,
        }),
      }),
      ...(options.columnWidths && {
        [COLUMN_WIDTH_USER_PREFERENCE_KEY]: JSON.stringify({
          [defaultTableID]: options.columnWidths,
        }),
      }),
    },
    loaded: true,
    isLocalStorage: true,
  });
  userSettingsStore.setUpdateKey(async (key, value) => {
    const snapshot = userSettingsStore.getSnapshot();
    userSettingsStore.setSnapshot({ ...snapshot, data: { ...snapshot.data, [key]: value } });
  });

  const view = renderWithProviders(
    <OverlayProvider>
      <ConsoleDataView<Item>
        label="items"
        data={options.data ?? data}
        loaded
        columns={options.columns ?? columns}
        id={options.id ?? defaultTable}
        getDataViewRows={options.getDataViewRows ?? getDataViewRows}
        selection={options.selection}
        hideNameLabelFilters
        {...(options.useDefaultResizable ? {} : { isResizable: options.isResizable ?? false })}
      />
    </OverlayProvider>,
    { userSettingsStore },
  );
  return { ...view, userSettingsStore };
};

describe('ConsoleDataView', () => {
  const originalIntersectionObserver = window.IntersectionObserver;

  beforeAll(() => {
    Object.defineProperty(window, 'IntersectionObserver', {
      configurable: true,
      value: jest.fn().mockImplementation(() => ({
        observe: jest.fn(),
        unobserve: jest.fn(),
      })),
    });
  });

  afterAll(() => {
    Object.defineProperty(window, 'IntersectionObserver', {
      configurable: true,
      value: originalIntersectionObserver,
    });
  });

  afterEach(() => jest.clearAllMocks());

  it('renders a default-visible extension between built-in columns and aligns its cells', () => {
    renderTable([makeExtension('test-ready', 'Ready', { additional: false, insertAfter: 'name' })]);

    const table = screen.getByRole('grid', { name: 'items table' });
    expect(
      within(table)
        .getAllByRole('columnheader')
        .map((header) => header.textContent),
    ).toEqual(['Name', 'Ready', 'Status', 'Actions']);
    expect(within(table).getAllByRole('row')[1]).toHaveTextContent('alphaReady alphaready');
    expect(within(table).getAllByRole('row')[2]).toHaveTextContent('bravoReady bravopending');
  });

  it('adds name cell test IDs and lets row props override them', () => {
    renderTable([], undefined, {
      getDataViewRows: (rows, activeColumns) =>
        rows.map(({ obj }) =>
          activeColumns.map(({ id }) =>
            id === 'name' && obj.metadata.name === 'alpha'
              ? obj.metadata.name
              : {
                  id,
                  cell: id === 'name' ? obj.metadata.name : null,
                  props: id === 'name' ? { 'data-test': 'custom-name' } : {},
                },
          ),
        ),
    });

    expect(screen.getByRole('cell', { name: 'alpha' })).toHaveAttribute(
      'data-test',
      'data-view-cell-alpha-name',
    );
    expect(screen.getByRole('cell', { name: 'bravo' })).toHaveAttribute('data-test', 'custom-name');
  });

  it('shows a help tooltip for an extension column header', async () => {
    const user = userEvent.setup();
    renderTable([
      makeExtension('test-ready', 'Ready', {
        additional: false,
        tooltip: 'Whether this item is ready',
      }),
    ]);

    const header = screen.getByRole('columnheader', { name: /Ready/ });
    await user.hover(within(header).getByRole('button', { name: 'More information about Ready' }));

    expect(await screen.findByRole('tooltip')).toHaveTextContent('Whether this item is ready');
  });

  it('keeps additional columns hidden until selected in column management', async () => {
    const user = userEvent.setup();
    renderTable([makeExtension('test-ready', 'Ready')]);

    expect(screen.queryByRole('columnheader', { name: 'Ready' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Column management' }));
    await user.click(await screen.findByRole('checkbox', { name: 'Ready' }));
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(await screen.findByRole('columnheader', { name: 'Ready' })).toBeVisible();
    expect(screen.getByRole('cell', { name: 'Ready alpha' })).toBeVisible();
  });

  it.each([
    ['without extensions', [], ['Name', 'Status']],
    [
      'with an extension',
      [makeExtension('test-ready', 'Ready', { additional: false })],
      ['Name', 'Status', 'Ready'],
    ],
  ])('keeps Actions out of column management %s', async (_scenario, extensions, names) => {
    const user = userEvent.setup();
    renderTable(extensions);

    expect(screen.getByRole('columnheader', { name: 'Actions' })).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Column management' }));

    const dialog = await screen.findByRole('dialog');
    names.forEach((name) => expect(within(dialog).getByRole('checkbox', { name })).toBeVisible());
    expect(within(dialog).queryByRole('checkbox', { name: 'Actions' })).not.toBeInTheDocument();
  });

  it('orders columns sharing an anchor by plugin name and column ID', () => {
    renderTable([
      makeExtension('z-last', 'Last', {
        pluginName: 'z-plugin',
        additional: false,
        insertAfter: 'name',
      }),
      makeExtension('a-first', 'First', {
        pluginName: 'a-plugin',
        additional: false,
        insertAfter: 'name',
      }),
    ]);

    expect(screen.getAllByRole('columnheader').map((header) => header.textContent)).toEqual([
      'Name',
      'First',
      'Last',
      'Status',
      'Actions',
    ]);
  });

  it('shows an additional column selected in saved preferences', () => {
    renderTable([makeExtension('test-ready', 'Ready')], ['name', 'status', 'test-ready']);

    expect(screen.getByRole('columnheader', { name: 'Ready' })).toBeVisible();
    expect(screen.getByRole('cell', { name: 'Ready bravo' })).toBeVisible();
  });

  it('translates a plugin column title', () => {
    renderTable([makeExtension('test-ready', '%console-app~Ready%', { additional: false })]);

    expect(screen.getByRole('columnheader', { name: 'Ready' })).toBeVisible();
  });

  it('ignores columns for other tables and duplicate built-in IDs', () => {
    renderTable([
      makeExtension('other', 'Other', {
        table: { group: 'different', version: 'v1', kind: 'Pod' },
        additional: false,
      }),
      makeExtension('name', 'Duplicate', { additional: false }),
    ]);

    expect(screen.getAllByRole('columnheader').map((header) => header.textContent)).toEqual([
      'Name',
      'Status',
      'Actions',
    ]);
  });

  it('puts unanchored columns after the selection column and before actions', () => {
    const { columns: ordered } = orderConsoleDataViewColumns(
      [
        { id: 'select', title: '' },
        { id: 'name', title: 'Name' },
        { id: '', title: '' },
      ],
      [makeExtension('test-ready', 'Ready')],
    );

    expect(ordered.map(({ id }) => id)).toEqual(['select', 'name', 'test-ready', '']);
  });

  it('automatically resizes extension columns and uses the table ID to restore and reset widths', async () => {
    const user = userEvent.setup();
    const { userSettingsStore } = renderTable(
      [makeExtension('test-ready', 'Ready', { additional: false })],
      undefined,
      { useDefaultResizable: true, columnWidths: { 'test-ready': 240 } },
    );

    const resizeButton = screen.getByRole('button', { name: 'Resize test-ready column' });
    expect(resizeButton).toBeVisible();
    expect(screen.getByRole('button', { name: 'Resize name column' })).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Resize actions column' })).not.toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /Ready/ })).toHaveStyle('min-width: 240px');
    resizeButton.focus();
    await user.keyboard('{ArrowRight}');
    await waitFor(() =>
      expect(
        JSON.parse(userSettingsStore.getSnapshot().data[COLUMN_WIDTH_USER_PREFERENCE_KEY])[
          defaultTableID
        ]['test-ready'],
      ).not.toBe(240),
    );
    await user.click(screen.getByRole('button', { name: 'Reset column widths' }));

    await waitFor(() =>
      expect(
        JSON.parse(userSettingsStore.getSnapshot().data[COLUMN_WIDTH_USER_PREFERENCE_KEY]),
      ).toEqual({}),
    );
  });

  it('should preserve widths by column ID when columns are reordered, hidden, and shown again', async () => {
    const user = userEvent.setup();
    const { userSettingsStore } = renderTable(
      [makeExtension('test-ready', 'Ready', { additional: false })],
      undefined,
      { useDefaultResizable: true, columnWidths: { status: 240, 'test-ready': 160 } },
    );
    const expectSavedWidths = () => {
      expect(screen.getByRole('columnheader', { name: /Status/ })).toHaveTextContent(
        'Column 240 pixels',
      );
      expect(screen.getByRole('columnheader', { name: /Ready/ })).toHaveTextContent(
        'Column 160 pixels',
      );
    };
    expectSavedWidths();

    // Update the saved order without depending on browser drag geometry in jsdom.
    act(() => {
      const snapshot = userSettingsStore.getSnapshot();
      userSettingsStore.setSnapshot({
        ...snapshot,
        data: {
          ...snapshot.data,
          [COLUMN_MANAGEMENT_ORDER_USER_PREFERENCE_KEY]: JSON.stringify({
            [defaultTableID]: ['name', 'test-ready', 'status'],
          }),
        },
      });
    });
    expect(screen.getAllByRole('columnheader')[1]).toHaveAccessibleName(/^Ready/);
    expect(screen.getAllByRole('columnheader')[2]).toHaveAccessibleName(/^Status/);
    expectSavedWidths();

    await user.click(screen.getByRole('button', { name: 'Column management' }));
    await user.click(await screen.findByRole('checkbox', { name: 'Ready' }));
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(screen.queryByRole('columnheader', { name: /Ready/ })).not.toBeInTheDocument();
    expect(screen.getAllByRole('columnheader')[1]).toHaveAccessibleName(/^Status/);
    expect(screen.getByRole('columnheader', { name: /Status/ })).toHaveTextContent(
      'Column 240 pixels',
    );

    await user.click(screen.getByRole('button', { name: 'Column management' }));
    await user.click(await screen.findByRole('checkbox', { name: 'Ready' }));
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(screen.getAllByRole('columnheader')[1]).toHaveAccessibleName(/^Ready/);
    expect(screen.getAllByRole('columnheader')[2]).toHaveAccessibleName(/^Status/);
    expectSavedWidths();

    await user.click(screen.getByRole('button', { name: 'Reset column widths' }));

    expect(screen.getAllByRole('columnheader')[1]).toHaveAccessibleName(/^Ready/);
    expect(screen.getAllByRole('columnheader')[2]).toHaveAccessibleName(/^Status/);
    expect(screen.getByRole('columnheader', { name: /Status/ })).toHaveTextContent(
      'Column 0 pixels',
    );
    expect(screen.getByRole('columnheader', { name: /Ready/ })).toHaveTextContent(
      'Column 0 pixels',
    );
  });

  it('preserves saved widths by column ID when restoring the default column order', async () => {
    const user = userEvent.setup();
    const { userSettingsStore } = renderTable(
      [makeExtension('test-ready', 'Ready', { additional: false })],
      ['name', 'status', 'test-ready'],
      {
        columnOrder: ['name', 'test-ready', 'status'],
        useDefaultResizable: true,
        columnWidths: { status: 240 },
      },
    );

    await user.click(screen.getByRole('button', { name: 'Column management' }));
    await user.click(screen.getByRole('button', { name: 'Restore default columns' }));
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(
      JSON.parse(userSettingsStore.getSnapshot().data[COLUMN_WIDTH_USER_PREFERENCE_KEY]),
    ).toEqual({ [defaultTableID]: { status: 240 } });
    expect(screen.getByRole('columnheader', { name: /Status/ })).toHaveTextContent(
      'Column 240 pixels',
    );
    expect(screen.getByRole('columnheader', { name: /Ready/ })).toHaveTextContent(
      'Column 0 pixels',
    );
    expect(
      JSON.parse(userSettingsStore.getSnapshot().data[COLUMN_MANAGEMENT_ORDER_USER_PREFERENCE_KEY])[
        defaultTableID
      ],
    ).toEqual(['name', 'status', 'test-ready']);
  });

  it('uses the resolved GVK for extension matching and column preferences', async () => {
    const user = userEvent.setup();
    const { userSettingsStore } = renderTable(
      [makeExtension('test-ready', 'Ready', { table: defaultTable })],
      undefined,
      { id: { version: 'v1', kind: 'Pod' } },
    );

    await user.click(screen.getByRole('button', { name: 'Column management' }));
    await user.click(await screen.findByRole('checkbox', { name: 'Ready' }));
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(screen.getByRole('columnheader', { name: 'Ready' })).toBeVisible();
    expect(
      JSON.parse(userSettingsStore.getSnapshot().data[COLUMN_MANAGEMENT_USER_PREFERENCE_KEY])[
        'core~v1~Pod'
      ],
    ).toContain('test-ready');
    expect(
      JSON.parse(userSettingsStore.getSnapshot().data[COLUMN_MANAGEMENT_ORDER_USER_PREFERENCE_KEY])[
        'core~v1~Pod'
      ],
    ).toEqual(['name', 'status', 'test-ready']);
  });

  it('renders saved column order without moving sticky columns from their slots', () => {
    const stickyColumns: ConsoleDataViewColumn<Item>[] = [
      { id: 'name', type: 'name', title: 'Name', sort: 'metadata.name' },
      { id: 'zone', title: 'Zone', props: { isStickyColumn: true } },
      { id: 'status', title: 'Status' },
      { id: 'owner', title: 'Owner' },
    ];

    renderTable([], ['name', 'zone', 'status', 'owner'], {
      columns: stickyColumns,
      columnOrder: ['owner', 'name', 'status', 'zone'],
    });

    expect(
      within(screen.getByRole('grid', { name: 'items table' }))
        .getAllByRole('columnheader')
        .map((header) => header.textContent),
    ).toEqual(['Name', 'Zone', 'Owner', 'Status']);
  });

  it('resolves model, GVK, and string table IDs', () => {
    expect(
      getConsoleDataViewID({
        apiVersion: 'v1',
        kind: 'Pod',
        abbr: 'P',
        label: 'Pod',
        labelPlural: 'Pods',
        plural: 'pods',
      }),
    ).toBe('core~v1~Pod');
    expect(getConsoleDataViewID({ version: 'v1', kind: 'Pod' })).toBe('core~v1~Pod');
    expect(getConsoleDataViewID({ group: 'apps', version: 'v1', kind: 'Deployment' })).toBe(
      'apps~v1~Deployment',
    );
    expect(getConsoleDataViewID('demo-plugin~v1~Pod')).toBe('demo-plugin~v1~Pod');
  });

  it('uses resource provider actions for an omitted action cell and keeps an explicit empty cell', async () => {
    const user = userEvent.setup();
    const pods: Item[] = [
      { kind: 'Pod', apiVersion: 'v1', metadata: { name: 'alpha' }, status: 'ready' },
      { kind: 'Pod', apiVersion: 'v1', metadata: { name: 'bravo' }, status: 'ready' },
    ];
    renderTable([], undefined, {
      data: pods,
      actionProviders: [makePodActionProvider()],
      getDataViewRows: (rows, activeColumns) =>
        rows.map(({ obj }) =>
          activeColumns.map(({ id }) =>
            id === 'actions'
              ? obj.metadata.name === 'alpha'
                ? { id }
                : { id, cell: null }
              : { id, cell: obj.metadata.name },
          ),
        ),
    });

    const rows = within(screen.getByRole('grid', { name: 'items table' })).getAllByRole('row');
    await user.click(within(rows[1]).getByRole('button', { name: 'Actions' }));
    expect(await screen.findByRole('menuitem', { name: 'Inspect pod' })).toBeVisible();
    expect(within(rows[2]).queryByRole('button', { name: 'Actions' })).not.toBeInTheDocument();
  });

  it('combines explicit and opted-in resource bulk actions for the selected pods', async () => {
    const user = userEvent.setup();
    renderTable([], undefined, {
      data: [
        { kind: 'Pod', apiVersion: 'v1', metadata: { name: 'alpha' }, status: 'ready' },
        { kind: 'Pod', apiVersion: 'v1', metadata: { name: 'bravo' }, status: 'ready' },
      ],
      actionProviders: [makePodActionProvider(useBulkPodActions)],
      selection: {
        getItemId: (item) => item.metadata.name,
        getActions: ({ selectedItems }) => [
          {
            id: 'local-action',
            label: 'Local action',
            disabled: selectedItems.length === 0,
            cta: jest.fn(),
          },
        ],
      },
    });

    const rows = within(screen.getByRole('grid', { name: 'items table' })).getAllByRole('row');
    await user.click(within(rows[1]).getByRole('checkbox'));
    await user.click(within(rows[2]).getByRole('checkbox'));
    await user.click(screen.getByTestId('data-view-bulk-actions-menu-button'));
    expect(screen.getByRole('menuitem', { name: 'Local action' })).toBeVisible();
    await user.click(await screen.findByRole('menuitem', { name: 'Inspect 2 pods' }));
    expect(within(rows[1]).getByRole('checkbox')).not.toBeChecked();
    expect(within(rows[2]).getByRole('checkbox')).not.toBeChecked();
  });

  it('shows opted-in resource bulk actions without table-specific actions', async () => {
    const user = userEvent.setup();
    renderTable([], undefined, {
      data: [{ kind: 'Pod', apiVersion: 'v1', metadata: { name: 'alpha' }, status: 'ready' }],
      actionProviders: [makePodActionProvider(useBulkPodActions)],
      selection: { getItemId: (item) => item.metadata.name },
    });

    expect(screen.getByTestId('data-view-bulk-actions-menu-button')).toBeDisabled();
    const row = within(screen.getByRole('grid', { name: 'items table' })).getAllByRole('row')[1];
    await user.click(within(row).getByRole('checkbox'));
    await user.click(screen.getByTestId('data-view-bulk-actions-menu-button'));
    expect(await screen.findByRole('menuitem', { name: 'Inspect 1 pods' })).toBeVisible();
    await user.keyboard('{Escape}');
    await user.click(within(row).getByRole('checkbox'));
    expect(screen.getByTestId('data-view-bulk-actions-menu-button')).toBeDisabled();
  });

  it('does not offer resource bulk actions for a mixed-model selection', async () => {
    const user = userEvent.setup();
    renderTable([], undefined, {
      data: [
        { kind: 'Pod', apiVersion: 'v1', metadata: { name: 'alpha' }, status: 'ready' },
        { kind: 'Service', apiVersion: 'v1', metadata: { name: 'bravo' }, status: 'ready' },
      ],
      actionProviders: [makePodActionProvider(useBulkPodActions)],
      selection: {
        getItemId: (item) => item.metadata.name,
        getActions: () => [{ id: 'local-action', label: 'Local action', cta: jest.fn() }],
      },
    });

    const table = screen.getByRole('grid', { name: 'items table' });
    await user.click(within(within(table).getAllByRole('row')[0]).getByRole('checkbox'));
    await user.click(screen.getByTestId('data-view-bulk-actions-menu-button'));
    expect(screen.getByRole('menuitem', { name: 'Local action' })).toBeVisible();
    expect(screen.queryByRole('menuitem', { name: /Inspect .* pods/ })).not.toBeInTheDocument();
  });

  it('adds selection cells and lets a bulk action deselect successful items', async () => {
    const user = userEvent.setup();
    renderTable(
      [makeExtension('test-ready', 'Ready', { additional: false, insertAfter: 'name' })],
      undefined,
      {
        selection: {
          getItemId: (item) => item.metadata.name,
          getActions: ({ selectedItems, deselect }) => [
            {
              id: 'remove-alpha',
              label: `Remove alpha (${selectedItems.length})`,
              description: 'Removes alpha from the selection',
              disabled: selectedItems.length === 0,
              cta: () => deselect(['alpha']),
            },
          ],
        },
      },
    );

    const table = screen.getByRole('grid', { name: 'items table' });
    const rows = within(table).getAllByRole('row');
    expect(within(rows[0]).getByRole('checkbox')).toBeVisible();
    expect(rows[1]).toHaveTextContent('alphaReady alpha');
    const actions = screen.getByTestId('data-view-bulk-actions-menu-button');
    expect(actions).toBeDisabled();
    await user.click(within(rows[1]).getByRole('checkbox'));
    await user.click(within(rows[2]).getByRole('checkbox'));

    await user.click(actions);
    expect(screen.getByText('Removes alpha from the selection')).toBeVisible();
    await user.click(screen.getByRole('menuitem', { name: /Remove alpha \(2\)/ }));
    expect(within(rows[1]).getByRole('checkbox')).not.toBeChecked();
    expect(within(rows[2]).getByRole('checkbox')).toBeChecked();
    await user.click(actions);
    expect(screen.getByRole('menuitem', { name: /Remove alpha \(1\)/ })).toBeVisible();
  });

  it('selects the current page and then all selectable matching items', async () => {
    const user = userEvent.setup();
    const manyItems = Array.from({ length: 51 }, (_, index) => ({
      metadata: { name: `item-${index.toString().padStart(2, '0')}` },
      status: 'ready',
    }));
    renderTable([], undefined, {
      data: manyItems,
      selection: {
        getItemId: (item) => item.metadata.name,
        isSelectable: (item) => item.metadata.name !== 'item-00',
        getActions: ({ selectedItems, clearSelection }) => [
          {
            id: 'clear-selection',
            label: `Clear selection (${selectedItems.length})`,
            disabled: selectedItems.length === 0,
            cta: clearSelection,
          },
        ],
      },
    });

    const table = screen.getByRole('grid', { name: 'items table' });
    const rows = within(table).getAllByRole('row');
    expect(within(rows[1]).getByRole('checkbox')).toBeDisabled();
    await user.click(within(rows[0]).getByRole('checkbox'));
    const actions = screen.getByTestId('data-view-bulk-actions-menu-button');
    await user.click(actions);
    expect(screen.getByRole('menuitem', { name: 'Clear selection (49)' })).toBeVisible();
    await user.keyboard('{Escape}');

    await user.click(screen.getByRole('button', { name: /Select all 50 items/ }));
    await user.click(actions);
    await user.click(screen.getByRole('menuitem', { name: 'Clear selection (50)' }));
    expect(actions).toBeDisabled();
  });
});
