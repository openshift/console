import * as React from 'react';
import * as _ from 'lodash';
import { Model, Visualization, VisualizationSurface } from '@console/topology';
import { Pipeline, PipelineRun } from '../../../../../utils/pipeline-augment';
import {
  getPipelineTasks,
  PipelineVisualizationTaskItem,
} from '../../../../../utils/pipeline-utils';
import { componentFactory, layoutFactory } from './factories';
import { tasksToNodes } from './utils';
import { PipelineEdgeModel, PipelineNodeModel } from './types';

const PipelineVisualizationSurface: React.FC<{ model: Model }> = ({ model }) => {
  const [vis, setVis] = React.useState(null);
  React.useEffect(() => {
    if (vis === null) {
      const visualization = new Visualization();
      visualization.registerLayoutFactory(layoutFactory);
      visualization.registerComponentFactory(componentFactory);
      visualization.fromModel(model);
      setVis(visualization);
    } else {
      vis.fromModel(model);
    }
  }, [vis, model]);

  if (!vis) return null;

  return <VisualizationSurface visualization={vis} />;
};

interface PipelineTopologyVisualizationProps {
  pipeline: Pipeline;
  pipelineRun?: PipelineRun;
}

const PipelineTopologyVisualization: React.FC<PipelineTopologyVisualizationProps> = ({
  pipeline,
  pipelineRun,
}) => {
  const taskList: PipelineVisualizationTaskItem[] = _.flatten(
    getPipelineTasks(pipeline, pipelineRun),
  );
  const nodes: PipelineNodeModel[] = tasksToNodes(taskList, pipeline, pipelineRun);

  const edges: PipelineEdgeModel[] = _.flatten(
    nodes
      .map((node) => {
        const {
          data: {
            task: { name, runAfter = [] },
          },
        } = node;

        if (runAfter.length === 0) return null;

        return runAfter.map((beforeName) => ({
          id: `${name}-to-${beforeName}`,
          type: 'edge',
          source: beforeName,
          target: name,
        }));
      })
      .filter((edgeList) => !!edgeList),
  );

  if (edges.length === 0 && nodes.length === 0) return null;

  return (
    <div
      style={{
        background: '#eee',
        borderRadius: 20,
        fontSize: 12,
        marginBottom: 20,
        overflow: 'hidden',
        padding: `20px 36px`,
      }}
    >
      <PipelineVisualizationSurface
        model={{
          graph: {
            id: _.get(pipelineRun, 'metadata.name', pipeline.metadata.name),
            type: 'graph',
            layout: 'Dagre',
          },
          nodes,
          edges,
        }}
      />
    </div>
  );
};

export default PipelineTopologyVisualization;
