import * as React from 'react';
import { Button } from '@patternfly/react-core';
import { Helmet } from 'react-helmet';
import { useTranslation, Trans } from 'react-i18next';
import { match as RMatch } from 'react-router';
import { Firehose } from '@console/internal/components/utils';
import NamespacedPage from '../NamespacedPage';
import CreateProjectListPage from '../projects/CreateProjectListPage';
import ProjectsExistWrapper from '../ProjectsExistWrapper';
import AddPageLayout from './AddPageLayout';

export interface AddPageProps {
  match: RMatch<{
    ns?: string;
  }>;
}

const AddPage: React.FC<AddPageProps> = ({ match }) => {
  const { t } = useTranslation();
  const namespace = match.params.ns;

  return (
    <>
      <Helmet>
        <title data-test-id="page-title">{`+${t('devconsole~Add')}`}</title>
      </Helmet>
      <NamespacedPage>
        <Firehose resources={[{ kind: 'Project', prop: 'projects', isList: true }]}>
          <ProjectsExistWrapper title={t('devconsole~Add')}>
            {namespace ? (
              <AddPageLayout title={t('devconsole~Add')} />
            ) : (
              <CreateProjectListPage title={t('devconsole~Add')}>
                {(openProjectModal) => (
                  <Trans t={t} ns="devconsole">
                    Select a Project to start adding to it or{' '}
                    <Button isInline variant="link" onClick={openProjectModal}>
                      create a Project
                    </Button>
                    .
                  </Trans>
                )}
              </CreateProjectListPage>
            )}
          </ProjectsExistWrapper>
        </Firehose>
      </NamespacedPage>
    </>
  );
};

export default AddPage;
