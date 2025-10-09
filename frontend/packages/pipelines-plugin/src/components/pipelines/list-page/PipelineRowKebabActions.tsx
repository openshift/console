import * as React from 'react';
import { referenceForModel } from '@console/internal/module/k8s';
import { LazyActionMenu } from '@console/shared/src';
import { PipelineModel } from '../../../models';
import { PipelineWithLatest } from '../../../types';

type PipelineRowKebabActionsProps = {
  pipeline: PipelineWithLatest;
};

const pipelineReference = referenceForModel(PipelineModel);

const PipelineRowKebabActions: React.FC<PipelineRowKebabActionsProps> = ({ pipeline }) => {
  return <LazyActionMenu context={{ [pipelineReference]: pipeline }} />;
};

export default PipelineRowKebabActions;
