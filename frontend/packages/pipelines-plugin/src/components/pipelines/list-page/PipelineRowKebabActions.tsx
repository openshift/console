import * as React from 'react';
import { referenceForModel } from '@console/internal/module/k8s';
import { PipelineModel } from '../../../models';
import { PipelineWithLatest } from '../../../types';
import { getPipelineKebabActions } from '../../../utils/pipeline-actions';
import { ResourceKebabWithUserLabel } from '../../pipelineruns/triggered-by';
import { usePipelineTriggerTemplateNames } from '../utils/triggers';

type PipelineRowKebabActionsProps = {
  pipeline: PipelineWithLatest;
};

const pipelineReference = referenceForModel(PipelineModel);

const PipelineRowKebabActions: React.FC<PipelineRowKebabActionsProps> = ({ pipeline }) => {
  const {
    metadata: { name, namespace },
  } = pipeline;
  const templateNames = usePipelineTriggerTemplateNames(name, namespace) || [];

  return (
    <ResourceKebabWithUserLabel
      actions={getPipelineKebabActions(pipeline.latestRun, templateNames.length > 0)}
      kind={pipelineReference}
      resource={pipeline}
    />
  );
};

export default PipelineRowKebabActions;
