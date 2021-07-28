import { VMKind } from '../../types/vm';
import { VMGenericLikeEntityKind } from '../../types/vmLike';
import { isVM, isVMI } from '../check-type';
import { selectVM } from '../vm-template/basic';

export const asVM = (vmLikeEntity: VMGenericLikeEntityKind): VMKind => {
  if (!vmLikeEntity || isVMI(vmLikeEntity)) {
    return null;
  }

  return isVM(vmLikeEntity) ? vmLikeEntity : selectVM(vmLikeEntity);
};
