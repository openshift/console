import { testName } from '@console/internal-integration-tests/protractor.conf';
import { withResource } from '@console/shared/src/test-utils/utils';
import { getCloudInitUserData } from '../../src/selectors/vm/selectors';
import { basicVMConfig } from './utils/mocks';
import { CloudInitConfig, ProvisionConfig } from './utils/types';
import { getResourceObject } from './utils/utils';
import { vmConfig, CONFIG_NAME_CONTAINER } from './vm.wizard.configs';
import { VirtualMachine } from './models/virtualMachine';

describe('Kubevirt create VM using cloud-init', () => {
  const leakedResources = new Set<string>();

  const sourceContainer = 'kubevirt/fedora-cloud-container-disk-demo';
  const provisionConfig: ProvisionConfig = {
    provision: {
      method: CONFIG_NAME_CONTAINER,
      source: sourceContainer,
    },
    networkResources: [],
    storageResources: [],
  };

  const hostnameAndKey: CloudInitConfig = {
    useCloudInit: true,
    hostname: 'fedora-kubevirt',
    sshKey:
      'ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQCj47ubVnxR16JU7ZfDli3N5QVBAwJBRh2xMryyjk5dtfugo5JIPGB2cyXTqEDdzuRmI+Vkb/A5duJyBRlA+9RndGGmhhMnj8and3wu5/cEb7DkF6ZJ25QV4LQx3K/i57LStUHXRTvruHOZ2nCuVXWqi7wSvz5YcvEv7O8pNF5uGmqHlShBdxQxcjurXACZ1YY0YDJDr3AJai1KF9zehVJODuSbrnOYpThVWGjFuFAnNxbtuZ8EOSougN2aYTf2qr/KFGDHtewIkzZmP6cjzKO5bN3pVbXxmb2Gces/BYHntY4MXBTUqwsmsCRC5SAz14bEP/vsLtrNhjq9vCS+BjMT',
  };

  const customScript: CloudInitConfig = {
    useCloudInit: true,
    useCustomScript: true,
    customScript: basicVMConfig.cloudInitScript,
  };

  it('Create vm using hostname and key as cloud-init data', async () => {
    const vmName = 'vm-cloudinit-hostname-key';
    const testVMConfig = vmConfig(vmName, provisionConfig, testName);
    testVMConfig.cloudInit = hostnameAndKey;

    const vm = new VirtualMachine(testVMConfig);
    await withResource(leakedResources, vm.asResource(), async () => {
      await vm.create(testVMConfig);
      const volume = getCloudInitUserData(getResourceObject(vm.name, vm.namespace, vm.kind));
      expect(volume).toContain(hostnameAndKey.hostname);
      expect(volume).toContain(hostnameAndKey.sshKey.substring(8));
    });
  });

  it('Create VM using custom script as cloud-init data', async () => {
    const vmName = 'vm-cloudinit-customscript';
    const testVMConfig = vmConfig(vmName, provisionConfig, testName);
    testVMConfig.cloudInit = customScript;

    const vm = new VirtualMachine(testVMConfig);
    await withResource(leakedResources, vm.asResource(), async () => {
      await vm.create(testVMConfig);
      const volume = getCloudInitUserData(getResourceObject(vm.name, vm.namespace, vm.kind));
      expect(volume).toContain(customScript.customScript);
    });
  });
});
