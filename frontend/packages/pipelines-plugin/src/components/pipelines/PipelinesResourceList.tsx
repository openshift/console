import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { getBadgeFromType } from '@console/shared';
import { referenceForModel } from '@console/internal/module/k8s';
import { Firehose } from '@console/internal/components/utils';
import { FireMan_ as FireMan } from '@console/internal/components/factory';
import { PipelineModel } from '../../models';
import PipelineAugmentRunsWrapper from './list-page/PipelineAugmentRunsWrapper';
import { filters } from './list-page/PipelineAugmentRuns';

interface PipelinesResourceListProps extends React.ComponentProps<typeof FireMan> {
  namespace: string;
}

const PipelinesResourceList: React.FC<PipelinesResourceListProps> = (props) => {
  const { t } = useTranslation();
  const { namespace, showTitle = true, selector, name } = props;

  const resources = [
    {
      isList: true,
      kind: referenceForModel(PipelineModel),
      namespace,
      prop: PipelineModel.id,
      filters: { ...filters },
      selector,
      name,
    },
  ];

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
      badge={getBadgeFromType(PipelineModel.badge)}
    >
      <Firehose resources={resources}>
        <PipelineAugmentRunsWrapper hideNameLabelFilters={props.hideNameLabelFilters} />
      </Firehose>
    </FireMan>
  );
};

export default PipelinesResourceList;
