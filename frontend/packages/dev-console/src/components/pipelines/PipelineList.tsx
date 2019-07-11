import * as React from 'react';
import { Firehose } from '@console/internal/components/utils';
import { VirtualTable } from '@console/internal/components/factory';
import PipelineHeader from './PipelineHeader';
import PipelineRow from './PipelineRow';
import PipelineAugmentRuns from './PipelineAugmentRuns';
import { getResources, PropPipelineData, Resource } from '../../utils/pipeline-augment';
import { PipelineModel } from '../../models';

export interface PipelineListProps {
  data?: PropPipelineData[];
}

const PipelineList: React.FC<PipelineListProps> = (props) => {
  const { propsReferenceForRuns, resources }: Resource = getResources(props.data);
  return resources && resources.length > 0 ? (
    <Firehose resources={resources}>
      <PipelineAugmentRuns {...props} propsReferenceForRuns={propsReferenceForRuns} />
    </Firehose>
  ) : (
    <VirtualTable
      {...props}
      aria-label={PipelineModel.labelPlural}
      Header={PipelineHeader}
      Row={PipelineRow}
    />
  );
};

export default PipelineList;
