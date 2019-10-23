import * as React from 'react';
import { connect } from 'react-redux';
import { FireMan_ as FireMan } from '@console/internal/components/factory';
import { Firehose } from '@console/internal/components/utils';
import { getBadgeFromType } from '@console/shared';
import { referenceForModel } from '@console/internal/module/k8s';
import { getActivePerspective } from '@console/internal/reducers/ui';
import { RootState } from '@console/internal/redux';
import { PipelineModel } from '../../models';
import ProjectListPage from '../projects/ProjectListPage';
import { filters } from './PipelineAugmentRuns';
import PipelineAugmentRunsWrapper from './PipelineAugmentRunsWrapper';

interface PipelinesPageProps {
  namespace: string;
}

interface StateProps {
  perspective: string;
}

export const PipelinesPage: React.FC<PipelinesPageProps & StateProps> = ({
  namespace,
  perspective,
}) => {
  const resources = [
    {
      isList: true,
      kind: referenceForModel(PipelineModel),
      namespace,
      prop: PipelineModel.id,
      filters: { ...filters },
    },
  ];
  return namespace || perspective !== 'dev' ? (
    <FireMan
      canCreate
      createButtonText={`Create ${PipelineModel.label}`}
      createProps={{ to: `/k8s/ns/${namespace}/${referenceForModel(PipelineModel)}/~new` }}
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

const mapStateToProps = (state: RootState): StateProps => {
  const perspective = getActivePerspective(state);
  return {
    perspective,
  };
};

export default connect(mapStateToProps)(PipelinesPage);
