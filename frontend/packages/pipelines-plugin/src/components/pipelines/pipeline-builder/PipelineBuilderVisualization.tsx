import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Alert } from '@patternfly/react-core';
import { LoadingBox } from '@console/internal/components/utils';
import { hasInlineTaskSpec } from '../../../utils/pipeline-utils';
import { PipelineLayout } from '../pipeline-topology/const';
import PipelineTopologyGraph from '../pipeline-topology/PipelineTopologyGraph';
import { getEdgesFromNodes } from '../pipeline-topology/utils';
import { useNodes } from './hooks';
import {
  PipelineBuilderTaskGroup,
  SelectTaskCallback,
  TaskErrorMap,
  UpdateTasksCallback,
} from './types';

type PipelineBuilderVisualizationProps = {
  namespace: string;
  onTaskSelection: SelectTaskCallback;
  onUpdateTasks: UpdateTasksCallback;
  taskGroup: PipelineBuilderTaskGroup;
  tasksInError: TaskErrorMap;
};

const PipelineBuilderVisualization: React.FC<PipelineBuilderVisualizationProps> = ({
  namespace,
  onTaskSelection,
  onUpdateTasks,
  taskGroup,
  tasksInError,
}) => {
  const { t } = useTranslation();
  const { tasksLoaded, tasksCount, nodes, loadingTasksError } = useNodes(
    namespace,
    onTaskSelection,
    onUpdateTasks,
    taskGroup,
    tasksInError,
  );

  if (loadingTasksError) {
    return (
      <Alert variant="danger" isInline title={t('pipelines-plugin~Error loading the tasks.')}>
        {loadingTasksError}
      </Alert>
    );
  }
  if (!tasksLoaded) {
    return <LoadingBox />;
  }
  if (tasksCount === 0 && taskGroup.tasks.length === 0) {
    // No tasks, nothing we can do here...
    return (
      <Alert variant="danger" isInline title={t('pipelines-plugin~Unable to locate any tasks.')} />
    );
  }

  if (hasInlineTaskSpec(taskGroup.tasks)) {
    return (
      <Alert
        variant="info"
        isInline
        title={t(
          'pipelines-plugin~This Pipeline cannot be visualized. Pipeline taskSpec is not supported.',
        )}
      />
    );
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
