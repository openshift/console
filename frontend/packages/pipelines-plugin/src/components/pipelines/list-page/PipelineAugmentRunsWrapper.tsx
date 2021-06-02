import * as React from 'react';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { ListPageWrapper_ as ListPageWrapper } from '@console/internal/components/factory';
import { EmptyBox, Firehose, LoadingBox } from '@console/internal/components/utils';
import { Resource, getResources } from '../../../utils/pipeline-augment';
import PipelineAugmentRuns, { filters } from './PipelineAugmentRuns';
import PipelineList from './PipelineList';

interface PipelineAugmentRunsWrapperProps {
  pipeline?: any;
  reduxIDs?: string[];
  hideNameLabelFilters?: boolean;
}

const PipelineAugmentRunsWrapper: React.FC<PipelineAugmentRunsWrapperProps> = (props) => {
  const { t } = useTranslation();
  const pipelineData = _.get(props.pipeline, 'data', []);

  if (!props.pipeline.loaded) {
    return <LoadingBox />;
  }

  if (pipelineData.length === 0) {
    return <EmptyBox label={t('pipelines-plugin~Pipelines')} />;
  }
  const firehoseResources: Resource = getResources(props.pipeline.data);
  return (
    <Firehose resources={firehoseResources.resources}>
      <PipelineAugmentRuns
        {...props}
        propsReferenceForRuns={firehoseResources.propsReferenceForRuns}
      >
        <ListPageWrapper
          {...props}
          flatten={(_resources) => _.get(_resources, ['pipeline', 'data'], {})}
          kinds={['Pipeline']}
          ListComponent={PipelineList}
          rowFilters={filters}
          hideNameLabelFilters={props.hideNameLabelFilters}
        />
      </PipelineAugmentRuns>
    </Firehose>
  );
};

export default PipelineAugmentRunsWrapper;
