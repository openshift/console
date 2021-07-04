import { getName, getNamespace } from '@console/shared';
import { VirtualMachineInstanceModel } from '../../models';
import { getKubevirtModelAvailableVersion } from '../../models/kubevirtReferenceForModel';
import { VMIKind } from '../../types/vm';
import { getConsoleAPIBase } from '../../utils/url';

export const getVMISubresourcePath = () =>
  `${getConsoleAPIBase()}/apis/subresources.${VirtualMachineInstanceModel.apiGroup}`;

export const getVMIApiPath = (vmi: VMIKind) =>
  `${getKubevirtModelAvailableVersion(VirtualMachineInstanceModel)}/namespaces/${getNamespace(
    vmi,
  )}/${VirtualMachineInstanceModel.plural}/${getName(vmi)}`;
