import type { LoadedAndResolvedExtension } from '@openshift/dynamic-plugin-sdk';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createUserSettingsStore } from '@console/app/src/providers/user-preferences/UserPreferenceContext';
import { useResolvedExtensions } from '@console/dynamic-plugin-sdk/src/api/useResolvedExtensions';
import { OverlayProvider } from '@console/dynamic-plugin-sdk/src/app/modal-support/OverlayProvider';
import type {
  ConsoleDataViewColumn,
  GetDataViewRows,
  K8sGroupVersionKind,
} from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import type { ConsoleDataViewTableColumn } from '@console/dynamic-plugin-sdk/src/extensions/dataview';
import {
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

type Item = { metadata: { name: string }; status: string };
type ResolvedTableColumn = LoadedAndResolvedExtension<ConsoleDataViewTableColumn<Item>>;

const data: Item[] = [
  { metadata: { name: 'alpha' }, status: 'ready' },
  { metadata: { name: 'bravo' }, status: 'pending' },
];
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

const makeExtension = (
  id: string,
  title: string,
  options: {
    pluginName?: string;
    tableID?: string;
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
    tableID: options.tableID ?? 'test-table',
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
    columnLayoutID?: string;
    withoutID?: boolean;
    isResizable?: boolean;
    useDefaultResizable?: boolean;
    columnWidths?: Record<string, number>;
    getDataViewRows?: GetDataViewRows<Item>;
  } = {},
) => {
  (useResolvedExtensions as jest.Mock).mockReturnValue([extensions, true, []]);
  const userSettingsStore = createUserSettingsStore();
  userSettingsStore.setSnapshot({
    data: {
      ...(preference && {
        [COLUMN_MANAGEMENT_USER_PREFERENCE_KEY]: JSON.stringify({ 'test-table': preference }),
      }),
      ...(options.columnWidths && {
        [COLUMN_WIDTH_USER_PREFERENCE_KEY]: JSON.stringify({ 'test-table': options.columnWidths }),
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
        data={data}
        loaded
        columns={columns}
        id={options.withoutID ? undefined : (options.id ?? 'test-table')}
        columnLayout={{
          id: options.columnLayoutID ?? 'test-table',
          type: 'Item',
          columns: columns.filter(({ title }) => title).map(({ id, title }) => ({ id, title })),
          selectedColumns: new Set(preference ?? []),
        }}
        getDataViewRows={options.getDataViewRows ?? getDataViewRows}
        hideNameLabelFilters
        {...(options.useDefaultResizable ? {} : { isResizable: options.isResizable ?? false })}
      />
    </OverlayProvider>,
    { userSettingsStore },
  );
  return { ...view, userSettingsStore };
};

describe('ConsoleDataView table column extensions', () => {
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
      makeExtension('other', 'Other', { tableID: 'different', additional: false }),
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
          'test-table'
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

  it('uses the resolved GVK for extension matching and column preferences', async () => {
    const user = userEvent.setup();
    const { userSettingsStore } = renderTable(
      [makeExtension('test-ready', 'Ready', { tableID: 'core~v1~Pod' })],
      undefined,
      { id: { version: 'v1', kind: 'Pod' }, columnLayoutID: 'old-table-id' },
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

  it('renders without table actions when no ID is supplied', () => {
    renderTable([], undefined, { withoutID: true, isResizable: true });

    expect(screen.getByRole('grid', { name: 'items table' })).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Column management' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Reset column widths' })).not.toBeInTheDocument();
  });
});
