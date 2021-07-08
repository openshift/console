import { getName, getNamespace } from '@console/shared';
import { VirtualMachineInstanceModel } from '../../models';
import { VMIKind } from '../../types/vm';
import { getConsoleAPIBase } from '../../utils/url';

export const getVMISubresourcePath = () =>
  `${getConsoleAPIBase()}/apis/subresources.${VirtualMachineInstanceModel.apiGroup}`;

export const getVMIApiPath = (vmi: VMIKind) =>
  `${VirtualMachineInstanceModel.apiVersion}/namespaces/${getNamespace(vmi)}/${
    VirtualMachineInstanceModel.plural
  }/${getName(vmi)}`;
