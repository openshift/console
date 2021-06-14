import { sortable } from '@patternfly/react-table';
import { TFunction } from 'i18next';
import { tableColumnClasses } from './subscription-table';

const getSubscriptionHeaders = (t: TFunction, showChannel: boolean) => {
  const SubscriptionHeaders = () => [
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
    ...(showChannel
      ? [
          {
            id: 'channel',
            title: t('knative-plugin~Channel'),
            props: { className: tableColumnClasses[4] },
          },
        ]
      : []),
    {
      id: 'subscriber',
      title: t('knative-plugin~Subscriber'),
      props: { className: tableColumnClasses[5] },
    },
    {
      title: t('knative-plugin~Created'),
      sortField: 'metadata.creationTimestamp',
      transforms: [sortable],
      props: { className: tableColumnClasses[6] },
    },
    {
      title: '',
      props: { className: tableColumnClasses[7] },
    },
  ];
  return SubscriptionHeaders;
};

export default getSubscriptionHeaders;
