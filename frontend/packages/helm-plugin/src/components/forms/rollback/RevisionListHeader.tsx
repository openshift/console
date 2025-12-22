import type { MouseEvent } from 'react';
import { useMemo } from 'react';
import { DataViewTh } from '@patternfly/react-data-view';
import { ThProps, SortByDirection } from '@patternfly/react-table';
import { useTranslation } from 'react-i18next';

export const tableColumnInfo = [
  { id: 'input', index: 0 },
  { id: 'revision', index: 1 },
  { id: 'updated', index: 2 },
  { id: 'status', index: 3 },
  { id: 'chartName', index: 4 },
  { id: 'chartVersion', index: 5 },
  { id: 'appVersion', index: 6 },
  { id: 'description', index: 7 },
];

// Helper function to get column index by ID
export const getColumnIndexById = (columnId: string): number => {
  const column = tableColumnInfo.find((col) => col.id === columnId);
  return column?.index ?? 1; // Default to revision column
};

// Helper function to get column ID by index
export const getColumnIdByIndex = (index: number): string => {
  const column = tableColumnInfo.find((col) => col.index === index);
  return column?.id ?? 'revision'; // Default to revision column
};

export const useRevisionListColumns = (
  sortBy: { index: number; direction: SortByDirection },
  onSort: (event: MouseEvent, columnId: string, direction: SortByDirection) => void,
): DataViewTh[] => {
  const { t } = useTranslation();
  return useMemo(
    () => [
      {
        cell: <span className="pf-v6-u-screen-reader">{t('helm-plugin~Select')}</span>,
        props: {
          modifier: 'nowrap',
          isStickyColumn: true,
          stickyMinWidth: '50px',
        } as ThProps,
      },
      {
        cell: t('helm-plugin~Revision'),
        props: {
          modifier: 'nowrap',
          sort: {
            columnIndex: 1,
            sortBy,
            onSort: (event, index, direction) => onSort(event, 'revision', direction),
          },
        } as ThProps,
      },
      {
        cell: t('helm-plugin~Updated'),
        props: {
          modifier: 'nowrap',
          sort: {
            columnIndex: 2,
            sortBy,
            onSort: (event, index, direction) => onSort(event, 'updated', direction),
          },
        } as ThProps,
      },
      {
        cell: t('helm-plugin~Status'),
        props: {
          modifier: 'nowrap',
          sort: {
            columnIndex: 3,
            sortBy,
            onSort: (event, index, direction) => onSort(event, 'status', direction),
          },
        } as ThProps,
      },
      {
        cell: t('helm-plugin~Chart name'),
        props: {
          modifier: 'nowrap',
          sort: {
            columnIndex: 4,
            sortBy,
            onSort: (event, index, direction) => onSort(event, 'chartName', direction),
          },
        } as ThProps,
      },
      {
        cell: t('helm-plugin~Chart version'),
        props: {
          modifier: 'nowrap',
          sort: {
            columnIndex: 5,
            sortBy,
            onSort: (event, index, direction) => onSort(event, 'chartVersion', direction),
          },
        } as ThProps,
      },
      {
        cell: t('helm-plugin~App version'),
        props: {
          modifier: 'nowrap',
          sort: {
            columnIndex: 6,
            sortBy,
            onSort: (event, index, direction) => onSort(event, 'appVersion', direction),
          },
        } as ThProps,
      },
      {
        cell: t('helm-plugin~Description'),
        props: {
          modifier: 'nowrap',
        } as ThProps,
      },
    ],
    [t, sortBy, onSort],
  );
};

export default useRevisionListColumns;
