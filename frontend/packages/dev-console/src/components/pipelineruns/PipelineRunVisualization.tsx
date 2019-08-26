import * as React from 'react';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { PipelineVisualizationGraph } from '../pipelines/PipelineVisualizationGraph';
import { getPipelineTasks } from '../../utils/pipeline-utils';
import { useSafeK8s } from '../../utils/safe-k8s-hook';
import { PipelineModel } from '../../models';

export interface PipelineRunVisualizationProps {
  pipelineRun: K8sResourceKind;
}

export interface PipelineVisualizationRunState {
  pipeline: K8sResourceKind;
  errorCode?: number;
}

export const PipelineRunVisualization: React.FC<PipelineRunVisualizationProps> = (props) => {
  const { pipelineRun } = props;
  const [pipeline, setPipeline] = React.useState<K8sResourceKind>({
    apiVersion: '',
    metadata: {},
    kind: 'PipelineRun',
  });
  const [errorCode, setErrorCode] = React.useState(null);
  const { k8sGet } = useSafeK8s();

  React.useEffect(() => {
    k8sGet(PipelineModel, pipelineRun.spec.pipelineRef.name, pipelineRun.metadata.namespace)
      .then((res) => {
        setPipeline(res);
      })
      .catch((error) => setErrorCode(error.response.status));
  }, [k8sGet, pipelineRun.metadata.namespace, pipelineRun.spec.pipelineRef.name]);

  if (errorCode === 404) {
    return null;
  }
  return (
    <PipelineVisualizationGraph
      namespace={pipelineRun.metadata.namespace}
      graph={getPipelineTasks(pipeline, pipelineRun)}
    />
  );
};
