import * as _ from 'lodash-es';
import * as React from 'react';
import { useState, useEffect } from 'react';
import { Table as PfTable, TableHeader, TableBody, SortByDirection, ICell } from '@patternfly/react-table';
export const ExpandableInnerTable: React.FC<ExpandableInnerTableProps> = ({ data, header, Row }) => {
  const [sortBy, setSortBy] = useState({
    index: 0,
    direction: SortByDirection.asc,
  });

  const [rows, setRows] = useState([]);

  useEffect(() => {
    const preData = [];
    _.forEach(data, (value, index) => {
      preData.push({ cells: Row(value) });
    });
    setRows(preData);
  }, []);

  const onSort = (_event, index, direction) => {
    if (direction === SortByDirection.asc) {
      // MEMO: 오름차순 정렬
      const sortedRows = _.cloneDeep(rows).sort((a, b) => {
        if (a.cells[index].textValue < b.cells[index].textValue) {
          return -1;
        }
        return a.cells[index].textValue > b.cells[index].textValue ? 1 : 0;
      });

      setSortBy({
        index,
        direction,
      });

      setRows(sortedRows);
    } else {
      // MEMO: 내림차순 정렬
      const sortedRows = _.cloneDeep(rows).sort((a, b) => {
        if (a.cells[index].textValue < b.cells[index].textValue) {
          return 1;
        }
        return a.cells[index].textValue > b.cells[index].textValue ? -1 : 0;
      });

      setSortBy({
        index,
        direction,
      });

      setRows(sortedRows);
    }
  };

  return (
    <div className="co-m-table-grid co-m-table-grid--bordered">
      <PfTable cells={header} rows={rows} className="pf-m-compact pf-m-border-rows" aria-label="inner-table-label" sortBy={sortBy} onSort={onSort}>
        <TableHeader />
        <TableBody />
      </PfTable>
    </div>
  );
};

export type RowFunctionArgs = {
  obj: any;
  index: number;
  key: string;
  style?: object;
};

export type Cell = {
  textValue: string;
} & ICell;

export type ExpandableInnerTableProps = {
  data?: any[];
  header: any[];
  Row?: (obj) => Cell[];
};
