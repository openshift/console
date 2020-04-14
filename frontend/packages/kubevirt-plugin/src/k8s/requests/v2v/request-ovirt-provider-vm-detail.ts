import { PatchBuilder } from '@console/shared/src/k8s';
import { EnhancedK8sMethods } from '../../enhancedK8sMethods/enhancedK8sMethods';
import { OVirtProviderModel } from '../../../models';

const { warn } = console;

export const requestOvirtProviderCRVMDetail = async (
  {
    vmID,
    ovirtProviderCRName,
    namespace,
  }: { vmID: string; ovirtProviderCRName: string; namespace: string },
  { k8sGet, k8sPatch }: EnhancedK8sMethods,
) => {
  const safeVMID = (vmID || '').trim();

  // OvirtPRovider object can be reused or re-queried here. The later option helps to minimize conflicts.
  const ovirtProviderCR = await k8sGet(OVirtProviderModel, ovirtProviderCRName, namespace);

  // Strategic merge patches seem not to work, so let's do mapping via positional arrays.
  // Probably not a big deal as the controller is designed to avoid VMs list refresh
  const index = (ovirtProviderCR?.spec?.vms || []).findIndex((vm) => vm?.id === safeVMID);

  if (index >= 0) {
    // the controller will supply details for the selected VM
    await k8sPatch(OVirtProviderModel, ovirtProviderCR, [
      new PatchBuilder(`/spec/vms/${index}`)
        .setObjectUpdate('detailRequest', true, ovirtProviderCR.spec.vms[index])
        .build(),
    ]);
  } else {
    warn(
      'requestOvirtProviderCRVMDetail: The retrieved OvirtProvider object is missing desired VM: "',
      safeVMID,
      '", ',
      ovirtProviderCR,
    );
  }
};
