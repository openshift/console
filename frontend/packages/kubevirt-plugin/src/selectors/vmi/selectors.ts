import { getCSRFToken } from '@console/internal/co-fetch';
import { getName, getNamespace } from '@console/shared';
import { VirtualMachineInstanceModel } from '../../models';
import { getConsoleApiBase } from '../../utils/url';
import { VMIKind } from '../../types/vm';

export const getVMISubresourcePath = () =>
  `${getConsoleApiBase()}/apis/subresources.${VirtualMachineInstanceModel.apiGroup}`;

export const getVMIApiPath = (vmi: VMIKind) =>
  `${VirtualMachineInstanceModel.apiVersion}/namespaces/${getNamespace(vmi)}/${
    VirtualMachineInstanceModel.plural
  }/${getName(vmi)}`;

export const getVMIApiQuery = () => `?x-csrf-token=${encodeURIComponent(getCSRFToken())}`;
