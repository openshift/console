import { isVMI } from '../../../selectors/check-type';
import { asVM } from '../../../selectors/vm/vm';
import { VMGenericLikeEntityKind } from '../../../types/vmLike';
import { VMILikeWrapper } from '../types/vmlike';
import { VMWrapper } from '../vm/vm-wrapper';
import { VMIWrapper } from '../vm/vmi-wrapper';

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
