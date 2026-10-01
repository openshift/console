import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { nameCellProps } from '@console/app/src/components/data-view/ConsoleDataView';
import type { ConsoleDataViewColumn } from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import type { K8sResourceKind } from '@console/internal/module/k8s';

export const tableColumnInfo = [
  { id: 'name' },
  { id: 'displayName' },
  { id: 'namespace' },
  { id: 'disabled' },
  { id: 'repoUrl' },
  { id: 'created' },
  { id: 'kebab' },
];

export const useRepositoriesColumns = (): {
  columns: ConsoleDataViewColumn<K8sResourceKind>[];
} => {
  const { t } = useTranslation('helm-plugin');

  const columns = useMemo<ConsoleDataViewColumn<K8sResourceKind>[]>(
    () => [
      {
        title: t('Name'),
        id: tableColumnInfo[0].id,
        sort: 'metadata.name',
        props: {
          ...nameCellProps,
          modifier: 'nowrap' as const,
        },
      },
      {
        title: t('Display Name'),
        id: tableColumnInfo[1].id,
        sort: 'spec.name',
        props: {
          modifier: 'nowrap' as const,
        },
      },
      {
        title: t('Namespace'),
        id: tableColumnInfo[2].id,
        sort: 'metadata.namespace',
        props: {
          modifier: 'nowrap' as const,
        },
      },
      {
        title: t('Disabled'),
        id: tableColumnInfo[3].id,
        sort: 'spec.disabled',
        props: {
          modifier: 'nowrap' as const,
        },
      },
      {
        title: t('Repo URL'),
        id: tableColumnInfo[4].id,
        sort: 'spec.connectionConfig.url',
        props: {
          modifier: 'nowrap' as const,
        },
      },
      {
        title: t('Created'),
        id: tableColumnInfo[5].id,
        sort: 'metadata.creationTimestamp',
        props: {
          modifier: 'nowrap' as const,
        },
      },
      {
        title: '',
        id: tableColumnInfo[6].id,
        props: {
          modifier: 'nowrap' as const,
        },
      },
    ],
    [t],
  );

  return { columns };
};
