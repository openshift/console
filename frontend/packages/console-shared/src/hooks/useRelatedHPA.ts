import { useMemo } from 'react';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { HorizontalPodAutoscalerModel } from '@console/internal/models';
import type { HorizontalPodAutoscalerKind } from '@console/internal/module/k8s';
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

  const matchingHpa = useMemo<HorizontalPodAutoscalerKind>(() => {
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

  // The topology renders one PodSet (via PodRing) per workload, and each one watches
  // the whole namespace HPA list through the shared, network-deduped watch above.
  // getReduxData rebuilds that list on every HPA watch event, so `matchingHpa` is a
  // brand-new object reference on every event even when this workload's HPA did not
  // change. That re-rendered all N memoized PodStatus SVGs on every event and froze
  // the browser main thread in large namespaces (OCPBUGS-114039). Keep the previous
  // reference as long as the matched HPA is unchanged (same uid + resourceVersion),
  // so an unrelated HPA event no longer re-renders this node.
  const uid = matchingHpa?.metadata?.uid;
  const resourceVersion = matchingHpa?.metadata?.resourceVersion;
  // Intentionally keyed on the HPA identity (uid + resourceVersion) rather than on
  // matchingHpa, so the returned reference stays stable while the matched HPA's
  // content is unchanged.
  // eslint-disable-next-line react-hooks-js/exhaustive-deps
  const stableHpa = useMemo<HorizontalPodAutoscalerKind>(() => matchingHpa, [uid, resourceVersion]);

  return [stableHpa, loaded, error];
};
