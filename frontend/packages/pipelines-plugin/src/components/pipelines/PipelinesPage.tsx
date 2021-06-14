import * as React from 'react';
import { Button } from '@patternfly/react-core';
import { useTranslation, Trans } from 'react-i18next';
import { RouteComponentProps } from 'react-router';
import CreateProjectListPage from '@console/dev-console/src/components/projects/CreateProjectListPage';
import { withStartGuide } from '@console/internal/components/start-guide';
import { usePipelineTechPreviewBadge } from '../../utils/hooks';
import PipelinesResourceList from './PipelinesResourceList';

type PipelinesPageProps = RouteComponentProps<{ ns: string }>;

export const PipelinesPage: React.FC<PipelinesPageProps> = (props) => {
  const { t } = useTranslation();
  const {
    match: {
      params: { ns: namespace },
    },
  } = props;
  const badge = usePipelineTechPreviewBadge(namespace);

  return namespace ? (
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
          Select a Project to view the list of Pipelines or{' '}
          <Button isInline variant="link" onClick={openProjectModal}>
            create a Project
          </Button>
          .
        </Trans>
      )}
    </CreateProjectListPage>
  );
};

export default withStartGuide(PipelinesPage);
