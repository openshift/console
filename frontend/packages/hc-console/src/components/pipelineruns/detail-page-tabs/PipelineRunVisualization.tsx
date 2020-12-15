import * as React from 'react';
import { Alert } from '@patternfly/react-core';
import { k8sGet } from '@console/internal/module/k8s';
import { PipelineModel } from '../../../models';
import PipelineVisualization from '../../pipelines/detail-page-tabs/pipeline-details/PipelineVisualization';
import { Pipeline, PipelineRun, pipelineRefExists } from '../../../utils/pipeline-augment';

type PipelineRunVisualizationProps = {
  pipelineRun: PipelineRun;
};

const PipelineRunVisualization: React.FC<PipelineRunVisualizationProps> = ({ pipelineRun }) => {
  const [errorMessage, setErrorMessage] = React.useState<string>(null);
  const [pipeline, setPipeline] = React.useState<Pipeline>(null);

  React.useEffect(() => {
    if (pipelineRefExists(pipelineRun)) {
      k8sGet(PipelineModel, pipelineRun.spec.pipelineRef.name, pipelineRun.metadata.namespace)
        .then((res: Pipeline) => setPipeline(res))
        .catch((error) =>
          setErrorMessage(error?.message || 'Could not load visualization at this time.'),
        );
    }
  }, [pipelineRun, setPipeline]);

  if (errorMessage) {
    return <Alert variant="danger" isInline title={errorMessage} />;
  }

  if (!pipeline || !pipelineRun) {
    return null;
  }

  return <PipelineVisualization pipeline={pipeline} pipelineRun={pipelineRun} />;
};

export default PipelineRunVisualization;
