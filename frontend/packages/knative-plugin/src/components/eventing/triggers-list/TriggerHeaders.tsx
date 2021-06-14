import { sortable } from '@patternfly/react-table';
import { TFunction } from 'i18next';
import { tableColumnClasses } from './trigger-table';

const getTriggerHeaders = (t: TFunction, showBroker: boolean) => {
  const TriggerHeaders = () => [
    {
      id: 'name',
      title: t('knative-plugin~Name'),
      sortField: 'metadata.name',
      transforms: [sortable],
      props: { className: tableColumnClasses[0] },
    },
    {
      id: 'namespace',
      title: t('knative-plugin~Namespace'),
      sortField: 'metadata.namespace',
      transforms: [sortable],
      props: { className: tableColumnClasses[1] },
    },
    {
      id: 'ready',
      title: t('knative-plugin~Ready'),
      props: { className: tableColumnClasses[2] },
    },
    {
      id: 'condition',
      title: t('knative-plugin~Conditions'),
      props: { className: tableColumnClasses[3] },
    },
    {
      id: 'filters',
      title: t('knative-plugin~Filters'),
      props: { className: tableColumnClasses[4] },
    },
    ...(showBroker
      ? [
          {
            id: 'broker',
            title: t('knative-plugin~Broker'),
            props: { className: tableColumnClasses[5] },
          },
        ]
      : []),
    {
      id: 'subscriber',
      title: t('knative-plugin~Subscriber'),
      props: { className: tableColumnClasses[6] },
    },
    {
      title: t('knative-plugin~Created'),
      sortField: 'metadata.creationTimestamp',
      transforms: [sortable],
      props: { className: tableColumnClasses[7] },
    },
    {
      title: '',
      props: { className: tableColumnClasses[8] },
    },
  ];
  return TriggerHeaders;
};

export default getTriggerHeaders;
