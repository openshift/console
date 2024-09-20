import * as React from 'react';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { useActivePerspective } from '@console/dynamic-plugin-sdk';
import { ListPageWrapper } from '@console/internal/components/factory';
import { EmptyBox, LoadingBox } from '@console/internal/components/utils';
import { referenceForModel } from '@console/internal/module/k8s';
import { useUserSettings } from '@console/shared/src';
import { PREFERRED_DEV_PIPELINE_PAGE_TAB_USER_SETTING_KEY } from '../../../const';
import { PipelineRunModel } from '../../../models';
import { useGetPipelineRuns } from '../../pipelineruns/hooks/useTektonResults';
import PipelineAugmentRuns, { filters } from './PipelineAugmentRuns';
import PipelineList from './PipelineList';

interface PipelineAugmentRunsWrapperProps {
  namespace: string;
  pipeline?: any;
  reduxIDs?: string[];
  hideNameLabelFilters?: boolean;
}

const PipelineAugmentRunsWrapper: React.FC<PipelineAugmentRunsWrapperProps> = (props) => {
  const { t } = useTranslation();
  const activePerspective = useActivePerspective()[0];
  const [, setPreferredTab, preferredTabLoaded] = useUserSettings<string>(
    PREFERRED_DEV_PIPELINE_PAGE_TAB_USER_SETTING_KEY,
    'pipelines',
  );
  const [pipelineRuns, pipelineRunsLoaded, pipelineRunsLoadError] = useGetPipelineRuns(
    props.namespace,
  );
  const resources = {
    data: pipelineRuns,
    kind: referenceForModel(PipelineRunModel),
    loadError: pipelineRunsLoadError,
    loaded: pipelineRunsLoaded,
  };
  React.useEffect(() => {
    if (preferredTabLoaded && activePerspective === 'dev') {
      setPreferredTab('pipelines');
    }
  }, [activePerspective, preferredTabLoaded, setPreferredTab]);
  const pipelineData = _.get(props.pipeline, 'data', []);

  if (!props.pipeline.loaded) {
    return <LoadingBox />;
  }

  if (pipelineData.length === 0) {
    return <EmptyBox label={t('pipelines-plugin~Pipelines')} />;
  }
  return (
    <PipelineAugmentRuns {...props} pipelinerun={resources}>
      <ListPageWrapper
        {...props}
        flatten={(_resources) => _.get(_resources, ['pipeline', 'data'], {})}
        kinds={['Pipeline']}
        ListComponent={PipelineList}
        rowFilters={filters(t)}
        hideNameLabelFilters={props.hideNameLabelFilters}
      />
    </PipelineAugmentRuns>
  );
};

export default PipelineAugmentRunsWrapper;
