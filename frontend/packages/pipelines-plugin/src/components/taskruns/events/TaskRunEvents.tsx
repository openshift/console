import * as React from 'react';
import { useParams } from 'react-router-dom-v5-compat';
import { ResourcesEventStream } from '@console/internal/components/events';
import { TaskRunKind } from '../../../types';
import { useTaskRunFilters } from '../../pipelineruns/events/event-utils';

type TaskRunEventsProps = {
  obj: TaskRunKind;
};

const TaskRunEvents: React.FC<TaskRunEventsProps> = ({ obj: taskRun }) => {
  const { ns: namespace } = useParams();
  return (
    <ResourcesEventStream filters={useTaskRunFilters(namespace, taskRun)} namespace={namespace} />
  );
};
export default TaskRunEvents;
