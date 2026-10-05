import type { DataViewTd } from '@patternfly/react-data-view/dist/esm/DataViewTable/DataViewTable';
import type { ExtensionK8sKindVersionModel } from '../api/common-types';
import type { Extension, CodeRef } from '../types';
import type { ConsoleDataViewColumn, RowProps } from './console-types';

/**
 * Returns one cell for each item on the filtered, sorted, and paginated current page,
 * in the same order as `data`. Console calls this function only while the column is visible.
 * Console associates each cell with the extension's `columnData.id`. Returning a different
 * number of cells is invalid. A `null` or `undefined` cell renders empty.
 * @param data - The current page of row data, each entry wrapping a data item along with row-level metadata.
 * @returns One `DataViewTd` per item in `data`.
 * @example
 * ```tsx
 * const getDataViewCell: GetDataViewCell<PodDisruptionBudgetKind> = (data) =>
 *   data.map(({ obj: pdb }) => ({
 *     cell: <span>{pdb.status.disruptionsAllowed}</span>,
 *   }));
 * ```
 */
export type GetDataViewCell<TData, TCustomRowData = unknown> = (
  data: RowProps<TData, TCustomRowData>[],
) => DataViewTd[];

/** A column contributed by an extension. Extension columns require a title. */
export type ConsoleDataViewExtensionColumn<TData = unknown> = Omit<
  ConsoleDataViewColumn<TData>,
  'type'
> & { title: string };

/**
 * Adds a column to a `ConsoleDataView` table matched by its Kubernetes model or resolved ID.
 * A default-hidden column can be selected only when that table provides a `columnLayout`
 * and shows the column management action. `columnData.id` must be unique among built-in
 * and extension columns, and the title must be nonempty. Console keeps built-in columns
 * when IDs collide. For duplicate plugin IDs, the first column in plugin-name/column-ID
 * order wins. Prefix the ID with the plugin name to avoid collisions. `columnData.title`
 * and `columnData.tooltip` support translated keys in the `%namespace~key%` format.
 *
 * Columns without an insertion anchor appear before the table's actions column, or at
 * the end if there is no actions column. Anchors refer to built-in or plugin column IDs.
 * When several plugins use the same anchor, Console orders them by plugin name and then
 * column ID. An unknown anchor or insertion cycle uses the default position.
 * Example `console-extensions.json` entry:
 * ```json
 * {
 *   "type": "console.dataview/table-column",
 *   "properties": {
 *     "table": { "group": "apps", "version": "v1", "kind": "Deployment" },
 *     "columnData": { "id": "ready", "title": "%plugin~Ready%" },
 *     "getCellContent": { "$codeRef": "columns.getReadyCell" }
 *   }
 * }
 * ```
 */
export type ConsoleDataViewTableColumn<TData = unknown, TCustomRowData = unknown> = Extension<
  'console.dataview/table-column',
  {
    /** The Kubernetes group, version, and kind of the target table, or a string exactly matching its resolved ID. */
    table: ExtensionK8sKindVersionModel | string;
    /** Inline column definition or code reference. When `additional` is omitted, Console treats it as `true`. */
    columnData:
      CodeRef<ConsoleDataViewExtensionColumn<TData>> | ConsoleDataViewExtensionColumn<TData>;
    /** Code reference that returns one cell per item on the current page. */
    getCellContent: CodeRef<GetDataViewCell<TData, TCustomRowData>>;
    /** The column ID before which this item should be placed. Takes precedence when both anchors exist. */
    insertBefore?: string;
    /** The column ID after which this item should be placed. Used if `insertBefore` is absent or unknown. */
    insertAfter?: string;
  }
>;

export const isConsoleDataViewTableColumn = (e: Extension): e is ConsoleDataViewTableColumn =>
  e.type === 'console.dataview/table-column';
