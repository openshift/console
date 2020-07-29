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
      title: 'Namespace',
      sortField: 'metadata.namespace',
      transforms: [sortable],
      props: { className: tableColumnClasses[1] },
      id: 'namespace',
    },
    {
      title: 'Last Run',
      sortField: 'latestRun.metadata.name',
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
      title: 'Last Run Status',
      sortField: 'latestRun.status.succeededCondition',
      transforms: [sortable],
      props: { className: tableColumnClasses[4] },
    },
    {
      title: 'Last Run Time',
      sortField: 'latestRun.status.completionTime',
      transforms: [sortable],
      props: { className: tableColumnClasses[5] },
    },
    {
      title: '',
      props: { className: tableColumnClasses[6] },
    },
  ];
};

export default PipelineHeader;
