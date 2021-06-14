import * as React from 'react';
import { Button } from '@patternfly/react-core';
import { useTranslation, Trans } from 'react-i18next';
import { RouteComponentProps } from 'react-router';
import CreateProjectListPage from '@console/dev-console/src/components/projects/CreateProjectListPage';
import { PipelineRunModel } from '../../models';
import { usePipelineTechPreviewBadge } from '../../utils/hooks';
import PipelineRunsResourceList from './PipelineRunsResourceList';

type PipelineRunsPageProps = RouteComponentProps<{ ns: string }>;

const PipelineRunsPage: React.FC<PipelineRunsPageProps> = (props) => {
  const { t } = useTranslation();
  const {
    match: {
      params: { ns: namespace },
    },
  } = props;
  const badge = usePipelineTechPreviewBadge(namespace);
  const { labelPlural: pipelineRunLabel } = PipelineRunModel;
  return namespace ? (
    <div>
      <PipelineRunsResourceList {...props} namespace={namespace} />
    </div>
  ) : (
    <CreateProjectListPage title={pipelineRunLabel} badge={badge}>
      {(openProjectModal) => (
        <Trans t={t} ns="pipelines-plugin" values={{ pipelineRunLabel }}>
          Select a Project to view the list of {{ pipelineRunLabel }} or{' '}
          <Button isInline variant="link" onClick={openProjectModal}>
            create a Project
          </Button>
          .
        </Trans>
      )}
    </CreateProjectListPage>
  );
};

export default PipelineRunsPage;
