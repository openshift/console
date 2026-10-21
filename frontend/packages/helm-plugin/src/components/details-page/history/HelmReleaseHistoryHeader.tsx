import type { TFunction } from 'i18next';
import type { TableColumn } from '@console/internal/module/k8s';
import type { HelmRelease } from '../../../types/helm-types';

export const tableColumnInfo = [
  { id: 'revision' },
  { id: 'updated' },
  { id: 'status' },
  { id: 'chartName' },
  { id: 'chartVersion' },
  { id: 'appVersion' },
  { id: 'description' },
  { id: 'kebab' },
];

const HelmReleaseHistoryHeader = (t: TFunction): TableColumn<HelmRelease>[] => {
  return [
    {
      title: t('helm-plugin~Revision'),
      id: tableColumnInfo[0].id,
      sort: 'version',
      props: {
        modifier: 'nowrap',
      },
    },
    {
      title: t('helm-plugin~Updated'),
      id: tableColumnInfo[1].id,
      sort: 'info.last_deployed',
      props: {
        modifier: 'nowrap',
      },
    },
    {
      title: t('helm-plugin~Status'),
      id: tableColumnInfo[2].id,
      sort: 'info.status',
      props: {
        modifier: 'nowrap',
      },
    },
    {
      title: t('helm-plugin~Chart name'),
      id: tableColumnInfo[3].id,
      sort: 'chart.metadata.name',
      props: {
        modifier: 'nowrap',
      },
    },
    {
      title: t('helm-plugin~Chart version'),
      id: tableColumnInfo[4].id,
      sort: 'chart.metadata.version',
      props: {
        modifier: 'nowrap',
      },
    },
    {
      title: t('helm-plugin~App version'),
      id: tableColumnInfo[5].id,
      sort: 'chart.metadata.appVersion',
      props: {
        modifier: 'nowrap',
      },
    },
    {
      title: t('helm-plugin~Description'),
      id: tableColumnInfo[6].id,
      props: {
        modifier: 'nowrap',
      },
    },
    {
      title: '',
      id: tableColumnInfo[7].id,
    },
  ];
};

export default HelmReleaseHistoryHeader;
