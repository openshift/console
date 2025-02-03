import { sortable } from '@patternfly/react-table';
import { TFunction } from 'i18next';
import { Kebab } from '@console/internal/components/utils';

export const tableColumnClasses = {
  name: '',
  revision: '',
  updated: '',
  status: 'pf-m-hidden pf-m-visible-on-lg',
  chartName: 'pf-m-hidden pf-m-visible-on-xl',
  chartVersion: 'pf-m-hidden pf-m-visible-on-xl',
  appVersion: 'pf-m-hidden pf-m-visible-on-xl pf-v6-u-w-5-on-xl',
  kebab: Kebab.columnClass,
};

const HelmReleaseListHeader = (t: TFunction) => () => {
  return [
    {
      title: t('helm-plugin~Name'),
      sortField: 'name',
      transforms: [sortable],
      props: { className: tableColumnClasses.name, key: 'name' },
    },
    {
      title: t('helm-plugin~Namespace'),
      sortField: 'namespace',
      transforms: [sortable],
      props: { key: 'namespace' },
      id: 'namespace',
    },
    {
      title: t('helm-plugin~Revision'),
      sortField: 'version',
      transforms: [sortable],
      props: { className: tableColumnClasses.revision, key: 'revision' },
    },
    {
      title: t('helm-plugin~Updated'),
      sortField: 'info.last_deployed',
      transforms: [sortable],
      props: { className: tableColumnClasses.updated, key: 'updated' },
    },
    {
      title: t('helm-plugin~Status'),
      sortField: 'info.status',
      transforms: [sortable],
      props: { className: tableColumnClasses.status, key: 'status' },
    },
    {
      title: t('helm-plugin~Chart name'),
      sortField: 'chart.metadata.name',
      transforms: [sortable],
      props: { className: tableColumnClasses.chartName, key: 'chart-name' },
    },
    {
      title: t('helm-plugin~Chart version'),
      sortField: 'chart.metadata.version',
      transforms: [sortable],
      props: { className: tableColumnClasses.chartVersion, key: 'chart-version' },
    },
    {
      title: t('helm-plugin~App version'),
      sortField: 'chart.metadata.appVersion',
      transforms: [sortable],
      props: { className: tableColumnClasses.appVersion, key: 'app-version' },
    },
    {
      title: '',
      props: { className: tableColumnClasses.kebab, 'aria-label': 'Menu', key: 'kebab-menu' },
    },
  ];
};

export default HelmReleaseListHeader;
