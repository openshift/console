import * as React from 'react';
import { Alert } from '@patternfly/react-core';
import { ModelKind } from '@patternfly/react-topology';
import { useFormikContext } from 'formik';
import { useTranslation } from 'react-i18next';
import { LoadingBox } from '@console/internal/components/utils';
import { PipelineLayout } from '../pipeline-topology/const';
import { builderComponentsFactory } from '../pipeline-topology/factories';
import PipelineTopologyGraph from '../pipeline-topology/PipelineTopologyGraph';
import { getBuilderEdgesFromNodes, nodesHasWhenExpression } from '../pipeline-topology/utils';
import { useNodes } from './hooks';
import {
  PipelineBuilderFormikValues,
  PipelineBuilderTaskResources,
  PipelineBuilderTaskGroup,
  SelectTaskCallback,
  UpdateTasksCallback,
  TaskSearchCallback,
} from './types';
import { getBuilderTasksErrorGroup } from './utils';

type PipelineBuilderVisualizationProps = {
  onTaskSelection: SelectTaskCallback;
  onUpdateTasks: UpdateTasksCallback;
  onTaskSearch: TaskSearchCallback;
  taskGroup: PipelineBuilderTaskGroup;
  taskResources: PipelineBuilderTaskResources;
};

const PipelineBuilderVisualization: React.FC<PipelineBuilderVisualizationProps> = ({
  onTaskSelection,
  onUpdateTasks,
  onTaskSearch,
  taskGroup,
  taskResources,
}) => {
  const { t } = useTranslation();
  const { errors, status } = useFormikContext<PipelineBuilderFormikValues>();
  const nodes = useNodes(
    onTaskSelection,
    onUpdateTasks,
    onTaskSearch,
    taskGroup,
    taskResources,
    getBuilderTasksErrorGroup(errors?.formData, status),
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

  const model = {
    graph: {
      id: 'pipeline-builder',
      type: ModelKind.graph,
      layout: hasWhenExpression
        ? PipelineLayout.DAGRE_BUILDER_SPACED
        : PipelineLayout.DAGRE_BUILDER,
    },
    nodes,
    edges: getBuilderEdgesFromNodes(nodes),
  };

  return (
    <PipelineTopologyGraph
      // TODO: fix this; the graph layout isn't properly laying out nodes
      key={`${nodes.map((n) => n.id).join('-')}${hasWhenExpression ? '-spaced' : ''}`}
      data-test="pipeline-builder"
      builder
      model={model}
      componentFactory={builderComponentsFactory}
    />
  );
};

export default PipelineBuilderVisualization;
