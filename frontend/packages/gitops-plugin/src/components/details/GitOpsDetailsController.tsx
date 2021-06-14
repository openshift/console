import * as React from 'react';
import { TFunction } from 'i18next';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { routeDecoratorIcon } from '@console/dev-console/src/components/import/render-utils';
import GitOpsEmptyState from '../GitOpsEmptyState';
import { WORKLOAD_KINDS, GitOpsResource, GitOpsEnvironment } from '../utils/gitops-types';
import CommitDetails from './CommitDetails';
import GitOpsDetails from './GitOpsDetails';
import PodRingWrapper from './PodRingWrapper';
import TimestampWrapper from './TimestampWrapper';

interface GitOpsDetailsControllerProps {
  envsData: GitOpsEnvironment[];
  emptyStateMsg: string;
  appName: string;
}

const getWorkLoad = (resources: GitOpsResource[]) => {
  return _.find(resources, (res) => _.includes(WORKLOAD_KINDS, res.kind));
};

const getTransformedServices = (originalEnv: GitOpsEnvironment, t: TFunction) => {
  return _.sortBy(
    _.map(originalEnv?.services, (service) => {
      const workload = getWorkLoad(service?.resources);
      const image = service?.images?.[0];
      return {
        ...service,
        source: {
          ...service?.source,
          icon: routeDecoratorIcon(service?.source?.url, 12, t),
        },
        workloadKind: workload?.kind,
        image,
        podRing: <PodRingWrapper workload={workload} />,
        commitDetails: <CommitDetails imageName={image} />,
      };
    }),
    ['name'],
  );
};

const getTransformedEnvsData = (originalEnvsData: GitOpsEnvironment[], t: TFunction) => {
  return _.map(originalEnvsData, (env) => {
    if (env) {
      const resModels = _.flatten(_.map(env?.services, (service) => service.resources));
      const timestamp = <TimestampWrapper resModels={resModels} />;
      const services = getTransformedServices(env, t);
      return {
        ...env,
        services,
        timestamp,
      };
    }
    return undefined;
  });
};

const GitOpsDetailsController: React.FC<GitOpsDetailsControllerProps> = ({
  envsData,
  emptyStateMsg,
  appName,
}) => {
  const { t } = useTranslation();
  const envs = React.useMemo(() => getTransformedEnvsData(envsData, t), [envsData, t]);

  return emptyStateMsg ? (
    <GitOpsEmptyState emptyStateMsg={emptyStateMsg} />
  ) : (
    <GitOpsDetails envs={envs} appName={appName} />
  );
};

export default GitOpsDetailsController;
