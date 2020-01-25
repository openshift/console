import { sortable } from '@patternfly/react-table';

export const tableColumnClasses = {
  name: 'col-lg-4 col-md-4 col-sm-4 col-xs-6',
  kind: 'col-lg-2 col-md-2 col-sm-4 col-xs-6',
  status: 'col-lg-2 col-md-3 col-sm-4 hidden-xs',
  timestamp: 'col-lg-4 col-md-4 hidden-sm hidden-xs',
};

const HelmReleaseResourceTableHeader = () => {
  return [
    {
      title: 'Name',
      sortField: 'metadata.name',
      transforms: [sortable],
      props: { className: tableColumnClasses.name },
    },
    {
      title: 'Kind',
      sortField: 'kind',
      transforms: [sortable],
      props: { className: tableColumnClasses.kind },
    },
    {
      title: 'Status',
      sortField: 'status.phase',
      transforms: [sortable],
      props: { className: tableColumnClasses.status },
    },
    {
      title: 'Timestamp',
      sortField: 'metadata.creationTimestamp',
      transforms: [sortable],
      props: { className: tableColumnClasses.timestamp },
    },
  ];
};

export default HelmReleaseResourceTableHeader;
