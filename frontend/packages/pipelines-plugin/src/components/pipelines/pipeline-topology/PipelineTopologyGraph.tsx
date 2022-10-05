import * as React from 'react';
import { ComponentFactory, Model } from '@patternfly/react-topology';
import * as cx from 'classnames';
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
      className={cx('odc-pipeline-topology-graph', { builder })}
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
