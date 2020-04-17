import { VMGenericLikeEntityKind } from '../../../types/vmLike';
import { VMWrapper } from '../vm/vm-wrapper';
import { VMIWrapper } from '../vm/vmi-wrapper';
import { asVM } from '../../../selectors/vm/vmlike';
import { VMILikeWrapper } from '../types/vmlike';
import { isVMI } from '../../../selectors/check-type';

export const asVMILikeWrapper = (
  vmLikeEntity: VMGenericLikeEntityKind,
  copy = false,
): VMILikeWrapper => {
  if (!vmLikeEntity) {
    return null;
  }

  if (isVMI(vmLikeEntity)) {
    return new VMIWrapper(vmLikeEntity, copy);
  }

  return new VMWrapper(asVM(vmLikeEntity), copy);
};
