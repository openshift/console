import { sortable } from '@patternfly/react-table';
import i18next from 'i18next';
import { Kebab } from '@console/internal/components/utils';

export const repositoriesTableColumnClasses = [
  'pf-u-w-16-on-xl pf-u-w-25-on-lg pf-u-w-33-on-xs', // name
  'pf-u-w-12-on-xl pf-u-w-20-on-lg pf-u-w-30-on-xs', // namespace
  'pf-u-w-12-on-xl pf-u-w-20-on-lg pf-u-w-30-on-xs', // Event type
  'pf-u-w-12-on-xl pf-u-w-20-on-lg pf-u-w-30-on-xs', // Last run
  'pf-u-w-16-on-xl pf-u-w-25-on-lg pf-u-w-33-on-xs', // Task status
  'pf-m-hidden pf-m-visible-on-xl', // last run status
  'pf-m-hidden pf-u-w-12-on-xl pf-u-w-20-on-lg pf-u-w-33-on-xs pf-m-visible-on-xl', // Last run time
  'pf-m-hidden pf-m-visible-on-xl', // Last run duration
  Kebab.columnClass,
];

const RepositoryHeader = () => {
  return [
    {
      title: i18next.t('pipelines-plugin~Name'),
      sortField: 'metadata.name',
      transforms: [sortable],
      props: { className: repositoriesTableColumnClasses[0] },
    },
    {
      title: i18next.t('pipelines-plugin~Namespace'),
      sortField: 'metadata.namespace',
      transforms: [sortable],
      props: { className: repositoriesTableColumnClasses[1] },
      id: 'namespace',
    },
    {
      title: i18next.t('pipelines-plugin~Event type'),
      sortField: 'spec.event_type',
      transforms: [sortable],
      props: { className: repositoriesTableColumnClasses[2] },
    },
    {
      title: i18next.t('pipelines-plugin~Last run'),
      transforms: [sortable],
      props: { className: repositoriesTableColumnClasses[3] },
    },
    {
      title: i18next.t('pipelines-plugin~Task status'),
      transforms: [sortable],
      props: { className: repositoriesTableColumnClasses[4] },
    },
    {
      title: i18next.t('pipelines-plugin~Last run status'),
      transforms: [sortable],
      props: { className: repositoriesTableColumnClasses[5] },
    },
    {
      title: i18next.t('pipelines-plugin~Last run time'),
      transforms: [sortable],
      props: { className: repositoriesTableColumnClasses[6] },
    },
    {
      title: i18next.t('pipelines-plugin~Last run duration'),
      transforms: [sortable],
      props: { className: repositoriesTableColumnClasses[7] },
    },
    {
      title: '',
      props: { className: repositoriesTableColumnClasses[8] },
    },
  ];
};

export default RepositoryHeader;
