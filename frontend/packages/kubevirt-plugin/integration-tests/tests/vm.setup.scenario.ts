import { testName } from '@console/internal-integration-tests/protractor.conf';
import { createResource } from '@console/shared/src/test-utils/utils';
import { VirtualMachine } from './models/virtualMachine';
import { getVMManifest } from './utils/mocks';
import { exposeServices } from './utils/utils';

const cloudInit = `#cloud-config\nuser: cloud-user\npassword: atomic\nchpasswd: {expire: False}`;
export const testVM = getVMManifest('Container', testName, `test-vm-${testName}`, cloudInit);
export const vm = new VirtualMachine(testVM.metadata);
export const nodePortServices;

describe('KubeVirt VM setup', () => {
  const serviceCommon = { name: vm.name, kind: 'vm', type: 'NodePort', namespace: testName };
  nodePortServices = new Set<NodePortService>();
  nodePortServices.add({
    ...serviceCommon,
    exposeName: `${vm.name}-service-ssh`,
    port: '22',
    targetPort: '20022',
  });
  nodePortServices.add({
    ...serviceCommon,
    exposeName: `${vm.name}-service-smtp`,
    port: '25',
    targetPort: '20025',
  });
  nodePortServices.add({
    ...serviceCommon,
    exposeName: `${vm.name}-service-http`,
    port: '80',
    targetPort: '20080',
  });

  beforeAll(async () => {
    createResource(testVM);
    exposeServices(nodePortServices);
  });

  it('Navigate to VM list', async () => {
    await vm.navigateToListView();
  });
});
