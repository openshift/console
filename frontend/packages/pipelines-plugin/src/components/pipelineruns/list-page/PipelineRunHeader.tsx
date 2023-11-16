import { sortable } from '@patternfly/react-table';
import i18n from 'i18next';
import { tableColumnClasses } from './pipelinerun-table';

const PipelineRunHeader = () => {
  return [
    {
      title: i18n.t('pipelines-plugin~Name'),
      sortField: 'metadata.name',
      transforms: [sortable],
      props: { className: tableColumnClasses.name },
    },
    {
      title: i18n.t('pipelines-plugin~Namespace'),
      sortField: 'metadata.namespace',
      transforms: [sortable],
      props: { className: tableColumnClasses.namespace },
      id: 'namespace',
    },
    {
      title: i18n.t('pipelines-plugin~Vulnerabilities'),
      sortFunc: 'vulnerabilities',
      transforms: [sortable],
      props: { className: tableColumnClasses.vulnerabilities },
    },
    {
      title: i18n.t('pipelines-plugin~Status'),
      sortField: 'status.conditions[0].reason',
      transforms: [sortable],
      props: { className: tableColumnClasses.status },
    },
    {
      title: i18n.t('pipelines-plugin~Task status'),
      sortField: 'status.conditions[0].reason',
      transforms: [sortable],
      props: { className: tableColumnClasses.taskStatus },
    },
    {
      title: i18n.t('pipelines-plugin~Started'),
      sortField: 'status.startTime',
      transforms: [sortable],
      props: { className: tableColumnClasses.started },
    },
    {
      title: i18n.t('pipelines-plugin~Duration'),
      sortField: 'status.completionTime',
      transforms: [sortable],
      props: { className: tableColumnClasses.duration },
    },
    {
      title: '',
      props: { className: tableColumnClasses.actions },
    },
  ];
};

export default PipelineRunHeader;
