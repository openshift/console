import * as React from 'react';
import Helmet from 'react-helmet';
import { Trans, useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom-v5-compat';
import CreateProjectListPage, {
  CreateAProjectButton,
} from '@console/dev-console/src/components/projects/CreateProjectListPage';
import { withStartGuide } from '@console/internal/components/start-guide';
import { usePipelineTechPreviewBadge } from '../../utils/hooks';
import PipelinesResourceList from './PipelinesResourceList';

export const PipelinesPage: React.FC = (props) => {
  const { t } = useTranslation();
  const { ns: namespace } = useParams();
  const badge = usePipelineTechPreviewBadge(namespace);

  return (
    <>
      <Helmet>
        <title>{t('pipelines-plugin~Pipelines')}</title>
      </Helmet>
      {namespace ? (
        <div>
          <PipelinesResourceList
            {...props}
            badge={badge}
            namespace={namespace}
            title={t('pipelines-plugin~Pipelines')}
          />
        </div>
      ) : (
        <CreateProjectListPage title={t('pipelines-plugin~Pipelines')} badge={badge}>
          {(openProjectModal) => (
            <Trans t={t} ns="pipelines-plugin">
              Select a Project to view the list of Pipelines
              <CreateAProjectButton openProjectModal={openProjectModal} />.
            </Trans>
          )}
        </CreateProjectListPage>
      )}
    </>
  );
};

export default withStartGuide(PipelinesPage);
