import * as React from 'react';
import { VirtualTableBody } from '@patternfly/react-virtualized-extension';
import { CellMeasurerCache, CellMeasurer } from 'react-virtualized';
import { Scroll } from '@patternfly/react-virtualized-extension/dist/js/components/Virtualized/types';
import { K8sResourceCommon } from '@console/dynamic-plugin-sdk';
import { TableColumn, RowProps } from './VirtualizedTable';
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
};

const RowMemo = React.memo<RowProps<any, any> & { Row: React.ComponentType<RowProps<any, any>> }>(
  ({ Row, ...props }) => <Row {...props} />,
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
          <RowMemo Row={Row} {...rowArgs} />
        </TableRow>
      </CellMeasurer>
    );
  };

  return (
    <VirtualTableBody
      autoHeight
      className="pf-c-table pf-m-compact pf-m-border-rows pf-c-virtualized pf-c-window-scroller"
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
    />
  );
};

export default VirtualizedTableBody;
