import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { RouteComponentProps } from 'react-router';
import { getBadgeFromType } from '@console/shared';
import { PipelineRunModel } from '../../models';
import CreateProjectListPage from '../projects/CreateProjectListPage';
import PipelineRunsResourceList from './PipelineRunsResourceList';

type PipelineRunsPageProps = RouteComponentProps<{ ns: string }>;

const PipelineRunsPage: React.FC<PipelineRunsPageProps> = (props) => {
  const { t } = useTranslation();
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
      {t('devconsole~Select a project to view the list of {{pipelineRunLabel}}', {
        pipelineRunLabel: PipelineRunModel.labelPlural,
      })}
    </CreateProjectListPage>
  );
};

export default PipelineRunsPage;
