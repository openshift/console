import * as React from 'react';
import { useK8sWatchResource } from '../../../../public/components/utils/k8s-watch-hook';
import { HyperConvergedModel } from '../models';
import { kubevirtReferenceForModel } from '../models/kubevirtReferenceForModel';

export const useHyperconvergedCR = () => {
  const hcWatchResource = React.useMemo(() => {
    return {
      kind: kubevirtReferenceForModel(HyperConvergedModel),
      isList: true,
    };
  }, []);

  const [hcList, hcLoaded, loadError] = useK8sWatchResource<any>(hcWatchResource);

  return [hcList[0], hcLoaded, loadError];
};
