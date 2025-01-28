import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { StatusBox } from '@console/internal/components/utils/status-box';
import { PodModel } from '@console/internal/models';
import { TaskRunKind } from '../../types';
import LogsWrapperComponent from '../pipelineruns/logs/LogsWrapperComponent';
import './TaskRunLog.scss';
import { TektonResourceLabel } from '../pipelines/const';

export type TaskRunLogProps = {
  obj: TaskRunKind;
};

const TaskRunLog: React.FC<TaskRunLogProps> = ({ obj }) => {
  const { t } = useTranslation();
  if (obj?.status?.podName) {
    const podResources = {
      kind: PodModel.kind,
      isList: false,
      prop: `obj`,
      namespace: obj.metadata.namespace,
      name: obj.status.podName,
    };
    return (
      <div className="odc-task-run-log">
        <LogsWrapperComponent
          taskRun={obj}
          taskName={obj?.metadata?.labels?.[TektonResourceLabel.pipelineTask] || ''}
          resource={podResources}
          downloadAllLabel={t('pipelines-plugin~Download all TaskRun logs')}
        />
      </div>
    );
  }
  return (
    <StatusBox
      label={t('pipelines-plugin~TaskRun log')}
      loadError={new Error(t('pipelines-plugin~Pod not found'))}
    />
  );
};

export default TaskRunLog;
