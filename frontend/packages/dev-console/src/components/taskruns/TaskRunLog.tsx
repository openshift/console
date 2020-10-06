import * as React from 'react';
import { Firehose } from '@console/internal/components/utils';
import { StatusBox } from '@console/internal/components/utils/status-box';
import { PodModel } from '@console/internal/models';
import LogsWrapperComponent from '../pipelineruns/logs/LogsWrapperComponent';
import { TaskRunKind } from '../../utils/pipeline-augment';
import './TaskRunLog.scss';

export type TaskRunLogProps = {
  obj: TaskRunKind;
};

const TaskRunLog: React.FC<TaskRunLogProps> = ({ obj }) => {
  if (obj?.status?.podName) {
    const podResources = [
      {
        kind: PodModel.kind,
        isList: false,
        prop: `obj`,
        namespace: obj.metadata.namespace,
        name: obj.status.podName,
      },
    ];
    return (
      <div className="odc-task-run-log">
        <Firehose resources={podResources}>
          <LogsWrapperComponent
            taskName={obj.metadata.name}
            downloadAllLabel="Download All TaskRun Logs"
          />
        </Firehose>
      </div>
    );
  }
  return <StatusBox loadError="Pod not found" label="TaskRun Log" />;
};

export default TaskRunLog;
