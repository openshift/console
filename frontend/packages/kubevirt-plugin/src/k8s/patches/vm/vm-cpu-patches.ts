import { PatchBuilder, PatchOperation } from '@console/shared/src/k8s';
import { Patch } from '@console/internal/module/k8s';
import { VMLikeEntityKind } from '../../../types';
import { getVMLikePatches } from '../vm-template';
import {
  getCPU,
  getResourcesRequestsCPUCount,
  getResourcesLimitsCPUCount,
  asVM,
} from '../../../selectors/vm';

export const getDedicatedCpuPatch = (
  vmLikeEntity: VMLikeEntityKind,
  dedicatedCpuPlacement: boolean,
): Patch[] => {
  const vm = asVM(vmLikeEntity);
  const isCPUAvailable = !!getCPU(vm);
  const patches = [];

  if (isCPUAvailable) {
    patches.push(
      new PatchBuilder('/spec/template/spec/domain/cpu/dedicatedCpuPlacement')
        .setOperation(PatchOperation.REPLACE)
        .setValue(dedicatedCpuPlacement)
        .build(),
    );
  } else {
    const resourcesCPU = getResourcesRequestsCPUCount(vm) || getResourcesLimitsCPUCount(vm);
    patches.push(
      new PatchBuilder('/spec/template/spec/domain/cpu')
        .setOperation(PatchOperation.REPLACE)
        .setValue(resourcesCPU ? { dedicatedCpuPlacement } : { cores: 1, dedicatedCpuPlacement })
        .build(),
    );
  }

  return getVMLikePatches(vmLikeEntity, () => patches);
};
