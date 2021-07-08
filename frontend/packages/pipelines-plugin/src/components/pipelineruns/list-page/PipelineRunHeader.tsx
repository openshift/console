import { sortable } from '@patternfly/react-table';
import i18n from 'i18next';
import { tableColumnClasses } from './pipelinerun-table';

const PipelineRunHeader = () => {
  return [
    {
      title: i18n.t('pipelines-plugin~Name'),
      sortField: 'metadata.name',
      transforms: [sortable],
      props: { className: tableColumnClasses[0] },
    },
    {
      title: i18n.t('pipelines-plugin~Namespace'),
      sortField: 'metadata.namespace',
      transforms: [sortable],
      props: { className: tableColumnClasses[1] },
      id: 'namespace',
    },
    {
      title: i18n.t('pipelines-plugin~Status'),
      sortField: 'status.conditions[0].reason',
      transforms: [sortable],
      props: { className: tableColumnClasses[2] },
    },
    {
      title: i18n.t('pipelines-plugin~Task status'),
      sortField: 'status.conditions[0].reason',
      transforms: [sortable],
      props: { className: tableColumnClasses[3] },
    },
    {
      title: i18n.t('pipelines-plugin~Started'),
      sortField: 'status.startTime',
      transforms: [sortable],
      props: { className: tableColumnClasses[4] },
    },
    {
      title: i18n.t('pipelines-plugin~Duration'),
      sortField: 'status.completionTime',
      transforms: [sortable],
      props: { className: tableColumnClasses[5] },
    },
    {
      title: '',
      props: { className: tableColumnClasses[6] },
    },
  ];
};

export default PipelineRunHeader;
