import { sortable } from '@patternfly/react-table';
import { tableColumnClasses } from './service-table';

const ServiceHeader = () => {
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
      title: 'Generation',
      sortField: 'metadata.generation',
      transforms: [sortable],
      props: { className: tableColumnClasses[3] },
    },
    {
      title: 'Created',
      sortField: 'metadata.creationTimestamp',
      transforms: [sortable],
      props: { className: tableColumnClasses[4] },
    },
    {
      title: 'Conditions',
      props: { className: tableColumnClasses[5] },
    },
    {
      title: 'Ready',
      props: { className: tableColumnClasses[6] },
    },
    {
      title: 'Reason',
      props: { className: tableColumnClasses[7] },
    },
    {
      title: '',
      props: { className: tableColumnClasses[8] },
    },
  ];
};

export default ServiceHeader;
