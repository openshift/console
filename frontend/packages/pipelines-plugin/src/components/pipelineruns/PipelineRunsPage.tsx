import * as React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom-v5-compat';
import CreateProjectListPage, {
  CreateAProjectButton,
} from '@console/dev-console/src/components/projects/CreateProjectListPage';
import { PipelineRunModel } from '../../models';
import { usePipelineTechPreviewBadge } from '../../utils/hooks';
import PipelineRunsResourceList from './PipelineRunsResourceList';

const PipelineRunsPage: React.FC = (props) => {
  const { t } = useTranslation();
  const { ns: namespace } = useParams();
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
          Select a Project to view the list of {{ pipelineRunLabel }}
          <CreateAProjectButton openProjectModal={openProjectModal} />.
        </Trans>
      )}
    </CreateProjectListPage>
  );
};

export default PipelineRunsPage;
