import * as React from 'react';
import { Alert } from '@patternfly/react-core';
import { useFormikContext } from 'formik';
import { useTranslation } from 'react-i18next';
import { LoadingBox } from '@console/internal/components/utils';
import { PipelineLayout } from '../pipeline-topology/const';
import PipelineTopologyGraph from '../pipeline-topology/PipelineTopologyGraph';
import { getEdgesFromNodes, nodesHasWhenExpression } from '../pipeline-topology/utils';
import { useNodes } from './hooks';
import {
  PipelineBuilderFormikValues,
  PipelineBuilderTaskResources,
  PipelineBuilderTaskGroup,
  SelectTaskCallback,
  UpdateTasksCallback,
} from './types';
import { getBuilderTasksErrorGroup } from './utils';

type PipelineBuilderVisualizationProps = {
  onTaskSelection: SelectTaskCallback;
  onUpdateTasks: UpdateTasksCallback;
  taskGroup: PipelineBuilderTaskGroup;
  taskResources: PipelineBuilderTaskResources;
};

const PipelineBuilderVisualization: React.FC<PipelineBuilderVisualizationProps> = ({
  onTaskSelection,
  onUpdateTasks,
  taskGroup,
  taskResources,
}) => {
  const { t } = useTranslation();
  const { errors, status } = useFormikContext<PipelineBuilderFormikValues>();
  const nodes = useNodes(
    onTaskSelection,
    onUpdateTasks,
    taskGroup,
    taskResources,
    getBuilderTasksErrorGroup(errors?.formData),
  );
  const taskCount = taskResources.namespacedTasks.length + taskResources.clusterTasks.length;
  const hasWhenExpression = nodesHasWhenExpression(nodes);

  if (status?.taskLoadingError) {
    return (
      <Alert variant="danger" isInline title={t('pipelines-plugin~Error loading the tasks.')}>
        {status.taskLoadingError}
      </Alert>
    );
  }
  if (!taskResources.tasksLoaded) {
    return <LoadingBox />;
  }
  if (taskCount === 0 && taskGroup.tasks.length === 0) {
    // No tasks, nothing we can do here...
    return (
      <Alert variant="danger" isInline title={t('pipelines-plugin~Unable to locate any tasks.')} />
    );
  }

  return (
    <PipelineTopologyGraph
      // TODO: fix this; the graph layout isn't properly laying out nodes
      key={`${nodes.map((n) => n.id).join('-')}${hasWhenExpression ? '-spaced' : ''}`}
      id="pipeline-builder"
      data-test="pipeline-builder"
      fluid
      nodes={nodes}
      edges={getEdgesFromNodes(nodes)}
      layout={
        hasWhenExpression ? PipelineLayout.DAGRE_BUILDER_SPACED : PipelineLayout.DAGRE_BUILDER
      }
    />
  );
};

export default PipelineBuilderVisualization;
