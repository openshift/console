import * as React from 'react';
import { Node } from '@patternfly/react-topology';
import PipelineRunDecorator from './PipelineRunDecorator';

export const getPipelineRunDecorator = (element: Node, radius: number, x: number, y: number) => {
  const overviewItem = element.getData()?.resources;
  const { pipelines, pipelineRuns } = overviewItem || {};
  if (!pipelineRuns) {
    return null;
  }

  return (
    <PipelineRunDecorator
      key="pipeline-run"
      radius={radius}
      x={x}
      y={y}
      pipeline={pipelines[0]}
      pipelineRuns={pipelineRuns}
    />
  );
};
