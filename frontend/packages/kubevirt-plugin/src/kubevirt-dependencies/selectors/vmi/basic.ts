import { VMIKind } from '../../types/vmi';

export const getVMINodeName = (vmi: VMIKind) => vmi && vmi.status && vmi.status.nodeName;
