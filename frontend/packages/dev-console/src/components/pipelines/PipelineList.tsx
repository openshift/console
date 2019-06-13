import * as React from 'react';
import { Firehose } from '@console/internal/components/utils';
import { Table } from '@console/internal/components/factory';
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
    <Table
      {...props}
      aria-label={PipelineModel.labelPlural}
      Header={PipelineHeader}
      Row={PipelineRow}
      virtualize
    />
  );
};

export default PipelineList;
