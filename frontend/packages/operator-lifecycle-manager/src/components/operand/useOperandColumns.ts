import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  cellIsStickyProps,
  getLabelsColumnWidthStyleProp,
  getNameColumnProps,
} from '@console/app/src/components/data-view/ConsoleDataView';
import type { ConsoleDataViewColumn } from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import type { K8sResourceKind } from '@console/internal/module/k8s';
import { sortByValue } from '../dataViewSortHelpers';
import { getOperandNamespace, getOperandStatusText } from './operand-status';

/**
 * Columns for an operand list.
 * @param showNamespace - Whether the list spans namespaces and should show a Namespace column.
 */
export const useOperandColumns = (
  showNamespace: boolean,
): {
  columns: ConsoleDataViewColumn<K8sResourceKind>[];
} => {
  const { t } = useTranslation('olm');
  const columns = useMemo(
    () => [
      {
        id: 'name',
        title: t('Name'),
        sort: 'metadata.name',
        props: getNameColumnProps(),
      },
      {
        id: 'kind',
        title: t('Kind'),
        sort: 'kind',
        props: { modifier: 'nowrap' as const },
      },
      ...(showNamespace
        ? [
            {
              id: 'namespace',
              title: t('Namespace'),
              sort: sortByValue<K8sResourceKind>(getOperandNamespace),
              props: { modifier: 'nowrap' as const },
            },
          ]
        : []),
      {
        id: 'status',
        title: t('Status'),
        sort: sortByValue<K8sResourceKind>(getOperandStatusText),
        props: { modifier: 'nowrap' as const },
      },
      {
        id: 'labels',
        title: t('Labels'),
        sort: 'metadata.labels',
        props: {
          modifier: 'nowrap' as const,
          ...getLabelsColumnWidthStyleProp(),
        },
      },
      {
        id: 'lastUpdated',
        title: t('Last updated'),
        sort: 'metadata.creationTimestamp',
        props: { modifier: 'nowrap' as const },
      },
      { id: 'actions', title: '', props: cellIsStickyProps },
    ],
    [t, showNamespace],
  );
  return { columns };
};
