import * as React from 'react';
import * as _ from 'lodash';
import GitOpsDetails from './GitOpsDetails';
import { routeDecoratorIcon } from '../../import/render-utils';
import PodRingWrapper from './PodRingWrapper';
import TimestampWrapper from './TimestampWrapper';
import { WORKLOAD_KINDS, GitOpsResource, GitOpsEnvironment } from '../utils/gitops-types';
import CommitDetails from './CommitDetails';
import GitOpsEmptyState from '../GitOpsEmptyState';

interface GitOpsDetailsControllerProps {
  envsData: GitOpsEnvironment[];
  emptyStateMsg: string;
}

const getWorkLoad = (resources: GitOpsResource[]) => {
  return _.find(resources, (res) => _.includes(WORKLOAD_KINDS, res.kind));
};

const getTransformedServices = (originalEnv: GitOpsEnvironment) => {
  return _.sortBy(
    _.map(originalEnv?.services, (service) => {
      const workload = getWorkLoad(service?.resources);
      const image = service?.images?.[0];
      return {
        ...service,
        source: {
          ...service?.source,
          icon: routeDecoratorIcon(service?.source?.url, 12),
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

const getTransformedEnvsData = (originalEnvsData: GitOpsEnvironment[]) => {
  return _.map(originalEnvsData, (env) => {
    if (env) {
      const resModels = _.flatten(_.map(env?.services, (service) => service.resources));
      const timestamp = <TimestampWrapper resModels={resModels} />;
      const services = getTransformedServices(env);
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
}) => {
  const envs = React.useMemo(() => getTransformedEnvsData(envsData), [envsData]);

  return emptyStateMsg ? (
    <GitOpsEmptyState emptyStateMsg={emptyStateMsg} />
  ) : (
    <GitOpsDetails envs={envs} />
  );
};

export default GitOpsDetailsController;
