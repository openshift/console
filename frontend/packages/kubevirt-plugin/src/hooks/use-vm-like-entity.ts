import * as React from 'react';

import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { getName, getNamespace } from '@console/shared/src/selectors/common';

import { getVMLikeModel } from '../selectors/vm';
import { VMGenericLikeEntityKind } from '../types/vmLike';
import { kvReferenceForModel } from '../models/kvReferenceForModel';

export const useUpToDateVMLikeEntity = <P extends VMGenericLikeEntityKind>(vmLikeEntity: P): P => {
  const vmName = getName(vmLikeEntity);
  const namespace = getNamespace(vmLikeEntity);
  const model = getVMLikeModel(vmLikeEntity);
  const resourceWatch = React.useMemo(() => {
    return {
      name: vmName,
      kind: kvReferenceForModel(model),
      namespace,
      isList: false,
    };
  }, [model, namespace, vmName]);

  const [data, loaded, loadError] = useK8sWatchResource(resourceWatch);

  if (loadError) {
    return null;
  }

  if (!loaded) {
    return vmLikeEntity;
  }
  return data as P;
};
