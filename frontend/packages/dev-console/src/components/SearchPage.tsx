import * as React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { match as RMatch } from 'react-router';
import { withStartGuide } from '@console/internal/components/start-guide';
import { SearchPage } from '../../../../public/components/search';
import NamespacedPage, { NamespacedPageVariants } from './NamespacedPage';
import CreateProjectListPage, { CreateAProjectButton } from './projects/CreateProjectListPage';

export interface SearchPageProps {
  match: RMatch<{
    ns?: string;
  }>;
  noProjectsAvailable?: boolean;
}

const PageContents: React.FC<SearchPageProps> = ({ noProjectsAvailable, ...props }) => {
  const { t } = useTranslation();
  const namespace = props.match.params.ns;
  return namespace ? (
    <SearchPage namespace={namespace} noProjectsAvailable={noProjectsAvailable} />
  ) : (
    <CreateProjectListPage title={t('devconsole~Search')}>
      {(openProjectModal) => (
        <Trans t={t} ns="devconsole">
          Select a Project to search inside
          <CreateAProjectButton openProjectModal={openProjectModal} />.
        </Trans>
      )}
    </CreateProjectListPage>
  );
};

const PageContentsWithStartGuide = withStartGuide(PageContents);

const Search: React.FC<SearchPageProps> = (props) => (
  <NamespacedPage variant={NamespacedPageVariants.light} hideApplications>
    <PageContentsWithStartGuide {...props} />
  </NamespacedPage>
);

export default Search;
