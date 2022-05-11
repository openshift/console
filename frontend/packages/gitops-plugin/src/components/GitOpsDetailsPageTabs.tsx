import * as React from 'react';
import Helmet from 'react-helmet';
import { useTranslation } from 'react-i18next';
import { RouteComponentProps } from 'react-router';
import { HorizontalNav, LoadingBox, Page } from '@console/internal/components/utils';
import { DevPreviewBadge } from '@console/shared';
import GitOpsDetailsPageHeading from './details/GitOpsDetailsPageHeading';
import GitOpsDetailsPage from './GitOpsDetailsPage';
import GitOpsDeploymentHistory from './history/GitOpsDeploymentHistory';
import { getPipelinesBaseURI, getApplicationsBaseURI } from './utils/gitops-utils';
import useDefaultSecret from './utils/useDefaultSecret';
import useEnvDetails from './utils/useEnvDetails';

type GitOpsDetailsPageTabsProps = RouteComponentProps<{ appName?: string }>;

export const GitOpsDetailsPageTabs: React.FC<GitOpsDetailsPageTabsProps> = ({
  match,
  location,
}) => {
  const { t } = useTranslation();
  const [secretNS, secretName] = useDefaultSecret();
  const { appName } = match.params;
  const searchParams = new URLSearchParams(location.search);
  const manifestURL = searchParams.get('url');
  const pipelinesBaseURI = getPipelinesBaseURI(secretNS, secretName);
  const applicationBaseURI = getApplicationsBaseURI(appName, secretNS, secretName, manifestURL);
  const [envs, emptyStateMsg] = useEnvDetails(appName, manifestURL, pipelinesBaseURI);

  const pages: Page[] = [
    {
      href: `${'overview?url='}${manifestURL}`,
      name: t('gitops-plugin~Overview'),
      path: 'overview',
      component: GitOpsDetailsPage,
    },
    {
      href: `${'deploymenthistory?url='}${manifestURL}`,
      name: t('gitops-plugin~Deployment history'),
      path: 'deploymenthistory',
      component: GitOpsDeploymentHistory,
    },
  ];

  return (
    <>
      <Helmet>
        <title>{t('gitops-plugin~{{appName}} · Details', { appName })}</title>
      </Helmet>
      <GitOpsDetailsPageHeading
        url={match.url}
        appName={appName}
        manifestURL={manifestURL}
        badge={<DevPreviewBadge />}
      />
      {!emptyStateMsg && !envs ? (
        <LoadingBox />
      ) : (
        <HorizontalNav
          pages={pages}
          match={match}
          customData={{ emptyStateMsg, envs, applicationBaseURI, manifestURL, location }}
          noStatusBox
        />
      )}
    </>
  );
};

export default GitOpsDetailsPageTabs;
