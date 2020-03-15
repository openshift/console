import { PatchBuilder } from '@console/shared/src/k8s';
import { Patch } from '@console/internal/module/k8s';
import { NodeSelector } from '../../../types/vm';
import { VMLikeEntityKind } from '../../../types/vmLike';
import { getVMLikePatches } from '../vm-template';

export const getNodeSelectorPatches = (
  vmLikeEntity: VMLikeEntityKind,
  selectors: NodeSelector,
): Patch[] =>
  getVMLikePatches(vmLikeEntity, () => [
    new PatchBuilder('/spec/template/spec/nodeSelector').replace(selectors).build(),
  ]);
