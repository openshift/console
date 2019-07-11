import * as React from 'react';
import { FireMan_ as FireMan } from '@console/internal/components/factory';
import { Firehose } from '@console/internal/components/utils';
import { PipelineModel } from '../../models';
import { filters } from './PipelineAugmentRuns';
import PipelineAugmentRunsWrapper from './PipelineAugmentRunsWrapper';
import DefaultPage from '../DefaultPage';

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
  return namespace ? (
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
  ) : (
    <DefaultPage title="Pipelines">Select a project to view the list of pipelines</DefaultPage>
  );
};

export default PipelinesPage;
