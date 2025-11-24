import * as React from 'react';
import { css } from '@patternfly/react-styles';
import { ComponentFactory, Model } from '@patternfly/react-topology';
import PipelineVisualizationSurface from './PipelineVisualizationSurface';

import './PipelineTopologyGraph.scss';

type PipelineTopologyGraphProps = {
  builder?: boolean;
  model: Model;
  componentFactory: ComponentFactory;
  showControlBar?: boolean;
};

const PipelineTopologyGraph: React.FC<PipelineTopologyGraphProps> = ({
  builder,
  model,
  componentFactory,
  ...props
}) => {
  return (
    <div
      className={css('odc-pipeline-topology-graph', { builder })}
      data-test={props['data-test'] || 'pipeline-topology-graph'}
    >
      <PipelineVisualizationSurface
        model={model}
        componentFactory={componentFactory}
        noScrollbar={builder}
        {...props}
      />
    </div>
  );
};

export default React.memo(PipelineTopologyGraph);
