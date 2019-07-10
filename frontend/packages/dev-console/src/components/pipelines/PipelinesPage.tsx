import * as React from 'react';
import { FireMan_ as FireMan } from '@console/internal/components/factory';
import { Firehose } from '@console/internal/components/utils';
import { PipelineModel } from '../../models';
import { filters } from './PipelineAugmentRuns';
import PipelineAugmentRunsWrapper from './PipelineAugmentRunsWrapper';

interface PipelinesPageProps {
  namespace: string;
}

const PipelinesPage: React.FC<PipelinesPageProps> = ({ namespace }) => {
  const resources = [
    {
      isList: true,
      kind: PipelineModel.kind,
      namespace,
      prop: PipelineModel.id,
      filters,
    },
  ];
  return (
    <FireMan
      canCreate={false}
      canExpand={false}
      filterLabel="by name"
      textFilter="name"
      resources={resources}
    >
      <Firehose resources={resources}>
        <PipelineAugmentRunsWrapper />
      </Firehose>
    </FireMan>
  );
};

export default PipelinesPage;
