import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { cellIsStickyProps } from '@console/app/src/components/data-view/ConsoleDataView';
import type { K8sResourceKind, TableColumn } from '@console/internal/module/k8s';

export const tableColumnInfo = [
  { id: 'name' },
  { id: 'displayName' },
  { id: 'namespace' },
  { id: 'disabled' },
  { id: 'repoUrl' },
  { id: 'created' },
  { id: 'kebab' },
];

export const useRepositoriesColumns = (): TableColumn<K8sResourceKind>[] => {
  const { t } = useTranslation();
  return useMemo(
    () => [
      {
        title: t('helm-plugin~Name'),
        id: tableColumnInfo[0].id,
        sort: 'metadata.name',
        props: {
          ...cellIsStickyProps,
          modifier: 'nowrap',
        },
      },
      {
        title: t('helm-plugin~Display Name'),
        id: tableColumnInfo[1].id,
        sort: 'spec.name',
        props: {
          modifier: 'nowrap',
        },
      },
      {
        title: t('helm-plugin~Namespace'),
        id: tableColumnInfo[2].id,
        sort: 'metadata.namespace',
        props: {
          modifier: 'nowrap',
        },
      },
      {
        title: t('helm-plugin~Disabled'),
        id: tableColumnInfo[3].id,
        sort: 'spec.disabled',
        props: {
          modifier: 'nowrap',
        },
      },
      {
        title: t('helm-plugin~Repo URL'),
        id: tableColumnInfo[4].id,
        sort: 'spec.connectionConfig.url',
        props: {
          modifier: 'nowrap',
        },
      },
      {
        title: t('helm-plugin~Created'),
        id: tableColumnInfo[5].id,
        sort: 'metadata.creationTimestamp',
        props: {
          modifier: 'nowrap',
        },
      },
      {
        title: '',
        id: tableColumnInfo[6].id,
        props: {
          modifier: 'nowrap',
        },
      },
    ],
    [t],
  );
};

export default useRepositoriesColumns;
