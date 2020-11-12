import * as React from 'react';
import * as _ from 'lodash';
import {
  apiVersionForModel,
  K8sResourceCommon,
  K8sResourceKind,
} from '@console/internal/module/k8s';
import { useK8sWatchResources } from '@console/internal/components/utils/k8s-watch-hook';
import {
  getReplicaSetsForResource,
  PodControllerOverviewItem,
  useDeepCompareMemoize,
} from '@console/shared/src';
import { DeploymentModel } from '@console/internal/models';

export const usePodsForRevisions = (
  revisionIds: string | string[],
  namespace: string,
): { loaded: boolean; loadError: string; pods: PodControllerOverviewItem[] } => {
  const [loaded, setLoaded] = React.useState<boolean>(false);
  const [loadError, setLoadError] = React.useState<string>('');
  const [pods, setPods] = React.useState<PodControllerOverviewItem[]>();
  const revisions = useDeepCompareMemoize(Array.isArray(revisionIds) ? revisionIds : [revisionIds]);
  const watchedResources = React.useMemo(
    () => ({
      deployments: {
        isList: true,
        kind: 'Deployment',
        namespace,
      },
      replicaSets: {
        isList: true,
        kind: 'ReplicaSet',
        namespace,
      },
      pods: {
        isList: true,
        kind: 'Pod',
        namespace,
      },
    }),
    [namespace],
  );

  const resources = useK8sWatchResources<{ [key: string]: K8sResourceCommon[] }>(watchedResources);

  React.useEffect(() => {
    const errorKey = Object.keys(resources).find((key) => resources[key].loadError);
    if (errorKey) {
      setLoadError(resources[errorKey].loadError);
      return;
    }
    if (
      Object.keys(resources).length > 0 &&
      Object.keys(resources).every((key) => resources[key].loaded)
    ) {
      const revisionsPods = revisions.reduce((acc, uid) => {
        const associatedDeployment = _.filter(
          resources?.deployments?.data,
          ({ metadata: { ownerReferences } }) => _.some(ownerReferences, { uid, controller: true }),
        );
        if (associatedDeployment?.[0]) {
          const depObj: K8sResourceKind = {
            ...associatedDeployment[0],
            apiVersion: apiVersionForModel(DeploymentModel),
            kind: DeploymentModel.kind,
          };
          acc.push(...getReplicaSetsForResource(depObj, resources));
        }
        return acc;
      }, []);
      setLoaded(true);
      setLoadError(null);
      setPods(revisionsPods);
    }
  }, [resources, revisions]);

  return { loaded, loadError, pods };
};
