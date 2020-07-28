import * as React from 'react';
import * as _ from 'lodash';
import GitOpsDetails from './GitOpsDetails';
import { routeDecoratorIcon } from '../../import/render-utils';
import PodRingWrapper from './PodRingWrapper';
import TimestampWrapper from './TimestampWrapper';
import { WORKLOAD_KINDS, GitOpsResource, GitOpsEnvironment } from '../utils/gitops-types';
import CommitDetails from './CommitDetails';

interface GitOpsDetailsControllerProps {
  envsData: GitOpsEnvironment[];
}

const GitOpsDetailsController: React.FC<GitOpsDetailsControllerProps> = ({ envsData }) => {
  const getWorkLoad = (resources: GitOpsResource[]) => {
    return _.find(resources, (res) => _.includes(WORKLOAD_KINDS, res.kind));
  };

  const getTransformedEnvsData = () => {
    return _.map(envsData, (env) => {
      const resModels = _.flatten(_.map(env?.services, (service) => service.resources));
      const services = _.sortBy(
        _.map(env?.services, (service) => {
          const workload = getWorkLoad(service.resources);
          return {
            ...service,
            source: {
              ...service?.source,
              icon: routeDecoratorIcon(service?.source?.url, 12),
            },
            workloadKind: workload?.kind,
            image: service?.images?.[0],
            podRing: <PodRingWrapper workload={workload} />,
            commitDetails: <CommitDetails imageName={service?.images?.[0]} />,
          };
        }),
        ['name'],
      );
      return {
        ...env,
        services,
        timestamp: <TimestampWrapper resModels={resModels} />,
      };
    });
  };

  return <GitOpsDetails envs={getTransformedEnvsData()} />;
};

export default GitOpsDetailsController;
