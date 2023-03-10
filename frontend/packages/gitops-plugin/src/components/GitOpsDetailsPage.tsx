import * as React from 'react';
import * as _ from 'lodash';
import { RouteComponentProps } from 'react-router-dom';
import { LoadingBox } from '@console/internal/components/utils';
import GitOpsDetails from './details/GitOpsDetails';
import GitOpsEmptyState from './GitOpsEmptyState';
import { GitOpsEnvironment } from './utils/gitops-types';
import { getEnvData } from './utils/gitops-utils';

type GitOpsOverviewPageProps = {
  customData: {
    emptyStateMsg: string;
    envs: string[];
    applicationBaseURI: string;
    manifestURL: string;
  };
};
type GitOpsDetailsPageProps = RouteComponentProps<{ appName?: string }> & GitOpsOverviewPageProps;
const GitOpsDetailsPage: React.FC<GitOpsDetailsPageProps> = (props) => {
  const [envsData, setEnvsData] = React.useState<GitOpsEnvironment[]>(null);
  const { appName } = props.match.params;
  const environmentBaseURI = `/api/gitops/environments`;
  const environmentBaseURIV2 = `/api/gitops/environment`;
  const { envs, emptyStateMsg, applicationBaseURI, manifestURL } = props.customData;
  const [error, setError] = React.useState<Error>(null);

  React.useEffect(() => {
    const getEnvsData = async () => {
      if (!_.isEmpty(envs) && applicationBaseURI) {
        let data;
        try {
          data = await Promise.all(
            _.map(envs, (env) =>
              getEnvData(environmentBaseURIV2, environmentBaseURI, env, applicationBaseURI),
            ),
          );
        } catch (err) {
          setError(err);
        }
        if (data?.length > 0) {
          setEnvsData(data);
        }
      }
    };

    getEnvsData();
  }, [applicationBaseURI, environmentBaseURIV2, environmentBaseURI, envs, error]);

  return (
    <>
      {!envsData ? (
        <LoadingBox />
      ) : !emptyStateMsg ? (
        <GitOpsDetails envs={envsData} appName={appName} manifestURL={manifestURL} error={error} />
      ) : (
        <GitOpsEmptyState emptyStateMsg={emptyStateMsg} />
      )}
    </>
  );
};

export default GitOpsDetailsPage;
