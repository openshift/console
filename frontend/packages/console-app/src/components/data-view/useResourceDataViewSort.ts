import * as React from 'react';
import { SortByDirection } from '@patternfly/react-table';
import * as _ from 'lodash';
import { useNavigate } from 'react-router-dom-v5-compat';
import { K8sResourceCommon } from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import { ResourceDataViewColumn } from './types';

export const useResourceDataViewSort = <TData extends K8sResourceCommon = K8sResourceCommon>({
  columns,
  sortColumnIndex,
  sortDirection,
}: {
  columns: ResourceDataViewColumn<TData>[];
  sortColumnIndex?: number;
  sortDirection?: SortByDirection;
}) => {
  const navigate = useNavigate();

  const [sortBy, setSortBy] = React.useState<{
    index: number;
    direction: SortByDirection;
  }>({
    index: sortColumnIndex ?? 0,
    direction: sortDirection ?? SortByDirection.asc,
  });

  const applySort = React.useCallback(
    (index: number, direction: SortByDirection) => {
      const sp = new URLSearchParams(window.location.search);
      const url = new URL(window.location.href);
      const sortColumn = columns[index];

      if (sortColumn) {
        sp.set('sortBy', sortColumn.title);
        sp.set('orderBy', direction);

        navigate(`${url.pathname}?${sp.toString()}${url.hash}`, { replace: true });
        setSortBy({ index, direction });
      }
    },
    [columns, navigate],
  );

  React.useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const columnIndex = _.findIndex(columns, { title: sp.get('sortBy') });

    if (!Number.isNaN(columnIndex) && columns[columnIndex]) {
      const sortOrder =
        sp.get('orderBy') === SortByDirection.desc.valueOf()
          ? SortByDirection.desc
          : SortByDirection.asc;

      setSortBy({ index: columnIndex, direction: sortOrder });
    }
  }, [columns]);

  const onSort = React.useCallback(
    (event: React.BaseSyntheticEvent, index: number, direction: SortByDirection) => {
      event.preventDefault();
      applySort(index, direction);
    },
    [applySort],
  );

  return { sortBy, onSort };
};
