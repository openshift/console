import i18n from '@console/internal/i18n';
import { sortable } from '@patternfly/react-table';
import { tableColumnClasses } from './taskruns-table';

const TaskRunsHeader = (showPipelineColumn: boolean = true) => () => {
  return [
    {
      title: i18n.t('devconsole~Name'),
      sortField: 'metadata.name',
      transforms: [sortable],
      props: { className: tableColumnClasses[0] },
      id: 'name',
    },
    {
      title: i18n.t('devconsole~Namespace'),
      sortField: 'metadata.namespace',
      transforms: [sortable],
      props: { className: tableColumnClasses[1] },
      id: 'namespace',
    },
    {
      title: i18n.t('devconsole~Pipeline'),
      sortField: 'metadata.labels["tekton.dev/pipeline"]',
      transforms: [sortable],
      props: { className: tableColumnClasses[2] },
      id: 'pipeline',
    },
    {
      title: i18n.t('devconsole~Task'),
      sortField: 'spec.taskRef.name',
      transforms: [sortable],
      props: { className: tableColumnClasses[3] },
      id: 'task',
    },
    {
      title: i18n.t('devconsole~Pod'),
      sortField: 'status.podName',
      transforms: [sortable],
      props: { className: tableColumnClasses[4] },
      id: 'pod',
    },
    {
      title: i18n.t('devconsole~Status'),
      sortField: 'status.conditions[0].reason',
      transforms: [sortable],
      props: { className: tableColumnClasses[5] },
      id: 'status',
    },
    {
      title: i18n.t('devconsole~Started'),
      sortField: 'status.startTime',
      transforms: [sortable],
      props: { className: tableColumnClasses[6] },
      id: 'started',
    },
    {
      title: '',
      props: { className: tableColumnClasses[7] },
    },
  ].filter((item) => !(item.id === 'pipeline' && !showPipelineColumn));
};

export default TaskRunsHeader;
