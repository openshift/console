import * as React from 'react';
import { ComponentFactory, Model } from '@patternfly/react-topology';
import PipelineVisualizationSurface from './PipelineVisualizationSurface';

import './PipelineTopologyGraph.scss';

type PipelineTopologyGraphProps = {
  fluid?: boolean;
  model: Model;
  componentFactory: ComponentFactory;
  showControlBar?: boolean;
};

const PipelineTopologyGraph: React.FC<PipelineTopologyGraphProps> = ({
  fluid,
  model,
  componentFactory,
  ...props
}) => {
  return (
    <div
      className="odc-pipeline-topology-graph"
      data-test={props['data-test'] || 'pipeline-topology-graph'}
      style={{ display: fluid ? 'block' : undefined }}
    >
      <PipelineVisualizationSurface model={model} componentFactory={componentFactory} {...props} />
    </div>
  );
};

export default React.memo(PipelineTopologyGraph);
