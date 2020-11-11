import * as React from 'react';
import { SectionHeading, ResourceSummary, ResourceLink } from '@console/internal/components/utils';
import { PodModel } from '@console/internal/models';
import { Status } from '@console/shared';
import { taskRunFilterReducer } from '../../utils/pipeline-filter-reducer';
import RunDetailsErrorLog from '../pipelineruns/logs/RunDetailsErrorLog';
import { TaskRunModel } from '../../models';
import { getTRLogSnippet } from './logs/taskRunLogSnippet';
import { TaskRunKind } from '../../utils/pipeline-augment';
import './TaskRunDetails.scss';

export interface TaskRunDetailsProps {
  obj: TaskRunKind;
}

const TaskRunDetails: React.FC<TaskRunDetailsProps> = ({ obj: taskRun }) => {
  return (
    <div className="co-m-pane__body">
      <SectionHeading text={`${TaskRunModel.label} Details`} />
      <div className="row">
        <div className="col-sm-6">
          <ResourceSummary resource={taskRun} />
        </div>
        <div className="col-sm-6 odc-taskrun-details__status">
          <dl>
            <dt>Status</dt>
            <dd>
              <Status status={taskRunFilterReducer(taskRun)} />
            </dd>
          </dl>
          <RunDetailsErrorLog
            logDetails={getTRLogSnippet(taskRun)}
            namespace={taskRun.metadata?.namespace}
          />
          {taskRun?.status?.podName && (
            <dl>
              <dt>Pod</dt>
              <dd>
                <ResourceLink
                  kind={PodModel.kind}
                  name={taskRun.status.podName}
                  namespace={taskRun.metadata.namespace}
                />
              </dd>
            </dl>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskRunDetails;
