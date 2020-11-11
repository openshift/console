import * as React from 'react';
import { match as RMatch } from 'react-router';
import { ResourcesEventStream } from '@console/internal/components/events';
import { TaskRunKind } from '../../../utils/pipeline-augment';
import { useTaskRunFilters } from '../../pipelineruns/events/event-utils';

type TaskRunEventsProps = {
  obj: TaskRunKind;
  match: RMatch<{
    ns?: string;
  }>;
};

const TaskRunEvents: React.FC<TaskRunEventsProps> = ({
  obj: taskRun,
  match: {
    params: { ns: namespace },
  },
}) => (
  <ResourcesEventStream filters={useTaskRunFilters(namespace, taskRun)} namespace={namespace} />
);
export default TaskRunEvents;
