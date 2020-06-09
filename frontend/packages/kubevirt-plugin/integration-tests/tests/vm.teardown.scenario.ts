import { VM_ACTION } from './utils/consts';
import { vm } from './vm.setup.scenario';

describe('KubeVirt VM teardown', () => {
  it('Kubevirt VM delete', async () => {
    await vm.action(VM_ACTION.Delete, false);
  });
});
