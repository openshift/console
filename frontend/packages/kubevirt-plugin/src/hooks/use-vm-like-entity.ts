import * as React from 'react';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { TemplateModel } from '@console/internal/models';
import { VirtualMachineModel } from '../models';
import { kubevirtReferenceForModel } from '../models/kubevirtReferenceForModel';
import { getName, getNamespace } from '../selectors';
import { getVMLikeModel } from '../selectors/vm';
import { VMGenericLikeEntityKind } from '../types/vmLike';

export const useUpToDateVMLikeEntity = <P extends VMGenericLikeEntityKind>(vmLikeEntity: P): P => {
  const vmName = getName(vmLikeEntity);
  const namespace = getNamespace(vmLikeEntity);
  const model = getVMLikeModel(vmLikeEntity);
  const resourceWatch = React.useMemo(() => {
    return {
      name: vmName,
      kind:
        model.kind === VirtualMachineModel.kind
          ? kubevirtReferenceForModel(model)
          : TemplateModel.kind,
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
