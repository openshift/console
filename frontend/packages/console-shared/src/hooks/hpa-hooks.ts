import * as React from 'react';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { HorizontalPodAutoscalerModel } from '@console/internal/models';
import { HorizontalPodAutoscalerKind } from '@console/internal/module/k8s';
import { doesHpaMatch } from '../utils/hpa-utils';

export const useRelatedHPA = (
  workloadAPI: string,
  workloadKind: string,
  workloadName: string,
  workloadNamespace: string,
): [HorizontalPodAutoscalerKind, boolean, string] => {
  // useRelatedHPA is used by PodRing which will be shown many many times on the topology.
  // The topology loads all HPAs itself via useK8sWatchResource, and because our watch
  // hooks are smart enough to do not watch the same resources twice, we can do this here
  // without additional API calls.
  // See also packages/topology/src/data-transforms/ModelContext.ts (getBaseWatchedResources)
  const [hpas, loaded, error] = useK8sWatchResource<HorizontalPodAutoscalerKind[]>({
    kind: HorizontalPodAutoscalerModel.kind,
    namespace: workloadNamespace,
    optional: true,
    isList: true,
  });

  const matchingHpa = React.useMemo<HorizontalPodAutoscalerKind>(() => {
    if (hpas && loaded && !error) {
      return hpas.find(
        doesHpaMatch({
          apiVersion: workloadAPI,
          kind: workloadKind,
          metadata: { name: workloadName },
        }),
      );
    }
    return undefined; // similar to .find(() => false)
  }, [hpas, loaded, error, workloadAPI, workloadKind, workloadName]);

  return [matchingHpa, loaded, error];
};
