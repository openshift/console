import * as React from 'react';
import { referenceForModel } from '@console/internal/module/k8s';
import { ResourceKebab } from '@console/internal/components/utils';
//import { ResourceKebabWithUserLabel } from '../pipelineruns/triggered-by';
import { getPipelineKebabActions } from '../utils/pipeline-actions';
import { Pipeline, PipelineRun } from '../utils/pipeline-augment';
import { PipelineModel } from '../../../models';
import { usePipelineTriggerTemplateNames } from './utils/triggers';

type PipelineRowKebabActionsProps = {
  pipeline: Pipeline;
  pipelineRun?: PipelineRun;
};

const pipelineReference = referenceForModel(PipelineModel);

const PipelineRowKebabActions: React.FC<PipelineRowKebabActionsProps> = ({ pipeline, pipelineRun }) => {
  const {
    metadata: { name, namespace },
  } = pipeline;
  const templateNames = usePipelineTriggerTemplateNames(name, namespace) || [];

  return (
    <ResourceKebab
      actions={getPipelineKebabActions(pipeline.latestRun ?? pipelineRun, templateNames.length > 0)}
      kind={pipelineReference}
      resource={pipeline}
    />
  );
};

export default PipelineRowKebabActions;
