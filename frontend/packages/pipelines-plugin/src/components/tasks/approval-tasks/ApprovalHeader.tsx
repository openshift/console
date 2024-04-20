import { sortable } from '@patternfly/react-table';
import i18next from 'i18next';
import { tableColumnClasses } from './approval-table';

const ApprovalHeader = () => {
  return [
    {
      title: i18next.t('pipelines-plugin~PipelineRun name'),
      sortFunc: 'plrName',
      transforms: [sortable],
      props: { className: tableColumnClasses.plrName },
      id: 'plrName',
    },
    {
      title: i18next.t('pipelines-plugin~TaskRun name'),
      props: { className: tableColumnClasses.taskRunName },
      sortField: 'metadata.name',
      transforms: [sortable],
      id: 'taskRunName',
    },
    {
      title: i18next.t('pipelines-plugin~Current status'),
      props: { className: tableColumnClasses.status },
      id: 'status',
    },
    {
      title: i18next.t('pipelines-plugin~Description'),
      props: { className: tableColumnClasses.description },
      id: 'description',
    },
    {
      title: i18next.t('pipelines-plugin~Started'),
      props: { className: tableColumnClasses.startTime },
      sortField: 'metadata.creationTimestamp',
      transforms: [sortable],
      id: 'startTime',
    },
    {
      title: '',
      props: { className: tableColumnClasses.actions },
    },
  ];
};

export default ApprovalHeader;
