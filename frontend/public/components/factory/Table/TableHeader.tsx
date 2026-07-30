import type { FC } from 'react';
import type { ISortBy, OnSelect, OnSort } from '@patternfly/react-table';
import { Th, Thead, Tr } from '@patternfly/react-table';
import { useTranslation } from 'react-i18next';
import type { TableColumn as SDKTableColumn } from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import type { TableColumn as InternalTableColumn } from '../table';

export const TableHeader: FC<TableHeaderProps> = ({
  allRowsSelected,
  canSelectAll,
  columns,
  sortBy,
  onSelect,
  onSort,
}) => {
  const { t } = useTranslation('public');
  const select = canSelectAll ? { select: { onSelect, isSelected: allRowsSelected } } : {};
  return (
    <Thead>
      <Tr>
        {onSelect && <Th aria-label={t('Row select')} {...select} />}
        {columns.map(({ id, title, sort, sortField, sortFunc, props }, columnIndex) => {
          const sortable = sortField || sortFunc || sort;
          return (
            <Th
              key={id || title || 'actions'}
              sort={sortable ? { sortBy, onSort, columnIndex } : null}
              data-label={title}
              screenReaderText={!title && t('Actions')}
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
