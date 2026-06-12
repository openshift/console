import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { cellIsStickyProps } from '@console/app/src/components/data-view/ConsoleDataView';
import type { K8sResourceKind, TableColumn } from '@console/internal/module/k8s';

export const tableColumnInfo = [
  { id: 'name' },
  { id: 'type' },
  { id: 'status' },
  { id: 'created' },
];

export const useHelmReleaseResourcesColumns = (): TableColumn<K8sResourceKind>[] => {
  const { t } = useTranslation('helm-plugin');
  return useMemo(
    () => [
      {
        title: t('Name'),
        id: tableColumnInfo[0].id,
        sort: 'metadata.name',
        props: {
          ...cellIsStickyProps,
          modifier: 'nowrap',
        },
      },
      {
        title: t('Type'),
        id: tableColumnInfo[1].id,
        sort: 'kind',
        props: {
          modifier: 'nowrap',
        },
      },
      {
        title: t('Status'),
        id: tableColumnInfo[2].id,
        sort: 'status.phase',
        props: {
          modifier: 'nowrap',
        },
      },
      {
        title: t('Created'),
        id: tableColumnInfo[3].id,
        sort: 'metadata.creationTimestamp',
        props: {
          modifier: 'nowrap',
        },
      },
    ],
    [t],
  );
};
