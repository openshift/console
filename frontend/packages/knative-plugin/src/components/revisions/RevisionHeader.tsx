import { sortable } from '@patternfly/react-table';
import { tableColumnClasses } from './revision-table';

const RevisionHeader = () => {
  return [
    {
      title: 'Name',
      sortField: 'metadata.name',
      transforms: [sortable],
      props: { className: tableColumnClasses[0] },
    },
    {
      id: 'namesoace',
      title: 'Namespace',
      sortField: 'metadata.namespace',
      transforms: [sortable],
      props: { className: tableColumnClasses[1] },
    },
    {
      title: 'Service',
      sortField: 'metadata.labels["serving.knative.dev/service"]',
      transforms: [sortable],
      props: { className: tableColumnClasses[2] },
    },
    {
      title: 'Created',
      sortField: 'metadata.creationTimestamp',
      transforms: [sortable],
      props: { className: tableColumnClasses[3] },
    },
    {
      title: 'Conditions',
      props: { className: tableColumnClasses[4] },
    },
    {
      title: 'Ready',
      props: { className: tableColumnClasses[5] },
    },
    {
      title: 'Reason',
      props: { className: tableColumnClasses[6] },
    },
    {
      title: '',
      props: { className: tableColumnClasses[7] },
    },
  ];
};

export default RevisionHeader;
