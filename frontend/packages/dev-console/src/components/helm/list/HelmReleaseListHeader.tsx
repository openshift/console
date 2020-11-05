import i18n from '@console/internal/i18n';
import { sortable } from '@patternfly/react-table';
import { Kebab } from '@console/internal/components/utils';

export const tableColumnClasses = {
  name: 'col-lg-2 col-md-4 col-sm-4 col-xs-4',
  revision: 'col-lg-2 col-md-3 col-sm-3 col-xs-3',
  updated: 'col-lg-2 col-md-3 col-sm-5 col-xs-5',
  status: 'col-lg-1 col-md-2 hidden-sm hidden-xs',
  chartName: 'col-lg-2 hidden-md hidden-sm hidden-xs',
  chartVersion: 'col-lg-2 hidden-md hidden-sm hidden-xs',
  appVersion: 'col-lg-1 hidden-md hidden-sm hidden-xs',
  kebab: Kebab.columnClass,
};

const HelmReleaseListHeader = () => {
  return [
    {
      title: i18n.t('devconsole~Name'),
      sortField: 'name',
      transforms: [sortable],
      props: { className: tableColumnClasses.name },
    },
    {
      title: i18n.t('devconsole~Revision'),
      sortField: 'version',
      transforms: [sortable],
      props: { className: tableColumnClasses.revision },
    },
    {
      title: i18n.t('devconsole~Updated'),
      sortField: 'info.last_deployed',
      transforms: [sortable],
      props: { className: tableColumnClasses.updated },
    },
    {
      title: i18n.t('devconsole~Status'),
      sortField: 'info.status',
      transforms: [sortable],
      props: { className: tableColumnClasses.status },
    },
    {
      title: i18n.t('devconsole~Chart Name'),
      sortField: 'chart.metadata.name',
      transforms: [sortable],
      props: { className: tableColumnClasses.chartName },
    },
    {
      title: i18n.t('devconsole~Chart Version'),
      sortField: 'chart.metadata.version',
      transforms: [sortable],
      props: { className: tableColumnClasses.chartVersion },
    },
    {
      title: i18n.t('devconsole~App Version'),
      sortField: 'chart.metadata.appVersion',
      transforms: [sortable],
      props: { className: tableColumnClasses.appVersion },
    },
    {
      title: '',
      props: { className: tableColumnClasses.kebab },
    },
  ];
};

export default HelmReleaseListHeader;
