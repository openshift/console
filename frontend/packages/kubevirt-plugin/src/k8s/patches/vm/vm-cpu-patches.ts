import { Patch } from '@console/internal/module/k8s';
import {
  asVM,
  getCPU,
  getResourcesLimitsCPUCount,
  getResourcesRequestsCPUCount,
} from '../../../selectors/vm';
import { VMLikeEntityKind } from '../../../types/vmLike';
import { PatchBuilder } from '../../helpers/patch';
import { getVMLikePatches } from '../vm-template';

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
        .replace(dedicatedCpuPlacement)
        .build(),
    );
  } else {
    const resourcesCPU = getResourcesRequestsCPUCount(vm) || getResourcesLimitsCPUCount(vm);
    patches.push(
      new PatchBuilder('/spec/template/spec/domain/cpu')
        .replace(resourcesCPU ? { dedicatedCpuPlacement } : { cores: 1, dedicatedCpuPlacement })
        .build(),
    );
  }

  return getVMLikePatches(vmLikeEntity, () => patches);
};
