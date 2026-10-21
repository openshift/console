import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { nameCellProps } from '@console/app/src/components/data-view/ConsoleDataView';
import { useColumnWidthSettings } from '@console/app/src/components/data-view/useResizableColumnProps';
import type { K8sModel } from '@console/dynamic-plugin-sdk';
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

export const useRepositoriesColumns = (
  model: K8sModel,
): {
  columns: TableColumn<K8sResourceKind>[];
  resetAllColumnWidths: () => void;
} => {
  const { t } = useTranslation();
  const { getResizableProps, resetAllColumnWidths } = useColumnWidthSettings(model);

  const columns = useMemo(
    () => [
      {
        title: t('helm-plugin~Name'),
        id: tableColumnInfo[0].id,
        sort: 'metadata.name',
        resizableProps: getResizableProps(tableColumnInfo[0].id),
        props: {
          ...nameCellProps,
          modifier: 'nowrap',
        },
      },
      {
        title: t('helm-plugin~Display Name'),
        id: tableColumnInfo[1].id,
        sort: 'spec.name',
        resizableProps: getResizableProps(tableColumnInfo[1].id),
        props: {
          modifier: 'nowrap',
        },
      },
      {
        title: t('helm-plugin~Namespace'),
        id: tableColumnInfo[2].id,
        sort: 'metadata.namespace',
        resizableProps: getResizableProps(tableColumnInfo[2].id),
        props: {
          modifier: 'nowrap',
        },
      },
      {
        title: t('helm-plugin~Disabled'),
        id: tableColumnInfo[3].id,
        sort: 'spec.disabled',
        resizableProps: getResizableProps(tableColumnInfo[3].id),
        props: {
          modifier: 'nowrap',
        },
      },
      {
        title: t('helm-plugin~Repo URL'),
        id: tableColumnInfo[4].id,
        sort: 'spec.connectionConfig.url',
        resizableProps: getResizableProps(tableColumnInfo[4].id),
        props: {
          modifier: 'nowrap',
        },
      },
      {
        title: t('helm-plugin~Created'),
        id: tableColumnInfo[5].id,
        sort: 'metadata.creationTimestamp',
        resizableProps: getResizableProps(tableColumnInfo[5].id),
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
    [t, getResizableProps],
  );

  return { columns, resetAllColumnWidths };
};

export default useRepositoriesColumns;
