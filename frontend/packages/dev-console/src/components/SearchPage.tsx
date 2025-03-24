import * as React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom-v5-compat';
import { SearchPage } from '@console/internal/components/search';
import { withStartGuide } from '@console/internal/components/start-guide';
import { DocumentTitle } from '@console/shared/src/components/document-title/DocumentTitle';
import CatalogPageHelpText from './catalog/CatalogPageHelpText';
import NamespacedPage, { NamespacedPageVariants } from './NamespacedPage';
import CreateProjectListPage, { CreateAProjectButton } from './projects/CreateProjectListPage';

export interface SearchPageProps {
  noProjectsAvailable?: boolean;
}

const ProjectListPage = () => {
  const { t } = useTranslation();
  return (
    <CreateProjectListPage title={t('devconsole~Search')}>
      {(openProjectModal) => (
        <CatalogPageHelpText>
          <Trans t={t} ns="devconsole">
            Select a Project to search inside
            <CreateAProjectButton openProjectModal={openProjectModal} />.
          </Trans>
        </CatalogPageHelpText>
      )}
    </CreateProjectListPage>
  );
};

const ProjectListPageWithStartGuide = withStartGuide(ProjectListPage);

const PageContents: React.FC<SearchPageProps> = ({ noProjectsAvailable }) => {
  const params = useParams();
  const namespace = params.ns;
  return namespace ? (
    <SearchPage namespace={namespace} noProjectsAvailable={noProjectsAvailable} />
  ) : (
    <ProjectListPageWithStartGuide />
  );
};

const Search: React.FC<SearchPageProps> = (props) => {
  const { t } = useTranslation();
  return (
    <>
      <DocumentTitle>{t('devconsole~Search')}</DocumentTitle>
      <NamespacedPage variant={NamespacedPageVariants.light} hideApplications>
        <PageContents {...props} />
      </NamespacedPage>
    </>
  );
};

export default Search;
