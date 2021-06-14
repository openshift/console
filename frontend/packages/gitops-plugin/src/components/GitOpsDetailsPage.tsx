import * as React from 'react';
import * as _ from 'lodash';
import Helmet from 'react-helmet';
import { useTranslation } from 'react-i18next';
import { RouteComponentProps } from 'react-router-dom';
import { LoadingBox } from '@console/internal/components/utils';
import { DevPreviewBadge } from '@console/shared';
import GitOpsDetailsController from './details/GitOpsDetailsController';
import GitOpsDetailsPageHeading from './details/GitOpsDetailsPageHeading';
import { GitOpsAppGroupData, GitOpsEnvironment } from './utils/gitops-types';
import {
  fetchAppGroups,
  getEnvData,
  getPipelinesBaseURI,
  getApplicationsBaseURI,
} from './utils/gitops-utils';
import useDefaultSecret from './utils/useDefaultSecret';

type GitOpsDetailsPageProps = RouteComponentProps<{ appName?: string }>;

const GitOpsDetailsPage: React.FC<GitOpsDetailsPageProps> = ({ match, location }) => {
  const { t } = useTranslation();
  const [envs, setEnvs] = React.useState<string[]>(null);
  const [envsData, setEnvsData] = React.useState<GitOpsEnvironment[]>(null);
  const [emptyStateMsg, setEmptyStateMsg] = React.useState(null);
  const [secretNS, secretName] = useDefaultSecret();
  const { appName } = match.params;
  const searchParams = new URLSearchParams(location.search);
  const manifestURL = searchParams.get('url');
  const pipelinesBaseURI = getPipelinesBaseURI(secretNS, secretName);
  const applicationBaseURI = getApplicationsBaseURI(appName, secretNS, secretName, manifestURL);
  const environmentBaseURI = `/api/gitops/environments`;

  React.useEffect(() => {
    let ignore = false;

    const getEnvs = async () => {
      if (!pipelinesBaseURI) return;
      let appGroups: GitOpsAppGroupData[];
      let emptyMsg = null;
      try {
        appGroups = await fetchAppGroups(pipelinesBaseURI, manifestURL);
      } catch {} // eslint-disable-line no-empty
      if (ignore) return;
      const app = _.find(appGroups, (appObj) => appName === appObj?.name);
      if (!app?.environments) {
        emptyMsg = t(
          'gitops-plugin~Environment details were not found. Try reloading the page or contacting an administrator.',
        );
      }
      setEmptyStateMsg(emptyMsg);
      setEnvs(app?.environments);
    };

    getEnvs();

    return () => {
      ignore = true;
    };
  }, [appName, manifestURL, pipelinesBaseURI, t]);

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
      {!envsData && !emptyStateMsg ? (
        <LoadingBox />
      ) : (
        <GitOpsDetailsController
          envsData={envsData}
          emptyStateMsg={emptyStateMsg}
          appName={appName}
        />
      )}
    </>
  );
};

export default GitOpsDetailsPage;
