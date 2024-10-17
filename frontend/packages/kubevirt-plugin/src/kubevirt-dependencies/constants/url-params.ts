import { VirtualMachineModel } from '../models';
import { kubevirtReferenceForModel } from '../models/kubevirtReferenceForModel';

export const VIRTUALMACHINES_BASE_URL = kubevirtReferenceForModel(VirtualMachineModel);
export const VIRTUALMACHINES_TEMPLATES_BASE_URL = 'virtualmachinetemplates';
