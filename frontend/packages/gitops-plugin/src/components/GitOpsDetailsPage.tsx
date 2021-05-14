import * as React from 'react';
import * as _ from 'lodash';
import Helmet from 'react-helmet';
import { useTranslation } from 'react-i18next';
import { RouteComponentProps } from 'react-router-dom';
import { DevPreviewBadge } from '@console/shared';
import { GitOpsEnvironment } from './utils/gitops-types';
import { getEnvData, getPipelinesBaseURI, getApplicationsBaseURI } from './utils/gitops-utils';
import useDefaultSecret from './utils/useDefaultSecret';
import useEnvDetails from './utils/useEnvDetails';
import GitOpsDetailsPageHeading from './details/GitOpsDetailsPageHeading';
import GitOpsDetailsController from './details/GitOpsDetailsController';

type GitOpsDetailsPageProps = RouteComponentProps<{ appName?: string }>;

const GitOpsDetailsPage: React.FC<GitOpsDetailsPageProps> = ({ match, location }) => {
  const { t } = useTranslation();
  const [envsData, setEnvsData] = React.useState<GitOpsEnvironment[]>(null);
  const [secretNS, secretName] = useDefaultSecret();
  const { appName } = match.params;
  const searchParams = new URLSearchParams(location.search);
  const manifestURL = searchParams.get('url');
  const pipelinesBaseURI = getPipelinesBaseURI(secretNS, secretName);
  const applicationBaseURI = getApplicationsBaseURI(appName, secretNS, secretName, manifestURL);
  const environmentBaseURI = `/api/gitops/environments`;
  const [envs, emptyStateMsg] = useEnvDetails(appName, manifestURL, pipelinesBaseURI);

  React.useEffect(() => {
    const getEnvsData = async () => {
      if (!_.isEmpty(envs) && applicationBaseURI) {
        let data;
        try {
          data = await Promise.all(
            _.map(envs, (env) => getEnvData(environmentBaseURI, env, applicationBaseURI)),
          );
        } catch {} // eslint-disable-line no-empty
        setEnvsData(data);
      }
    };

    getEnvsData();
  }, [applicationBaseURI, environmentBaseURI, envs, manifestURL]);

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
      <GitOpsDetailsController
        envsData={envsData}
        appName={appName}
        emptyStateMsg={emptyStateMsg}
        match={match}
      />
    </>
  );
};

export default GitOpsDetailsPage;
