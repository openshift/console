import * as React from 'react';
import { Alert } from '@patternfly/react-core';
import PipelineTopologyGraph from '../pipeline-topology/PipelineTopologyGraph';
import { PipelineTask } from '../../../utils/pipeline-augment';
import { getEdgesFromNodes } from '../pipeline-topology/utils';
import { LoadingBox } from '@console/internal/components/utils';
import { useNodes } from './hooks';
import { PipelineLayout } from '../pipeline-topology/const';

type PipelineBuilderVisualizationProps = {
  namespace: string;
  onUpdateTasks: (updatedTasks: PipelineTask[]) => void;
  pipelineTasks: PipelineTask[];
};

const PipelineBuilderVisualization: React.FC<PipelineBuilderVisualizationProps> = ({
  namespace,
  onUpdateTasks,
  pipelineTasks,
}) => {
  const { tasksLoaded, tasksCount, nodes, loadingTasksError } = useNodes(
    namespace,
    onUpdateTasks,
    pipelineTasks,
  );

  if (loadingTasksError) {
    return (
      <Alert variant="danger" isInline title="Error loading the tasks.">
        {loadingTasksError}
      </Alert>
    );
  }
  if (!tasksLoaded) {
    return <LoadingBox />;
  }
  if (tasksCount === 0) {
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
