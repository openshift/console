import * as _ from 'lodash';

import { VirtualMachineModel } from '../../../../../public/models';
import { getVMStatus } from '../../../../../public/extend/kubevirt/module/k8s/vms';

// TODO: add this to __mocks__/k8sResourcesMocks module, should be in sync
// with VirtualMachine YAML template defined in public/models/yaml-templates
const testVirtualMachine = {
  apiVersion: `${VirtualMachineModel.apiGroup}/${VirtualMachineModel.apiVersion}`,
  kind: 'VirtualMachine',
  metadata: {
    name: 'example',
    namespace: 'default',
  },
  spec: {
    running: false,
    template: {
      // TODO: empty for now, see above comment
    },
  },
};

describe('getVMStatus', () => {
  it('returns the status string based on spec.running', () => {
    const vm1 = _.cloneDeep(testVirtualMachine);
    vm1.spec.running = true;
    expect(getVMStatus(vm1)).toBe('Running');

    const vm2 = _.cloneDeep(testVirtualMachine);
    vm2.spec.running = false;
    expect(getVMStatus(vm2)).toBe('Stopped');

    const vm3 = _.cloneDeep(testVirtualMachine);
    vm3.spec.running = undefined;
    expect(getVMStatus(vm3)).toBe('Stopped');
  });
});
