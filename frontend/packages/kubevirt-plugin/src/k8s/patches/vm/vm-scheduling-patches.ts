import { PatchBuilder } from '@console/shared/src/k8s';
import { Patch, Toleration } from '@console/internal/module/k8s';
import { NodeSelector } from '../../../types/vm';
import { VMLikeEntityKind } from '../../../types/vmLike';
import { getVMLikePatches } from '../vm-template';
import { Affinity } from '../../../components/modals/scheduling-modals/affinity-modal/types';

export const getNodeSelectorPatches = (
  vmLikeEntity: VMLikeEntityKind,
  selectors: NodeSelector,
): Patch[] =>
  getVMLikePatches(vmLikeEntity, () => [
    new PatchBuilder('/spec/template/spec/nodeSelector').replace(selectors).build(),
  ]);

export const getTolerationsPatch = (
  vmLikeEntity: VMLikeEntityKind,
  tolerations: Toleration[],
): Patch[] => {
  const tolerationsWithOperator = tolerations.map(({ effect, key, tolerationSeconds, value }) => ({
    key,
    value,
    effect,
    operator: value ? 'Equal' : 'Exists',
    tolerationSeconds,
  }));

  return getVMLikePatches(vmLikeEntity, () => [
    new PatchBuilder('/spec/template/spec/tolerations').replace(tolerationsWithOperator).build(),
  ]);
};

export const getAffinityPatch = (vmLikeEntity: VMLikeEntityKind, affinity: Affinity): Patch[] =>
  getVMLikePatches(vmLikeEntity, () => [
    new PatchBuilder('/spec/template/spec/affinity').replace(affinity).build(),
  ]);
