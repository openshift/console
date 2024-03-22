import { sortable } from '@patternfly/react-table';
import i18next from 'i18next';
import { tableColumnClasses } from './approval-table';

const ApprovalHeader = () => {
  return [
    {
      title: i18next.t('pipelines-plugin~PipelineRun Name'),
      sortField: 'metadata.name',
      transforms: [sortable],
      props: { className: tableColumnClasses.plrName },
      id: 'plrName',
    },
    {
      title: i18next.t('pipelines-plugin~Approvers'),
      props: { className: tableColumnClasses.approvers },
      id: 'approvers',
    },
    {
      title: i18next.t('pipelines-plugin~Task Name'),
      props: { className: tableColumnClasses.taskName },
      id: 'taskName',
    },
    {
      title: i18next.t('pipelines-plugin~Current Status'),
      props: { className: tableColumnClasses.status },
      transforms: [sortable],
      id: 'status',
    },
    {
      title: i18next.t('pipelines-plugin~Duration'),
      props: { className: tableColumnClasses.duration },
      transforms: [sortable],
      id: 'duration',
    },
    {
      title: '',
      props: { className: tableColumnClasses.actions },
    },
  ];
};

export default ApprovalHeader;
