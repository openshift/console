import { TFunction } from 'i18next';
import { sortable } from '@patternfly/react-table';
import { Kebab } from '@console/internal/components/utils';

export const tableColumnClasses = {
  revision: '',
  updated: '',
  status: 'pf-m-hidden pf-m-visible-on-lg',
  chartName: 'pf-m-hidden pf-m-visible-on-xl',
  chartVersion: 'pf-m-hidden pf-m-visible-on-xl',
  appVersion: 'pf-m-hidden pf-m-visible-on-xl',
  description: 'pf-m-hidden pf-m-visible-on-xl',
  kebab: Kebab.columnClass,
};

const HelmReleaseHistoryHeader = (t: TFunction) => () => {
  return [
    {
      title: t('helm-plugin~Revision'),
      sortField: 'version',
      transforms: [sortable],
      props: { className: tableColumnClasses.revision },
    },
    {
      title: t('helm-plugin~Updated'),
      sortField: 'info.last_deployed',
      transforms: [sortable],
      props: { className: tableColumnClasses.updated },
    },
    {
      title: t('helm-plugin~Status'),
      sortField: 'info.status',
      transforms: [sortable],
      props: { className: tableColumnClasses.status },
    },
    {
      title: t('helm-plugin~Chart name'),
      sortField: 'chart.metadata.name',
      transforms: [sortable],
      props: { className: tableColumnClasses.chartName },
    },
    {
      title: t('helm-plugin~Chart version'),
      sortField: 'chart.metadata.version',
      transforms: [sortable],
      props: { className: tableColumnClasses.chartVersion },
    },
    {
      title: t('helm-plugin~App version'),
      sortField: 'chart.metadata.appVersion',
      transforms: [sortable],
      props: { className: tableColumnClasses.appVersion },
    },
    {
      title: t('helm-plugin~Description'),
      props: { className: tableColumnClasses.description },
    },
    {
      title: '',
      props: { className: tableColumnClasses.kebab },
    },
  ];
};

export default HelmReleaseHistoryHeader;
