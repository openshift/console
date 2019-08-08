import { sortable } from '@patternfly/react-table';
import { tableColumnClasses } from './pipeline-table';

const PipelineHeader = () => {
  return [
    {
      title: 'Name',
      sortField: 'metadata.name',
      transforms: [sortable],
      props: { className: tableColumnClasses[0] },
    },
    {
      title: 'Last Run',
      sortField: 'lastRun.metadata.name',
      transforms: [sortable],
      props: { className: tableColumnClasses[1] },
    },
    {
      title: 'Last Run Status',
      sortField: 'latestRun.status.succeededCondition',
      transforms: [sortable],
      props: { className: tableColumnClasses[2] },
    },
    {
      title: 'Task Status',
      sortField: 'latestRun.status.succeededCondition',
      transforms: [sortable],
      props: { className: tableColumnClasses[3] },
    },
    {
      title: 'Last Run Time',
      sortField: 'latestRun.status.completionTime',
      transforms: [sortable],
      props: { className: tableColumnClasses[4] },
    },
    {
      title: '',
      props: { className: tableColumnClasses[5] },
    },
  ];
};

export default PipelineHeader;
