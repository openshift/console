import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { ISortBy, OnSelect, OnSort, Th, Thead, Tr } from '@patternfly/react-table';
import { TableColumn as InternalTableColumn } from '../table';
import { TableColumn as SDKTableColumn } from '@console/dynamic-plugin-sdk/src/extensions/console-types';

export const TableHeader: React.FCC<TableHeaderProps> = ({
  allRowsSelected,
  canSelectAll,
  columns,
  sortBy,
  onSelect,
  onSort,
}) => {
  const { t } = useTranslation();
  const select = canSelectAll ? { select: { onSelect, isSelected: allRowsSelected } } : {};
  return (
    <Thead>
      <Tr>
        {onSelect && <Th aria-label={t('public~Row select')} {...select} />}
        {columns.map(({ id, title, sort, sortField, sortFunc, props }, columnIndex) => {
          const sortable = sortField || sortFunc || sort;
          return (
            <Th
              key={id || title || 'actions'}
              sort={sortable ? { sortBy, onSort, columnIndex } : null}
              data-label={title}
              screenReaderText={!title && t('public~Actions')}
              {...(props ?? {})}
            >
              {title}
            </Th>
          );
        })}
      </Tr>
    </Thead>
  );
};

TableHeader.displayName = 'TableHeader';

type TableHeaderProps = {
  allRowsSelected?: boolean;
  canSelectAll?: boolean;
  columns: InternalTableColumn[] | SDKTableColumn<any>[];
  onSelect?: OnSelect;
  onSort?: OnSort;
  sortBy?: ISortBy;
};

export default TableHeader;
