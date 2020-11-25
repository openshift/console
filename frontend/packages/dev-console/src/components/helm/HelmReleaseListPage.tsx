import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import Helmet from 'react-helmet';
import { useTranslation } from 'react-i18next';
import { PageHeading } from '@console/internal/components/utils';
import { withStartGuide } from '@console/internal/components/start-guide';
import CreateProjectListPage from '../projects/CreateProjectListPage';
import NamespacedPage, { NamespacedPageVariants } from '../NamespacedPage';
import HelmReleaseList from './list/HelmReleaseList';

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
      <PageHeading title={t('devconsole~Helm Releases')} />
      <HelmReleaseList namespace={namespace} />
    </div>
  ) : (
    <CreateProjectListPage title={t('devconsole~Helm Releases')}>
      {t('devconsole~Select a project to view the list of Helm Releases')}
    </CreateProjectListPage>
  );
};

const PageContentsWithStartGuide = withStartGuide(PageContents);

export const HelmReleaseListPage: React.FC<HelmReleaseListPageProps> = (props) => {
  const { t } = useTranslation();
  return (
    <NamespacedPage variant={NamespacedPageVariants.light} hideApplications>
      <Helmet>
        <title>{t('devconsole~Helm Releases')}</title>
      </Helmet>
      <PageContentsWithStartGuide {...props} />
    </NamespacedPage>
  );
};

export default HelmReleaseListPage;
