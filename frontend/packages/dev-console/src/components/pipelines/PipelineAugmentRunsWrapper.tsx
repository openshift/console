import * as _ from 'lodash';
import * as React from 'react';
import { ListPageWrapper_ as ListPageWrapper } from '@console/internal/components/factory';
import { Firehose } from '@console/internal/components/utils';
import PipelineAugmentRuns, { filters } from './PipelineAugmentRuns';
import PipelineList from './PipelineList';
import { Resource, getResources } from '../../utils/pipeline-augment';
import { PipelineModel } from '../../models';

interface PipelineAugmentRunsWrapperProps {
  pipeline?: any;
  reduxIDs?: string[];
}

const PipelineAugmentRunsWrapper: React.FC<PipelineAugmentRunsWrapperProps> = ({
  pipeline,
  reduxIDs,
  ...props
}) => {
  if (!pipeline || !pipeline.data || !(pipeline.data.length > 0))
    return (
      <div className="cos-status-box">
        <div className="text-center">No {PipelineModel.labelPlural} Found</div>
      </div>
    );
  const firehoseResources: Resource = getResources(pipeline.data);
  return (
    <Firehose resources={firehoseResources.resources}>
      <PipelineAugmentRuns
        {...props}
        pipeline={pipeline}
        reduxIDs={reduxIDs}
        propsReferenceForRuns={firehoseResources.propsReferenceForRuns}
      >
        <ListPageWrapper
          flatten={(_resources) => _.get(_resources, 'pipeline', {}).data}
          kinds={['Pipeline']}
          ListComponent={PipelineList}
          rowFilters={filters}
        />
      </PipelineAugmentRuns>
    </Firehose>
  );
};

export default PipelineAugmentRunsWrapper;
