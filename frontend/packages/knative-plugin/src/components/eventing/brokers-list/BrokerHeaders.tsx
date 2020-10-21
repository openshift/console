import { sortable } from '@patternfly/react-table';
import { Kebab } from '@console/internal/components/utils';

const BrokerHeaders = () => {
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

export default BrokerHeaders;
