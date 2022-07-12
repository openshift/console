import * as React from 'react';
import { Button } from '@patternfly/react-core';
import { useTranslation, Trans } from 'react-i18next';
import { match as RMatch } from 'react-router';
import { NamespacedPageVariants } from '@console/dynamic-plugin-sdk/src/api/internal-types';
import { withStartGuide } from '@console/internal/components/start-guide';
import CreateProjectListPage from '@console/shared/src/components/projects/CreateProjectListPage';
import NamespacedPage from '@console/shared/src/components/projects/NamespacedPage';
import { SearchPage } from '../../../../public/components/search';

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
          Select a Project to search inside or{' '}
          <Button isInline variant="link" onClick={openProjectModal}>
            create a Project
          </Button>
          .
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
