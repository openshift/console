import { sortable } from '@patternfly/react-table';
import { Kebab } from '@console/internal/components/utils';

const ChannelHeaders = () => {
  return [
    {
      title: 'Name',
      sortField: 'metadata.name',
      transforms: [sortable],
    },
    {
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
      title: 'Subscriptions',
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

export default ChannelHeaders;
