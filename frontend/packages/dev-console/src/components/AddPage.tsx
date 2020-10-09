import * as React from 'react';
import { Helmet } from 'react-helmet';
import { useTranslation } from 'react-i18next';
import { match as RMatch } from 'react-router';
import { Firehose } from '@console/internal/components/utils';
import ODCEmptyState from './EmptyState';
import NamespacedPage from './NamespacedPage';
import ProjectsExistWrapper from './ProjectsExistWrapper';
import CreateProjectListPage from './projects/CreateProjectListPage';

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
        <title>{`+${t('devconsole~Add')}`}</title>
      </Helmet>
      <NamespacedPage>
        <Firehose resources={[{ kind: 'Project', prop: 'projects', isList: true }]}>
          <ProjectsExistWrapper title={t('devconsole~Add')}>
            {namespace ? (
              <ODCEmptyState title={t('devconsole~Add')} />
            ) : (
              <CreateProjectListPage title={t('devconsole~Add')}>
                {t('devconsole~Select a project to start adding to it')}
              </CreateProjectListPage>
            )}
          </ProjectsExistWrapper>
        </Firehose>
      </NamespacedPage>
    </>
  );
};

export default AddPage;
