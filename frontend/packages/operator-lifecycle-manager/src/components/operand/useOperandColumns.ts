import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  cellIsStickyProps,
  getLabelsColumnWidthStyleProp,
  getNameColumnProps,
} from '@console/app/src/components/data-view/ConsoleDataView';
import { useColumnWidthSettings } from '@console/app/src/components/data-view/useResizableColumnProps';
import type { ConsoleDataViewColumn } from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import type { K8sResourceKind } from '@console/internal/module/k8s';
import { sortByValue } from '../dataViewSortHelpers';
import { getOperandNamespace, getOperandStatusText } from './operand-status';

/**
 * Console-only model for column width preferences. An operand list can span every kind a CSV
 * provides, so the widths cannot be keyed by any single resource model.
 */
const OperandsListModel = {
  apiGroup: 'console.ui',
  apiVersion: 'v1',
  kind: 'OperandsList',
  plural: 'operandslists',
  label: 'Operand',
  labelPlural: 'Operands',
  abbr: 'O',
};

/**
 * Columns for an operand list.
 * @param showNamespace - Whether the list spans namespaces and should show a Namespace column.
 */
export const useOperandColumns = (
  showNamespace: boolean,
): {
  columns: ConsoleDataViewColumn<K8sResourceKind>[];
  resetAllColumnWidths: () => void;
} => {
  const { t } = useTranslation('olm');
  const { getResizableProps, getWidth, resetAllColumnWidths } =
    useColumnWidthSettings(OperandsListModel);
  const columns = useMemo(
    () => [
      {
        id: 'name',
        resizableProps: getResizableProps('name'),
        title: t('Name'),
        sort: 'metadata.name',
        props: getNameColumnProps(),
      },
      {
        id: 'kind',
        resizableProps: getResizableProps('kind'),
        title: t('Kind'),
        sort: 'kind',
        props: { modifier: 'nowrap' as const },
      },
      ...(showNamespace
        ? [
            {
              id: 'namespace',
              resizableProps: getResizableProps('namespace'),
              title: t('Namespace'),
              sort: sortByValue<K8sResourceKind>(getOperandNamespace),
              props: { modifier: 'nowrap' as const },
            },
          ]
        : []),
      {
        id: 'status',
        resizableProps: getResizableProps('status'),
        title: t('Status'),
        sort: sortByValue<K8sResourceKind>(getOperandStatusText),
        props: { modifier: 'nowrap' as const },
      },
      {
        id: 'labels',
        resizableProps: getResizableProps('labels'),
        title: t('Labels'),
        sort: 'metadata.labels',
        props: {
          modifier: 'nowrap' as const,
          ...getLabelsColumnWidthStyleProp(getWidth('labels')),
        },
      },
      {
        id: 'lastUpdated',
        resizableProps: getResizableProps('lastUpdated'),
        title: t('Last updated'),
        sort: 'metadata.creationTimestamp',
        props: { modifier: 'nowrap' as const },
      },
      { id: 'actions', title: '', props: cellIsStickyProps },
    ],
    [t, getResizableProps, getWidth, showNamespace],
  );
  return { columns, resetAllColumnWidths };
};
