import { TFunction } from 'i18next';
import { sortable } from '@patternfly/react-table';

export const tableColumnClasses = {
  name: '',
  type: '',
  status: 'pf-m-hidden pf-m-visible-on-md',
  created: 'pf-m-hidden pf-m-visible-on-lg',
};

const HelmReleaseResourcesHeader = (t: TFunction) => () => {
  return [
    {
      title: t('helm-plugin~Name'),
      sortField: 'metadata.name',
      transforms: [sortable],
      props: { className: tableColumnClasses.name },
    },
    {
      title: t('helm-plugin~Type'),
      sortField: 'kind',
      transforms: [sortable],
      props: { className: tableColumnClasses.type },
    },
    {
      title: t('helm-plugin~Status'),
      sortField: 'status.phase',
      transforms: [sortable],
      props: { className: tableColumnClasses.status },
    },
    {
      title: t('helm-plugin~Created'),
      sortField: 'metadata.creationTimestamp',
      transforms: [sortable],
      props: { className: tableColumnClasses.created },
    },
  ];
};

export default HelmReleaseResourcesHeader;
