import { sortable } from '@patternfly/react-table';
import { tableColumnClasses } from './taskruns-table';

const TaskRunsHeader = () => {
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
    },
    {
      title: 'Status',
      sortField: 'status.conditions[0].reason',
      transforms: [sortable],
      props: { className: tableColumnClasses[2] },
    },
    {
      title: 'Started',
      sortField: 'status.startTime',
      transforms: [sortable],
      props: { className: tableColumnClasses[3] },
    },
    {
      title: 'Duration',
      sortField: 'status.completionTime',
      transforms: [sortable],
      props: { className: tableColumnClasses[4] },
    },
    {
      title: '',
      props: { className: tableColumnClasses[5] },
    },
  ];
};

export default TaskRunsHeader;
