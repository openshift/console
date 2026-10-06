import { renderHook } from '@testing-library/react';
import type { ConsoleDataViewColumn } from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import {
  ALL_NAMESPACES_KEY,
  COLUMN_MANAGEMENT_ORDER_USER_PREFERENCE_KEY,
  COLUMN_MANAGEMENT_USER_PREFERENCE_KEY,
} from '@console/shared/src/constants/common';
import { useActiveNamespace } from '@console/shared/src/hooks/useActiveNamespace';
import { useUserPreference } from '@console/shared/src/hooks/useUserPreference';
import { useActiveColumns } from '../active-columns-hook';

jest.mock('@console/shared/src/hooks/useActiveNamespace', () => ({
  useActiveNamespace: jest.fn(),
}));

jest.mock('@console/shared/src/hooks/useUserPreference', () => ({
  useUserPreference: jest.fn(),
}));

type Item = { name: string };
type TestColumn = ConsoleDataViewColumn<Item>;

const tableID = 'test-table';
const columns: TestColumn[] = [
  { id: 'name', title: 'Name' },
  { id: 'status', title: 'Status' },
  { id: 'owner', title: 'Owner' },
];

let preferenceData: Record<string, unknown>;
let preferenceLoaded: Record<string, boolean>;

const setupHook = (
  options: {
    selectedColumns?: string[];
    columnOrder?: string[];
    namespace?: string;
    showNamespaceOverride?: boolean;
    columns?: TestColumn[];
    columnPreferencesLoaded?: boolean;
    orderPreferencesLoaded?: boolean;
  } = {},
) => {
  preferenceData = {
    [COLUMN_MANAGEMENT_USER_PREFERENCE_KEY]: options.selectedColumns
      ? { [tableID]: options.selectedColumns }
      : undefined,
    [COLUMN_MANAGEMENT_ORDER_USER_PREFERENCE_KEY]: options.columnOrder
      ? { [tableID]: options.columnOrder }
      : undefined,
  };
  preferenceLoaded = {
    [COLUMN_MANAGEMENT_USER_PREFERENCE_KEY]: options.columnPreferencesLoaded ?? true,
    [COLUMN_MANAGEMENT_ORDER_USER_PREFERENCE_KEY]: options.orderPreferencesLoaded ?? true,
  };

  (useUserPreference as jest.Mock).mockImplementation((key: string) => [
    preferenceData[key],
    jest.fn(),
    preferenceLoaded[key],
  ]);
  (useActiveNamespace as jest.Mock).mockReturnValue([options.namespace ?? ALL_NAMESPACES_KEY]);

  return renderHook(() =>
    useActiveColumns({
      columns: options.columns ?? columns,
      columnManagementID: tableID,
      showNamespaceOverride: options.showNamespaceOverride,
    }),
  );
};

describe('useActiveColumns', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows default columns and keeps unlabeled action columns', () => {
    const { result } = setupHook({
      columns: [
        ...columns,
        { id: 'extra', title: 'Extra', additional: true },
        { id: '', title: '' },
      ],
    });

    expect(result.current[0].map(({ id }) => id)).toEqual(['name', 'status', 'owner', '']);
    expect(result.current[1]).toBe(true);
  });

  it('uses saved selections when determining the visible columns', () => {
    const { result } = setupHook({ selectedColumns: ['name', 'owner'] });

    expect(result.current[0].map(({ id }) => id)).toEqual(['name', 'owner']);
  });

  it('renders visible columns in the saved order', () => {
    const { result } = setupHook({
      selectedColumns: ['name', 'status', 'owner'],
      columnOrder: ['name', 'owner', 'status'],
    });

    expect(result.current[0].map(({ id }) => id)).toEqual(['name', 'owner', 'status']);
  });

  it('keeps sticky columns in their original slots while reordering other columns', () => {
    const stickyColumns: TestColumn[] = [
      { id: 'name', title: 'Name', props: { isStickyColumn: true } },
      { id: 'zone', title: 'Zone', props: { isStickyColumn: true } },
      { id: 'status', title: 'Status' },
      { id: 'owner', title: 'Owner' },
    ];
    const { result } = setupHook({
      columns: stickyColumns,
      selectedColumns: ['name', 'zone', 'status', 'owner'],
      columnOrder: ['owner', 'name', 'status', 'zone'],
    });

    expect(result.current[0].map(({ id }) => id)).toEqual(['name', 'zone', 'owner', 'status']);
  });

  it('uses the saved selection order when no separate order preference exists', () => {
    const { result } = setupHook({ selectedColumns: ['name', 'owner', 'status'] });

    expect(result.current[0].map(({ id }) => id)).toEqual(['name', 'owner', 'status']);
  });

  it('hides the namespace column in a single project unless the override is enabled', () => {
    const namespaceColumns: TestColumn[] = [
      { id: 'name', title: 'Name' },
      { id: 'namespace', title: 'Namespace' },
      { id: 'status', title: 'Status' },
    ];
    const options = {
      columns: namespaceColumns,
      selectedColumns: ['name', 'namespace', 'status'],
      namespace: 'project-a',
    };

    const hiddenResult = setupHook(options).result;
    expect(hiddenResult.current[0].map(({ id }) => id)).toEqual(['name', 'status']);

    const overrideResult = setupHook({ ...options, showNamespaceOverride: true }).result;
    expect(overrideResult.current[0].map(({ id }) => id)).toEqual(['name', 'namespace', 'status']);
  });

  it('waits for both column preferences to load', () => {
    const { result } = setupHook({ orderPreferencesLoaded: false });

    expect(result.current[1]).toBe(false);
  });
});
