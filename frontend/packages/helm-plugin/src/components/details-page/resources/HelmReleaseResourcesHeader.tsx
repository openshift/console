import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { ConsoleDataViewColumn } from '@console/dynamic-plugin-sdk/src/extensions/console-types';
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
        type: 'name' as const,
        title: t('Name'),
        id: tableColumnInfo[0].id,
        sort: 'metadata.name',
        props: { hasRightBorder: false, modifier: 'nowrap' as const },
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
