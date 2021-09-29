import * as React from 'react';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { ListPageWrapper } from '@console/internal/components/factory';
import { EmptyBox, LoadingBox } from '@console/internal/components/utils';
import { useK8sWatchResources } from '@console/internal/components/utils/k8s-watch-hook';
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
  const firehoseResources: Resource = getResources(pipelineData);
  const watchedResources = {};
  if (firehoseResources && firehoseResources.resources) {
    for (let i = 0; i < firehoseResources.resources.length; i++) {
      watchedResources[firehoseResources.propsReferenceForRuns[i]] = firehoseResources.resources[i];
    }
  }
  const pipelineRuns = useK8sWatchResources(watchedResources);

  if (!props.pipeline.loaded) {
    return <LoadingBox />;
  }

  if (pipelineData.length === 0) {
    return <EmptyBox label={t('pipelines-plugin~Pipelines')} />;
  }

  return (
    <PipelineAugmentRuns
      {...props}
      {...pipelineRuns}
      propsReferenceForRuns={firehoseResources.propsReferenceForRuns}
    >
      <ListPageWrapper
        {...props}
        loaded={props.pipeline.loaded}
        flatten={(_resources) => _.get(_resources, ['pipeline', 'data'], {})}
        kinds={['Pipeline']}
        ListComponent={PipelineList}
        rowFilters={filters}
        hideNameLabelFilters={props.hideNameLabelFilters}
      />
    </PipelineAugmentRuns>
  );
};

export default PipelineAugmentRunsWrapper;
