import * as React from 'react';
import { useK8sWatchResources } from '@console/internal/components/utils/k8s-watch-hook';
import { K8sResourceKind, referenceForModel } from '@console/internal/module/k8s';
import { CAMEL_K_OPERATOR_NS, GLOBAL_OPERATOR_NS } from '../const';
import { CamelKameletModel } from '../models';

export const useKameletsData = (namespace: string): [K8sResourceKind[], boolean, any] => {
  const [kamelets, setKamelets] = React.useState<K8sResourceKind[]>([]);
  const [kameletsLoaded, setKameletsLoaded] = React.useState(false);
  const [kameletsLoadError, setKameletsLoadError] = React.useState(null);

  const watchedResources = React.useMemo(
    () => ({
      kamelets: {
        isList: true,
        kind: referenceForModel(CamelKameletModel),
        namespace,
        optional: true,
      },
      kameletsGlobalNs: {
        isList: true,
        kind: referenceForModel(CamelKameletModel),
        namespace: GLOBAL_OPERATOR_NS,
        optional: true,
      },
      kameletsGlobalNs2: {
        isList: true,
        kind: referenceForModel(CamelKameletModel),
        namespace: CAMEL_K_OPERATOR_NS,
        optional: true,
      },
    }),
    [namespace],
  );

  const extraResources = useK8sWatchResources<{
    [key: string]: K8sResourceKind[];
  }>(watchedResources);

  React.useEffect(() => {
    const resDataLoaded = Object.keys(extraResources).every((key) => extraResources[key].loaded);
    const resDataloadError = Object.keys(extraResources).every(
      (key) => extraResources[key].loadError,
    );
    const { kamelets: kameletsData, kameletsGlobalNs, kameletsGlobalNs2 } = extraResources;
    if (resDataLoaded) {
      if (kameletsData.data.length > 0) {
        setKamelets(kameletsData.data);
      } else if (kameletsGlobalNs.data.length > 0) {
        setKamelets(kameletsGlobalNs.data);
      } else {
        setKamelets(kameletsGlobalNs2.data);
      }
      setKameletsLoaded(kameletsData.loaded || kameletsGlobalNs.loaded || kameletsGlobalNs2.loaded);
    } else if (resDataloadError) {
      setKameletsLoadError(
        kameletsGlobalNs.loadError || kameletsGlobalNs.loadError || kameletsGlobalNs2.loadError,
      );
    }
  }, [extraResources]);

  return [kamelets, kameletsLoaded, kameletsLoadError];
};
