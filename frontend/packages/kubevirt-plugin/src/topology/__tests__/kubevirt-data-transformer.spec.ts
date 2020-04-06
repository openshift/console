import {
  allowedResources,
  transformTopologyData,
} from '@console/dev-console/src/components/topology';
import { kubevirtResources } from './topology-kubevirt-test-data';
import { VirtualMachineModel } from '../../models';
import { VMStatus } from '../../constants/vm/vm-status';

describe('knative data transformer ', () => {
  it('should return transformed VMs', () => {
    const result = transformTopologyData(kubevirtResources as any, allowedResources);
    const vmIds = Object.keys(result.topology).filter((key) => {
      return result.topology[key].resources.obj.kind === VirtualMachineModel.kind;
    });
    expect(vmIds).toHaveLength(2);

    const vmData = result.topology[vmIds[0]].data as any;
    expect(vmData.statusDetail.status.getValue()).toEqual(VMStatus.RUNNING.getValue());
    expect(vmData.statusDetail.launcherPod).not.toBeNull();
    expect(vmData.vmi).not.toBeNull();
  });
});
