import { sortable } from '@patternfly/react-table';
import i18n from 'i18next';
import { Kebab } from '@console/internal/components/utils';
import { RepositoryLabels, RepositoryFields } from './consts';

export const tableColumnClasses = [
  'pf-u-w-16-on-lg pf-u-w-25-on-md',
  'pf-m-u-w-16-on-md pf-m-u-w-8-on-lg',
  'pf-u-w-16-on-md',
  'pf-m-hidden pf-m-visible-on-md pf-u-w-8-on-xl',
  'pf-m-hidden pf-m-visible-on-lg pf-u-w-25-on-lg',
  'pf-m-hidden pf-m-visible-on-lg',
  'pf-m-hidden pf-m-visible-on-xl',
  'pf-m-hidden pf-m-visible-on-xl pf-m-u-8-on-xl',
  Kebab.columnClass,
];

const RepositoryPipelineRunHeader = () => {
  return [
    {
      title: i18n.t('pipelines-plugin~Name'),
      sortField: 'metadata.name',
      transforms: [sortable],
      props: { className: tableColumnClasses[0] },
    },
    {
      title: i18n.t('pipelines-plugin~Commit id'),
      sortField: `metadata.labels.${RepositoryLabels[RepositoryFields.SHA]}`,
      transforms: [sortable],
      props: { className: tableColumnClasses[1] },
    },
    {
      title: i18n.t('pipelines-plugin~Namespace'),
      sortField: 'metadata.namespace',
      transforms: [sortable],
      props: { className: tableColumnClasses[2] },
      id: 'namespace',
    },
    {
      title: i18n.t('pipelines-plugin~Status'),
      sortField: 'status.conditions[0].reason',
      transforms: [sortable],
      props: { className: tableColumnClasses[3] },
    },
    {
      title: i18n.t('pipelines-plugin~Task status'),
      sortField: 'status.conditions[0].reason',
      transforms: [sortable],
      props: { className: tableColumnClasses[4] },
    },
    {
      title: i18n.t('pipelines-plugin~Started'),
      sortField: 'status.startTime',
      transforms: [sortable],
      props: { className: tableColumnClasses[5] },
    },
    {
      title: i18n.t('pipelines-plugin~Duration'),
      sortField: 'status.completionTime',
      transforms: [sortable],
      props: { className: tableColumnClasses[6] },
    },
    {
      title: i18n.t('pipelines-plugin~Branch'),
      sortField: `metadata.labels.${RepositoryLabels[RepositoryFields.BRANCH]}`,
      transforms: [sortable],
      props: { className: tableColumnClasses[7] },
    },
    {
      title: '',
      props: { className: tableColumnClasses[8] },
    },
  ];
};

export default RepositoryPipelineRunHeader;
