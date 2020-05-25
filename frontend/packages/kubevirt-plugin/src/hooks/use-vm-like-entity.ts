import * as React from 'react';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { getName, getNamespace } from '@console/shared/src/selectors/common';
import { VMLikeEntityKind } from '../types/vmLike';
import { getVMLikeModel } from '../selectors/vm';

export const useUpToDateVMLikeEntity = (vmLikeEntity: VMLikeEntityKind): VMLikeEntityKind => {
  const vmName = getName(vmLikeEntity);
  const namespace = getNamespace(vmLikeEntity);
  const model = getVMLikeModel(vmLikeEntity);
  const resourceWatch = React.useMemo(() => {
    return {
      name: vmName,
      kind: model.kind,
      namespace,
      isList: false,
    };
  }, [model.kind, namespace, vmName]);

  const [data, loaded, loadError] = useK8sWatchResource(resourceWatch);

  if (loadError) {
    return null;
  }

  if (!loaded) {
    return vmLikeEntity;
  }
  return data as VMLikeEntityKind;
};
