import * as React from 'react';
import Helmet from 'react-helmet';
import { RouteComponentProps } from 'react-router-dom';
import * as _ from 'lodash';
import { BreadCrumbs, ResourceIcon, LoadingBox } from '@console/internal/components/utils';
import { Split, SplitItem, Label } from '@patternfly/react-core';
import { GitOpsAppGroupData, GitOpsEnvironment } from './utils/gitops-types';
import GitOpsDetailsController from './details/GitOpsDetailsController';
import { routeDecoratorIcon } from '../import/render-utils';
import {
  fetchAppGroups,
  getEnvData,
  getPipelinesBaseURI,
  getApplicationsBaseURI,
} from './utils/gitops-utils';
import useDefaultSecret from './utils/useDefaultSecret';

type GitOpsDetailsPageProps = RouteComponentProps<{ appName?: string }>;

const GitOpsDetailsPage: React.FC<GitOpsDetailsPageProps> = ({ match, location }) => {
  const [envs, setEnvs] = React.useState<string[]>(null);
  const [envsData, setEnvsData] = React.useState<GitOpsEnvironment[]>(null);
  const [secretNS, secretName] = useDefaultSecret();
  const { appName } = match.params;
  const searchParams = new URLSearchParams(location.search);
  const manifestURL = searchParams.get('url');
  const pipelinesBaseURI = getPipelinesBaseURI(secretNS, secretName);
  const applicationBaseURI = getApplicationsBaseURI(appName, secretNS, secretName, manifestURL);
  const environmentBaseURI = `/api/gitops/environments`;

  const breadcrumbs = [
    {
      name: 'Application Stages',
      path: '/applicationstages',
    },
    {
      name: 'Application Details',
      path: `${match.url}`,
    },
  ];

  React.useEffect(() => {
    let ignore = false;

    const getEnvs = async () => {
      if (!pipelinesBaseURI) return;
      let appGroups: GitOpsAppGroupData[];
      try {
        appGroups = await fetchAppGroups(pipelinesBaseURI, manifestURL);
      } catch {} // eslint-disable-line no-empty
      if (ignore) return;
      const app = _.find(appGroups, (appObj) => appName === appObj?.name);
      setEnvs(app?.environments);
      setEnvs(['dev', 'test', 'qa', 'stage', 'prod']); // will remove this once backend is ready
    };

    getEnvs();

    return () => {
      ignore = true;
    };
  }, [appName, manifestURL, pipelinesBaseURI]);

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
        <title>{`${appName} · Details`}</title>
      </Helmet>
      <div className="co-m-nav-title co-m-nav-title--breadcrumbs">
        <BreadCrumbs breadcrumbs={breadcrumbs} />
        <h1>
          <div className="co-m-pane__name co-resource-item">
            <ResourceIcon kind="application" className="co-m-resource-icon--lg" />
            <span className="co-resource-item__resource-name">{appName}</span>
          </div>
        </h1>
        <Split style={{ alignItems: 'center' }} hasGutter>
          <SplitItem style={{ fontWeight: 'bold', fontSize: '12px' }}>
            Manifest File Repo:
          </SplitItem>
          <SplitItem isFilled>
            <Label
              style={{ fontSize: '12px' }}
              color="blue"
              icon={routeDecoratorIcon(manifestURL, 12)}
            >
              <a
                style={{ color: 'var(--pf-c-label__content--Color)' }}
                href={manifestURL}
                rel="noopener noreferrer"
                target="_blank"
              >
                {manifestURL}
              </a>
            </Label>
          </SplitItem>
        </Split>
      </div>
      {envsData ? <GitOpsDetailsController envsData={envsData} /> : <LoadingBox />}
    </>
  );
};

export default GitOpsDetailsPage;
