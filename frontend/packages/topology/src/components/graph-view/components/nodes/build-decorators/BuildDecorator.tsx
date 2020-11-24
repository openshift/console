import * as React from 'react';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { WorkloadData } from '../../../../../topology-types';
import PipelineRunDecorator from './PipelineRunDecorator';
import BuildConfigDecorator from './BuildConfigDecorator';

interface BuildDecoratorProps {
  resource: K8sResourceKind;
  workloadData: WorkloadData;
  radius: number;
  x: number;
  y: number;
}

const BuildDecorator: React.FC<BuildDecoratorProps> = ({
  resource,
  workloadData,
  radius,
  x,
  y,
}) => {
  const { connectedPipeline } = workloadData;
  if (connectedPipeline.pipeline) {
    return (
      <PipelineRunDecorator
        pipeline={connectedPipeline.pipeline}
        pipelineRuns={connectedPipeline.pipelineRuns}
        radius={radius}
        x={x}
        y={y}
      />
    );
  }

  return <BuildConfigDecorator resource={resource} radius={radius} x={x} y={y} />;
};

export default BuildDecorator;
