import * as React from 'react';
import { Button } from '@patternfly/react-core';
import Helmet from 'react-helmet';
import { useTranslation, Trans } from 'react-i18next';
import { RouteComponentProps } from 'react-router';
import NamespacedPage, {
  NamespacedPageVariants,
} from '@console/dev-console/src/components/NamespacedPage';
import CreateProjectListPage from '@console/dev-console/src/components/projects/CreateProjectListPage';
import { withStartGuide } from '@console/internal/components/start-guide';
import { PageHeading } from '@console/internal/components/utils';
import HelmReleaseList from './HelmReleaseList';

type HelmReleaseListPageProps = RouteComponentProps<{ ns: string }>;

const PageContents: React.FC<HelmReleaseListPageProps> = (props) => {
  const { t } = useTranslation();
  const {
    match: {
      params: { ns: namespace },
    },
  } = props;
  return namespace ? (
    <div>
      <PageHeading title={t('helm-plugin~Helm Releases')} />
      <HelmReleaseList namespace={namespace} />
    </div>
  ) : (
    <CreateProjectListPage title={t('helm-plugin~Helm Releases')}>
      {(openProjectModal) => (
        <Trans t={t} ns="helm-plugin">
          Select a Project to view the list of Helm Releases or{' '}
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

export const HelmReleaseListPage: React.FC<HelmReleaseListPageProps> = (props) => {
  const { t } = useTranslation();
  return (
    <NamespacedPage variant={NamespacedPageVariants.light} hideApplications>
      <Helmet>
        <title>{t('helm-plugin~Helm Releases')}</title>
      </Helmet>
      <PageContentsWithStartGuide {...props} />
    </NamespacedPage>
  );
};

export default HelmReleaseListPage;
