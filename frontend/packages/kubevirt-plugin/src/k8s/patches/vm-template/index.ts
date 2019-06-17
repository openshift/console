import { TemplateKind } from '@console/internal/module/k8s';
import { Patch, VMLikeEntityKind, VMKind } from '../../../types';
import { isVm } from '../../../selectors/selectors';
import { selectVm } from '../../../selectors/vm-template/selectors';

export const addPrefixToPatch = (prefix: string, patch: Patch): Patch => ({
  ...patch,
  path: `${prefix}${patch.path}`,
});

export const getTemplatePatchPrefix = (vmTemplate: TemplateKind, vm: VMKind): string => {
  const vmIndex = vmTemplate.objects.indexOf(vm);
  return vmIndex < 0 ? null : `/objects/${vmIndex}`;
};

export const getVmLikePatches = (
  vmLikeEntity: VMLikeEntityKind,
  patchesSupplier: (vm: VMKind) => Patch[],
): Patch[] => {
  let vm;
  let templatePrefix = null;
  if (isVm(vmLikeEntity)) {
    vm = vmLikeEntity;
  } else {
    vm = selectVm(vmLikeEntity as TemplateKind);
    templatePrefix = getTemplatePatchPrefix(vmLikeEntity as TemplateKind, vm);
  }

  const patches = vm ? patchesSupplier(vm) : [];

  return templatePrefix ? patches.map((p) => addPrefixToPatch(templatePrefix, p)) : patches;
};
