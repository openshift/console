import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { getBadgeFromType } from '@console/shared';
import CreateProjectListPage from '@console/dev-console/src/components/projects/CreateProjectListPage';
import { PipelineRunModel } from '../../models';
import PipelineRunsResourceList from './PipelineRunsResourceList';

type PipelineRunsPageProps = RouteComponentProps<{ ns: string }>;

const PipelineRunsPage: React.FC<PipelineRunsPageProps> = (props) => {
  const {
    match: {
      params: { ns: namespace },
    },
  } = props;
  return namespace ? (
    <div>
      <PipelineRunsResourceList {...props} namespace={namespace} />
    </div>
  ) : (
    <CreateProjectListPage
      title={PipelineRunModel.labelPlural}
      badge={getBadgeFromType(PipelineRunModel.badge)}
    >
      Select a project to view the list of {PipelineRunModel.labelPlural}
    </CreateProjectListPage>
  );
};

export default PipelineRunsPage;
