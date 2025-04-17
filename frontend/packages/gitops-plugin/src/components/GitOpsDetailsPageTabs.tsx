import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useLocation } from 'react-router-dom';
import { HorizontalNav, LoadingBox, Page } from '@console/internal/components/utils';
import { DevPreviewBadge } from '@console/shared';
import { DocumentTitle } from '@console/shared/src/components/document-title/DocumentTitle';
import GitOpsDetailsPageHeading from './details/GitOpsDetailsPageHeading';
import GitOpsDetailsPage from './GitOpsDetailsPage';
import GitOpsDeploymentHistory from './history/GitOpsDeploymentHistory';
import { getPipelinesBaseURI, getApplicationsBaseURI } from './utils/gitops-utils';
import useDefaultSecret from './utils/useDefaultSecret';
import useEnvDetails from './utils/useEnvDetails';

export const GitOpsDetailsPageTabs: React.FC = () => {
  const { t } = useTranslation();
  const [secretNS, secretName] = useDefaultSecret();
  const { appName } = useParams();
  const location = useLocation();
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
      <DocumentTitle>{t('gitops-plugin~{{appName}} · Details', { appName })}</DocumentTitle>
      <GitOpsDetailsPageHeading
        url={location.pathname}
        appName={appName}
        manifestURL={manifestURL}
        badge={<DevPreviewBadge />}
      />
      {!emptyStateMsg && !envs ? (
        <LoadingBox />
      ) : (
        <HorizontalNav
          pages={pages}
          customData={{ emptyStateMsg, envs, applicationBaseURI, manifestURL, location }}
          noStatusBox
        />
      )}
    </>
  );
};

export default GitOpsDetailsPageTabs;
