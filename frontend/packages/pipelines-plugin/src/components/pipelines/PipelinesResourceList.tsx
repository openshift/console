import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { FireMan, FireManProps } from '@console/internal/components/factory';
import { Firehose } from '@console/internal/components/utils';
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
      <Firehose resources={resources}>
        <PipelineAugmentRunsWrapper hideNameLabelFilters={props.hideNameLabelFilters} />
      </Firehose>
    </FireMan>
  );
};

export default PipelinesResourceList;
