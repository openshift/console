import { sortable } from '@patternfly/react-table';
import i18next from 'i18next';
import { TektonResourceLabel } from '../../pipelines/const';
import { tableColumnClasses } from './taskruns-table';

const TaskRunsHeader = (showPipelineColumn: boolean = true) => () => {
  return [
    {
      title: i18next.t('pipelines-plugin~Name'),
      sortField: 'metadata.name',
      transforms: [sortable],
      props: { className: tableColumnClasses[0] },
      id: 'name',
    },
    {
      title: i18next.t('pipelines-plugin~Namespace'),
      sortField: 'metadata.namespace',
      transforms: [sortable],
      props: { className: tableColumnClasses[1] },
      id: 'namespace',
    },
    {
      title: i18next.t('pipelines-plugin~Pipeline'),
      sortField: `metadata.labels["${TektonResourceLabel.pipeline}"]`,
      transforms: [sortable],
      props: { className: tableColumnClasses[2] },
      id: 'pipeline',
    },
    {
      title: i18next.t('pipelines-plugin~Task'),
      sortField: `metadata.labels["${TektonResourceLabel.pipelineTask}"]`,
      transforms: [sortable],
      props: { className: tableColumnClasses[3] },
      id: 'task',
    },
    {
      title: i18next.t('pipelines-plugin~Pod'),
      sortField: 'status.podName',
      transforms: [sortable],
      props: { className: tableColumnClasses[4] },
      id: 'pod',
    },
    {
      title: i18next.t('pipelines-plugin~Status'),
      sortField: 'status.conditions[0].reason',
      transforms: [sortable],
      props: { className: tableColumnClasses[5] },
      id: 'status',
    },
    {
      title: i18next.t('pipelines-plugin~Started'),
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
