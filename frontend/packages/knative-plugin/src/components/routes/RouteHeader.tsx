import { sortable } from '@patternfly/react-table';
import { tableColumnClasses } from './route-table';

const RouteHeader = () => {
  return [
    {
      title: 'Name',
      sortField: 'metadata.name',
      transforms: [sortable],
      props: { className: tableColumnClasses[0] },
    },
    {
      title: 'Namespace',
      sortField: 'metadata.namespace',
      transforms: [sortable],
      props: { className: tableColumnClasses[1] },
    },
    {
      title: 'URL',
      sortField: 'status.url',
      transforms: [sortable],
      props: { className: tableColumnClasses[2] },
    },
    {
      title: 'Age',
      sortField: 'metadata.creationTimestamp',
      transforms: [sortable],
      props: { className: tableColumnClasses[3] },
    },
    {
      title: 'Conditions',
      props: { className: tableColumnClasses[4] },
    },
    {
      title: 'Traffic',
      props: { className: tableColumnClasses[5] },
    },
    {
      title: '',
      props: { className: tableColumnClasses[6] },
    },
  ];
};

export default RouteHeader;
