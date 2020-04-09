import { sortable } from '@patternfly/react-table';
import { Kebab } from '@console/internal/components/utils';

export const tableColumnClasses = {
  input: Kebab.columnClass,
  revision: 'col-lg-1 col-md-3 col-sm-3 col-xs-3',
  updated: 'col-lg-2 col-md-3 col-sm-5 col-xs-5',
  status: 'col-lg-1 col-md-2 hidden-sm hidden-xs',
  chartName: 'col-lg-2 hidden-md hidden-sm hidden-xs',
  chartVersion: 'col-lg-2 hidden-md hidden-sm hidden-xs',
  appVersion: 'col-lg-2 hidden-md hidden-sm hidden-xs',
  description: 'col-lg-2 hidden-md hidden-sm hidden-xs',
};

const RevisionListHeader = () => {
  return [
    {
      title: '',
      props: { className: tableColumnClasses.input },
    },
    {
      title: 'Revision',
      sortField: 'version',
      sortAsNumber: true,
      transforms: [sortable],
      props: { className: tableColumnClasses.revision },
    },
    {
      title: 'Updated',
      sortField: 'info.last_deployed',
      transforms: [sortable],
      props: { className: tableColumnClasses.updated },
    },
    {
      title: 'Status',
      sortField: 'info.status',
      transforms: [sortable],
      props: { className: tableColumnClasses.status },
    },
    {
      title: 'Chart Name',
      sortField: 'chart.metadata.name',
      transforms: [sortable],
      props: { className: tableColumnClasses.chartName },
    },
    {
      title: 'Chart Version',
      sortField: 'chart.metadata.version',
      transforms: [sortable],
      props: { className: tableColumnClasses.chartVersion },
    },
    {
      title: 'App Version',
      sortField: 'chart.metadata.appVersion',
      transforms: [sortable],
      props: { className: tableColumnClasses.appVersion },
    },
    {
      title: 'Description',
      props: { className: tableColumnClasses.description },
    },
  ];
};

export default RevisionListHeader;
