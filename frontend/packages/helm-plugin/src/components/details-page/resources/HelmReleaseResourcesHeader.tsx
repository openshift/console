import { sortable } from '@patternfly/react-table';
import i18next from 'i18next';

export const tableColumnClasses = {
  name: '',
  type: '',
  status: 'pf-m-hidden pf-m-visible-on-md',
  created: 'pf-m-hidden pf-m-visible-on-lg',
};

const HelmReleaseResourcesHeader = () => () => {
  return [
    {
      title: i18next.t('helm-plugin~Name'),
      sortField: 'metadata.name',
      transforms: [sortable],
      props: { className: tableColumnClasses.name },
    },
    {
      title: i18next.t('helm-plugin~Type'),
      sortField: 'kind',
      transforms: [sortable],
      props: { className: tableColumnClasses.type },
    },
    {
      title: i18next.t('helm-plugin~Status'),
      sortField: 'status.phase',
      transforms: [sortable],
      props: { className: tableColumnClasses.status },
    },
    {
      title: i18next.t('helm-plugin~Created'),
      sortField: 'metadata.creationTimestamp',
      transforms: [sortable],
      props: { className: tableColumnClasses.created },
    },
  ];
};

export default HelmReleaseResourcesHeader;
