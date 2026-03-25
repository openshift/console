import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { cellIsStickyProps } from '@console/app/src/components/data-view/ConsoleDataView';
import type { TableColumn } from '@console/internal/module/k8s';

export const tableColumnInfo = [
  { id: 'name' },
  { id: 'namespace' },
  { id: 'revision' },
  { id: 'updated' },
  { id: 'status' },
  { id: 'chartName' },
  { id: 'chartVersion' },
  { id: 'appVersion' },
  { id: 'kebab' },
];

const useHelmReleaseListColumns = (): TableColumn<any>[] => {
  const { t } = useTranslation();
  return useMemo(
    () => [
      {
        title: t('helm-plugin~Name'),
        id: tableColumnInfo[0].id,
        sort: 'name',
        props: {
          ...cellIsStickyProps,
          modifier: 'nowrap',
        },
      },
      {
        title: t('helm-plugin~Namespace'),
        id: tableColumnInfo[1].id,
        sort: 'namespace',
        props: {
          modifier: 'nowrap',
        },
      },
      {
        title: t('helm-plugin~Revision'),
        id: tableColumnInfo[2].id,
        sort: 'version',
        props: {
          modifier: 'nowrap',
        },
      },
      {
        title: t('helm-plugin~Updated'),
        id: tableColumnInfo[3].id,
        sort: 'info.last_deployed',
        props: {
          modifier: 'nowrap',
        },
      },
      {
        title: t('helm-plugin~Status'),
        id: tableColumnInfo[4].id,
        sort: 'info.status',
        props: {
          modifier: 'nowrap',
        },
      },
      {
        title: t('helm-plugin~Chart name'),
        id: tableColumnInfo[5].id,
        sort: 'chart.metadata.name',
        props: {
          modifier: 'nowrap',
        },
      },
      {
        title: t('helm-plugin~Chart version'),
        id: tableColumnInfo[6].id,
        sort: 'chart.metadata.version',
        props: {
          modifier: 'nowrap',
        },
      },
      {
        title: t('helm-plugin~App version'),
        id: tableColumnInfo[7].id,
        sort: 'chart.metadata.appVersion',
        props: {
          modifier: 'nowrap',
        },
      },
      {
        title: '',
        id: tableColumnInfo[8].id,
        props: {
          modifier: 'nowrap',
        },
      },
    ],
    [t],
  );
};

export default useHelmReleaseListColumns;
