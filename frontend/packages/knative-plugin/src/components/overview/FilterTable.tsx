import * as React from 'react';
import { Table, Tr, Tbody, Td, Thead, Th } from '@patternfly/react-table';
import cx from 'classnames';
import { useTranslation } from 'react-i18next';
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
    const className = cx({ 'kn-filter-table__row--bordered': bordered });
    return {
      cells: [
        {
          title: key,
          props: {
            className: cx(className, { 'kn-filter-table__padding--left': paddingLeft }),
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

  const { t } = useTranslation('knative-plugin');

  const data = {
    columns: [t('Attribute'), t('Value')],
    rows: filters.map(({ key, value }) => filterRow(key, value)),
  };

  return (
    <Table className="kn-filter-table" aria-label="Attributes Table" variant="compact" borders>
      <Thead>
        <Tr>
          {data.columns.map((column) => (
            <Th
              key={column}
              className={cx(
                cx({ 'kn-filter-table__padding--left': paddingLeft && column === t('Attribute') }),
                { 'kn-filter-table__row--bordered': bordered },
              )}
            >
              {column}
            </Th>
          ))}
        </Tr>
      </Thead>

      <Tbody>
        {data.rows.map((row) => (
          <Tr key={row.cells[0]?.title}>
            {row.cells.map((cell) => (
              <Td key={cell?.title + row.cells[0]?.title} {...cell.props}>
                {cell.title}
              </Td>
            ))}
          </Tr>
        ))}
      </Tbody>
    </Table>
  );
};

export default FilterTable;
