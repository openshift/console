import { getName, getNamespace } from '@console/shared';
import { VirtualMachineInstanceModel } from '../../models';
import { getConsoleAPIBase } from '../../utils/url';
import { VMIKind } from '../../types/vm';

export const getVMISubresourcePath = () =>
  `${getConsoleAPIBase()}/apis/subresources.${VirtualMachineInstanceModel.apiGroup}`;

export const getVMIApiPath = (vmi: VMIKind) =>
  `${VirtualMachineInstanceModel.apiVersion}/namespaces/${getNamespace(vmi)}/${
    VirtualMachineInstanceModel.plural
  }/${getName(vmi)}`;
