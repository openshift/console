import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { cellIsStickyProps } from '@console/app/src/components/data-view/ConsoleDataView';
import type { ConsoleDataViewColumn } from '@console/app/src/components/data-view/types';
import type { K8sResourceKind } from '@console/internal/module/k8s';

export const tableColumnInfo = [
  { id: 'name' },
  { id: 'type' },
  { id: 'status' },
  { id: 'created' },
];

export const useHelmReleaseResourcesColumns = (): ConsoleDataViewColumn<K8sResourceKind>[] => {
  const { t } = useTranslation('helm-plugin');
  return useMemo(
    () => [
      {
        title: t('Name'),
        id: tableColumnInfo[0].id,
        sort: 'metadata.name',
        props: {
          ...cellIsStickyProps,
          modifier: 'nowrap' as const,
        },
      },
      {
        title: t('Type'),
        id: tableColumnInfo[1].id,
        sort: 'kind',
        props: {
          modifier: 'nowrap' as const,
        },
      },
      {
        title: t('Status'),
        id: tableColumnInfo[2].id,
        sort: 'status.phase',
        props: {
          modifier: 'nowrap' as const,
        },
      },
      {
        title: t('Created'),
        id: tableColumnInfo[3].id,
        sort: 'metadata.creationTimestamp',
        props: {
          modifier: 'nowrap' as const,
        },
      },
    ],
    [t],
  );
};
