import { sortable } from '@patternfly/react-table';
import { Kebab } from '@console/internal/components/utils';

const EventSourceHeaders = () => {
  return [
    {
      title: 'Name',
      sortField: 'metadata.name',
      transforms: [sortable],
    },
    {
      id: 'namespace',
      title: 'Namespace',
      sortField: 'metadata.namespace',
      transforms: [sortable],
    },
    {
      title: 'Type',
      sortField: 'kind',
      transforms: [sortable],
    },
    {
      title: 'Created',
      sortField: 'metadata.creationTimestamp',
      transforms: [sortable],
    },
    {
      title: '',
      props: { className: Kebab.columnClass },
    },
  ];
};

export default EventSourceHeaders;
