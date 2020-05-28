import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { getBadgeFromType } from '@console/shared';
import { withStartGuide } from '@console/internal/components/start-guide';
import { PipelineModel } from '../../models';
import ProjectListPage from '../projects/ProjectListPage';
import PipelinesResourceList from './PipelinesResourceList';

type PipelinesPageProps = RouteComponentProps<{ ns: string }>;

export const PipelinesPage: React.FC<PipelinesPageProps> = (props) => {
  const {
    match: {
      params: { ns: namespace },
    },
  } = props;
  return namespace ? (
    <div>
      <PipelinesResourceList
        {...props}
        badge={getBadgeFromType(PipelineModel.badge)}
        namespace={namespace}
        title={PipelineModel.labelPlural}
      />
    </div>
  ) : (
    <ProjectListPage
      title={PipelineModel.labelPlural}
      badge={getBadgeFromType(PipelineModel.badge)}
    >
      Select a project to view the list of {PipelineModel.labelPlural}
    </ProjectListPage>
  );
};

export default withStartGuide(PipelinesPage);
