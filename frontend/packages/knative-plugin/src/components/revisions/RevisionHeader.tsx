import { sortable } from '@patternfly/react-table';
import { TFunction } from 'i18next';
import { tableColumnClasses } from './revision-table';

const RevisionHeader = (t: TFunction) => () => {
  return [
    {
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
      title: t('knative-plugin~Service'),
      sortField: 'metadata.labels["serving.knative.dev/service"]',
      transforms: [sortable],
      props: { className: tableColumnClasses[2] },
    },
    {
      title: t('knative-plugin~Created'),
      sortField: 'metadata.creationTimestamp',
      transforms: [sortable],
      props: { className: tableColumnClasses[3] },
    },
    {
      title: t('knative-plugin~Conditions'),
      props: { className: tableColumnClasses[4] },
    },
    {
      title: t('knative-plugin~Ready'),
      props: { className: tableColumnClasses[5] },
    },
    {
      title: t('knative-plugin~Reason'),
      props: { className: tableColumnClasses[6] },
    },
    {
      title: '',
      props: { className: tableColumnClasses[7] },
    },
  ];
};

export default RevisionHeader;
