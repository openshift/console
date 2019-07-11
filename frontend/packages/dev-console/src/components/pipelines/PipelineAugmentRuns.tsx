import * as React from 'react';
import { VirtualTable } from '@console/internal/components/factory';
import PipelineHeader from './PipelineHeader';
import PipelineRow from './PipelineRow';
import { augmentRunsToData, PropPipelineData, KeyedRuns } from '../../utils/pipeline-augment';
import { PipelineModel } from '../../models';

export type PipelineAugmentRunsProps = {
  data?: PropPipelineData[];
  propsReferenceForRuns?: string[];
};

// Firehose injects a lot of props and some of those are considered the KeyedRuns
const PipelineAugmentRuns: React.FC<PipelineAugmentRunsProps> = ({
  data,
  propsReferenceForRuns,
  ...props
}) => (
  <VirtualTable
    {...props}
    data={augmentRunsToData(data, propsReferenceForRuns, props as KeyedRuns)}
    aria-label={PipelineModel.labelPlural}
    Header={PipelineHeader}
    Row={PipelineRow}
  />
);

export default PipelineAugmentRuns;
