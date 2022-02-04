import * as React from 'react';
import { TableVariant, Table, TableBody } from '@patternfly/react-table';
import classnames from 'classnames';
import './FilterTable.scss';

export type FilterTableRowProps = { key: string; value: string }[];
type FilterTableProps = {
  filters: FilterTableRowProps;
  bordered?: boolean;
  paddingLeft?: boolean;
};

const FilterTable: React.FC<FilterTableProps> = ({
  filters,
  bordered = true,
  paddingLeft = false,
}) => {
  const filterRow = (key: string, value: string) => {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const className = classnames({ 'kn-filter-table__row--bordered': bordered });
    return {
      cells: [
        {
          title: key,
          props: {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            className: classnames(className, { 'kn-filter-table__padding--left': paddingLeft }),
          },
        },
        {
          title: value,
          props: {
            className,
            colSpan: 2,
          },
        },
      ],
    };
  };
  const data = {
    columns: ['Key', 'Value'],
    rows: filters.map(({ key, value }) => filterRow(key, value)),
  };
  return (
    <Table
      className="kn-filter-table"
      aria-label="Attributes Table"
      variant={TableVariant.compact}
      cells={data.columns}
      rows={data.rows}
      borders
    >
      <TableBody />
    </Table>
  );
};

export default FilterTable;
