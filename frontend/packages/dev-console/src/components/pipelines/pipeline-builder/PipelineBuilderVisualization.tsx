import * as React from 'react';
import { Alert } from '@patternfly/react-core';
import { LoadingBox } from '@console/internal/components/utils';
import { PipelineLayout } from '../pipeline-topology/const';
import PipelineTopologyGraph from '../pipeline-topology/PipelineTopologyGraph';
import { getEdgesFromNodes } from '../pipeline-topology/utils';
import { useNodes } from './hooks';
import {
  PipelineBuilderTaskGroup,
  ResourceTaskStatus,
  SelectTaskCallback,
  TaskErrorList,
  UpdateTasksCallback,
} from './types';

type PipelineBuilderVisualizationProps = {
  namespace: string;
  onTaskSelection: SelectTaskCallback;
  onUpdateTasks: UpdateTasksCallback;
  taskGroup: PipelineBuilderTaskGroup;
  tasksInError: TaskErrorList;
  resourceTasks: ResourceTaskStatus;
};

const PipelineBuilderVisualization: React.FC<PipelineBuilderVisualizationProps> = ({
  namespace,
  onTaskSelection,
  onUpdateTasks,
  taskGroup,
  tasksInError,
  resourceTasks,
}) => {
  const nodes = useNodes(
    namespace,
    onTaskSelection,
    onUpdateTasks,
    taskGroup,
    tasksInError,
    resourceTasks,
  );

  const { clusterTasks, namespacedTasks, errorMsg } = resourceTasks;
  const localTaskCount = namespacedTasks?.length || 0;
  const clusterTaskCount = clusterTasks?.length || 0;
  const tasksCount = localTaskCount + clusterTaskCount;
  const tasksLoaded = !!namespacedTasks && !!clusterTasks;

  if (errorMsg) {
    return (
      <Alert variant="danger" isInline title="Error loading the tasks.">
        {errorMsg}
      </Alert>
    );
  }
  if (!tasksLoaded) {
    return <LoadingBox />;
  }
  if (tasksCount === 0 && taskGroup.tasks.length === 0) {
    // No tasks, nothing we can do here...
    return <Alert variant="danger" isInline title="Unable to locate any tasks." />;
  }

  return (
    <PipelineTopologyGraph
      // TODO: fix this; the graph layout isn't properly laying out nodes
      key={nodes.map((n) => n.id).join('-')}
      id="pipeline-builder"
      fluid
      nodes={nodes}
      edges={getEdgesFromNodes(nodes)}
      layout={PipelineLayout.DAGRE_BUILDER}
    />
  );
};

export default PipelineBuilderVisualization;
