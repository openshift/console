import { PatchBuilder } from '@console/shared/src/k8s';
import { EnhancedK8sMethods } from '../../enhancedK8sMethods/enhancedK8sMethods';
import { V2VVMwareModel } from '../../../models';

const { warn } = console;

export const requestV2VMwareVMDetail = async (
  {
    vmName,
    v2vwmwareName,
    namespace,
  }: { vmName: string; v2vwmwareName: string; namespace: string },
  { k8sGet, k8sPatch }: EnhancedK8sMethods,
) => {
  const safeVMName = (vmName || '').trim();

  // V2VVMWare object can be reused or re-queried here. The later option helps to minimize conflicts.
  const v2vvmware = await k8sGet(V2VVMwareModel, v2vwmwareName, namespace);

  // Strategic merge patches seem not to work, so let's do mapping via positional arrays.
  // Probably not a big deal as the controller is designed to avoid VMs list refresh
  const index = (v2vvmware?.spec?.vms || []).findIndex((vm) => vm?.name === safeVMName);

  if (index >= 0) {
    // the controller will supply details for the selected VM
    await k8sPatch(V2VVMwareModel, v2vvmware, [
      new PatchBuilder(`/spec/vms/${index}`)
        .setObjectUpdate('detailRequest', true, v2vvmware.spec.vms[index])
        .build(),
    ]);
  } else {
    warn(
      'onVCenterVmSelectedConnected: The retrieved V2VVMware object is missing desired VM: "',
      safeVMName,
      '", ',
      v2vvmware,
    );
  }
};
