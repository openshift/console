import { sortable } from '@patternfly/react-table';
import { TFunction } from 'i18next';
import { Kebab } from '@console/internal/components/utils';

const EventSourceHeaders = (t: TFunction) => () => {
  return [
    {
      title: t('knative-plugin~Name'),
      sortField: 'metadata.name',
      transforms: [sortable],
    },
    {
      id: 'namespace',
      title: t('knative-plugin~Namespace'),
      sortField: 'metadata.namespace',
      transforms: [sortable],
    },
    {
      id: 'ready',
      title: t('knative-plugin~Ready'),
    },
    {
      id: 'condition',
      title: t('knative-plugin~Conditions'),
    },
    {
      title: t('knative-plugin~Type'),
      sortField: 'kind',
      transforms: [sortable],
    },
    {
      title: t('knative-plugin~Created'),
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
