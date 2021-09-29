import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { FireMan, FireManProps } from '@console/internal/components/factory';
import { useK8sWatchResources } from '@console/internal/components/utils/k8s-watch-hook';
import { referenceForModel, Selector } from '@console/internal/module/k8s';
import { PipelineModel } from '../../models';
import { usePipelineTechPreviewBadge } from '../../utils/hooks';
import { filters } from './list-page/PipelineAugmentRuns';
import PipelineAugmentRunsWrapper from './list-page/PipelineAugmentRunsWrapper';

type PipelinesResourceListProps = {
  namespace: string;
  showTitle?: boolean;
  selector?: Selector;
  name?: string;
  nameFilter?: string;
  hideNameLabelFilters?: boolean;
  badge: FireManProps['badge'];
  title: FireManProps['title'];
};

const PipelinesResourceList: React.FC<PipelinesResourceListProps> = (props) => {
  const { t } = useTranslation();
  const { namespace, showTitle = true, selector, name, nameFilter } = props;
  const badge = usePipelineTechPreviewBadge(namespace);
  const resources = [
    {
      isList: true,
      kind: referenceForModel(PipelineModel),
      namespace,
      prop: PipelineModel.id,
      filters: { ...filters, name: nameFilter },
      selector,
      name,
    },
  ];

  const watchedResources = {};
  for (const resource of resources) {
    watchedResources[resource.prop] = resource;
  }
  const { pipeline } = useK8sWatchResources(watchedResources);

  return (
    <FireMan
      {...props}
      canCreate
      createButtonText={t('pipelines-plugin~Create Pipeline')}
      createProps={{
        to: namespace
          ? `/k8s/ns/${namespace}/${referenceForModel(PipelineModel)}/~new/builder`
          : `/k8s/cluster/${referenceForModel(PipelineModel)}/~new`,
      }}
      createAccessReview={{ model: PipelineModel, namespace }}
      filterLabel={t('pipelines-plugin~by name')}
      textFilter="name"
      resources={resources}
      title={showTitle ? t('pipelines-plugin~Pipelines') : null}
      badge={badge}
    >
      <PipelineAugmentRunsWrapper
        pipeline={pipeline}
        hideNameLabelFilters={props.hideNameLabelFilters}
      />
    </FireMan>
  );
};

export default PipelinesResourceList;
