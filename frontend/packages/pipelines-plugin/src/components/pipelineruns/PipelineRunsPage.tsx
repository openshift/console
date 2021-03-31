import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { RouteComponentProps } from 'react-router';
import CreateProjectListPage from '@console/dev-console/src/components/projects/CreateProjectListPage';
import { PipelineRunModel } from '../../models';
import PipelineRunsResourceList from './PipelineRunsResourceList';
import { usePipelineTechPreviewBadge } from '../../utils/hooks';

type PipelineRunsPageProps = RouteComponentProps<{ ns: string }>;

const PipelineRunsPage: React.FC<PipelineRunsPageProps> = (props) => {
  const { t } = useTranslation();
  const {
    match: {
      params: { ns: namespace },
    },
  } = props;
  const badge = usePipelineTechPreviewBadge(namespace);
  return namespace ? (
    <div>
      <PipelineRunsResourceList {...props} namespace={namespace} />
    </div>
  ) : (
    <CreateProjectListPage title={PipelineRunModel.labelPlural} badge={badge}>
      {t('pipelines-plugin~Select a Project to view the list of {{pipelineRunLabel}}', {
        pipelineRunLabel: PipelineRunModel.labelPlural,
      })}
    </CreateProjectListPage>
  );
};

export default PipelineRunsPage;
