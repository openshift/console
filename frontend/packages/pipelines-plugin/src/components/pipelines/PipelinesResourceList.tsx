import * as React from 'react';
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
  const { namespace, showTitle = true } = props;

  const resources = [
    {
      isList: true,
      kind: referenceForModel(PipelineModel),
      namespace,
      prop: PipelineModel.id,
      filters: { ...filters },
    },
  ];

  return (
    <FireMan
      {...props}
      canCreate
      createButtonText={`Create ${PipelineModel.label}`}
      createProps={{
        to: namespace
          ? `/k8s/ns/${namespace}/${referenceForModel(PipelineModel)}/~new/builder`
          : `/k8s/cluster/${referenceForModel(PipelineModel)}/~new`,
      }}
      createAccessReview={{ model: PipelineModel, namespace }}
      filterLabel="by name"
      textFilter="name"
      resources={resources}
      title={showTitle ? PipelineModel.labelPlural : null}
      badge={getBadgeFromType(PipelineModel.badge)}
    >
      <Firehose resources={resources}>
        <PipelineAugmentRunsWrapper />
      </Firehose>
    </FireMan>
  );
};

export default PipelinesResourceList;
