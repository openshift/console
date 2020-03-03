import { VMGenericLikeEntityKind } from '../../../types/vmLike';
import { VMWrapper } from '../vm/vm-wrapper';
import { VMIWrapper } from '../vm/vmi-wrapper';
import { asVM, isVMI } from '../../../selectors/vm/vmlike';
import { VMILikeWrapper } from '../types/vmlike';

export const asVMILikeWrapper = (vmLikeEntity: VMGenericLikeEntityKind): VMILikeWrapper => {
  if (!vmLikeEntity) {
    return null;
  }

  if (isVMI(vmLikeEntity)) {
    return VMIWrapper.initialize(vmLikeEntity);
  }

  return VMWrapper.initialize(asVM(vmLikeEntity));
};
