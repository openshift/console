import * as React from 'react';
import { FireMan_ as FireMan } from '@console/internal/components/factory';
import { Firehose } from '@console/internal/components/utils';
import { getBadgeFromType } from '@console/shared';
import { referenceForModel } from '@console/internal/module/k8s';
import { PipelineModel } from '../../models';
import ProjectListPage from '../projects/ProjectListPage';
import { filters } from './PipelineAugmentRuns';
import PipelineAugmentRunsWrapper from './PipelineAugmentRunsWrapper';

interface PipelinesPageProps {
  namespace: string;
}

const PipelinesPage: React.FC<PipelinesPageProps> = ({ namespace }) => {
  const resources = [
    {
      isList: true,
      kind: referenceForModel(PipelineModel),
      namespace,
      prop: PipelineModel.id,
      filters: { ...filters },
    },
  ];
  return namespace ? (
    <FireMan
      canCreate={false}
      filterLabel="by name"
      textFilter="name"
      resources={resources}
      title={PipelineModel.labelPlural}
      badge={getBadgeFromType(PipelineModel.badge)}
    >
      <Firehose resources={resources}>
        <PipelineAugmentRunsWrapper />
      </Firehose>
    </FireMan>
  ) : (
    <ProjectListPage title="Pipelines" badge={getBadgeFromType(PipelineModel.badge)}>
      Select a project to view the list of pipelines
    </ProjectListPage>
  );
};

export default PipelinesPage;
