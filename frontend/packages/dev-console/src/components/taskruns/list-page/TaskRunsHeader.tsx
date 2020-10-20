import { sortable } from '@patternfly/react-table';
import { tableColumnClasses } from './taskruns-table';

const TaskRunsHeader = (showPipelineColumn: boolean = true) => () => {
  return [
    {
      title: 'Name',
      sortField: 'metadata.name',
      transforms: [sortable],
      props: { className: tableColumnClasses[0] },
    },
    {
      title: 'Namespace',
      sortField: 'metadata.namespace',
      transforms: [sortable],
      props: { className: tableColumnClasses[1] },
      id: 'namespace',
    },
    {
      title: 'Pipeline',
      sortField: 'metadata.labels["tekton.dev/pipeline"]',
      transforms: [sortable],
      props: { className: tableColumnClasses[2] },
    },
    {
      title: 'Task',
      sortField: 'spec.taskRef.name',
      transforms: [sortable],
      props: { className: tableColumnClasses[3] },
    },
    {
      title: 'Pod',
      sortField: 'status.podName',
      transforms: [sortable],
      props: { className: tableColumnClasses[4] },
    },
    {
      title: 'Status',
      sortField: 'status.conditions[0].reason',
      transforms: [sortable],
      props: { className: tableColumnClasses[5] },
    },
    {
      title: 'Started',
      sortField: 'status.startTime',
      transforms: [sortable],
      props: { className: tableColumnClasses[6] },
    },
    {
      title: '',
      props: { className: tableColumnClasses[7] },
    },
  ].filter((item) => !(item.title === 'Pipeline' && !showPipelineColumn));
};

export default TaskRunsHeader;
