import * as React from 'react';
import { CellMeasurerCache, CellMeasurer } from 'react-virtualized';
import { VirtualTableBody } from '@patternfly/react-virtualized-extension';
import { Scroll } from '@patternfly/react-virtualized-extension/dist/js/components/Virtualized/types';
import { OnSelect } from '@patternfly/react-table';
import {
  K8sResourceCommon,
  TableColumn,
  RowProps,
  OnRowsRendered,
} from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import { TableRow } from '../table';

type VirtualizedTableBodyProps<D, R = {}> = {
  Row: React.ComponentType<RowProps<D, R>>;
  data: D[];
  height: number;
  isScrolling: boolean;
  onChildScroll: (params: Scroll) => void;
  columns: TableColumn<D>[];
  scrollTop: number;
  width: number;
  rowData?: R;
  getRowId?: (obj: D) => string;
  getRowTitle?: (obj: D) => string;
  getRowClassName?: (obj: D) => string;
  onRowsRendered?: OnRowsRendered;
  onSelect?: OnSelect;
};

const RowMemo = React.memo<
  RowProps<any, any> & {
    Row: React.ComponentType<RowProps<any, any>>;
    isScrolling: boolean;
    style: React.CSSProperties;
  }
>(
  // eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
  ({ Row, isScrolling, style, ...props }) => <Row {...props} />,
  (_, nextProps) => {
    if (nextProps.isScrolling) {
      return true;
    }
  },
);

const VirtualizedTableBody = <D extends any, R extends any = {}>({
  Row,
  height,
  isScrolling,
  onChildScroll,
  data,
  columns,
  scrollTop,
  width,
  rowData,
  getRowId,
  getRowTitle,
  getRowClassName,
  onRowsRendered,
  onSelect,
}: VirtualizedTableBodyProps<D, R>) => {
  const cellMeasurementCache = new CellMeasurerCache({
    fixedWidth: true,
    minHeight: 44,
    keyMapper: (rowIndex) => (data?.[rowIndex] as K8sResourceCommon)?.metadata?.uid || rowIndex, // TODO custom keyMapper ?
  });

  const activeColumnIDs = React.useMemo(() => new Set(columns.map((c) => c.id)), [columns]);

  const rowRenderer = ({ index, isVisible, key, style, parent }) => {
    const rowArgs: RowProps<D, R> = {
      obj: data[index],
      activeColumnIDs,
      rowData,
      index,
      onSelect,
    };

    // do not render non visible elements (this excludes overscan)
    if (!isVisible) {
      return null;
    }
    return (
      <CellMeasurer
        cache={cellMeasurementCache}
        columnIndex={0}
        key={key}
        parent={parent}
        rowIndex={index}
      >
        <TableRow
          id={getRowId?.(rowArgs.obj) ?? key}
          index={index}
          trKey={key}
          style={style}
          title={getRowTitle?.(rowArgs.obj)}
          className={getRowClassName?.(rowArgs.obj)}
        >
          <RowMemo Row={Row} {...rowArgs} style={style} isScrolling={isScrolling} />
        </TableRow>
      </CellMeasurer>
    );
  };

  return (
    <VirtualTableBody
      autoHeight
      className="pf-v6-c-table pf-m-compact pf-m-border-rows pf-v6-c-virtualized pf-v6-c-window-scroller"
      deferredMeasurementCache={cellMeasurementCache}
      rowHeight={cellMeasurementCache.rowHeight}
      height={height || 0}
      isScrolling={isScrolling}
      onScroll={onChildScroll}
      overscanRowCount={10}
      columns={columns}
      rows={data}
      rowCount={data.length}
      rowRenderer={rowRenderer}
      scrollTop={scrollTop}
      width={width}
      onRowsRendered={onRowsRendered}
    />
  );
};

export default VirtualizedTableBody;
