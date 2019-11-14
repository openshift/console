import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { getBadgeFromType } from '@console/shared';
import { PipelineRunModel } from '../../models';
import ProjectListPage from '../projects/ProjectListPage';
import PipelineRunsResourceList from './PipelineRunsResourceList';

type PipelineRunsPageProps = RouteComponentProps<{ ns: string }>;

const PipelineRunsPage: React.FC<PipelineRunsPageProps> = (props) => {
  const {
    match: {
      params: { ns: namespace },
    },
  } = props;
  return namespace ? (
    <PipelineRunsResourceList {...props} namespace={namespace} />
  ) : (
    <ProjectListPage
      title={PipelineRunModel.labelPlural}
      badge={getBadgeFromType(PipelineRunModel.badge)}
    >
      Select a project to view the list of {PipelineRunModel.labelPlural}
    </ProjectListPage>
  );
};

export default PipelineRunsPage;
