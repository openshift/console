import { get } from 'lodash';
import { testName } from '@console/internal-integration-tests/protractor.conf';
import { withResource } from '@console/shared/src/test-utils/utils';
import { getCloudInitVolume } from '../../src/selectors/vm/selectors';
import { basicVMConfig } from './utils/mocks';
import { getResourceObject } from './utils/utils';
import { CloudInitConfig, ProvisionConfig } from './utils/types';
import { ProvisionConfigName } from './utils/constants/wizard';
import { vmConfig } from './vm.wizard.configs';
import { VirtualMachine } from './models/virtualMachine';

describe('Kubevirt create VM using cloud-init', () => {
  const leakedResources = new Set<string>();

  const sourceContainer = 'kubevirt/fedora-cloud-container-disk-demo';
  const provisionConfig: ProvisionConfig = {
    provision: {
      method: ProvisionConfigName.CONTAINER,
      source: sourceContainer,
    },
    networkResources: [],
    storageResources: [],
  };

  const cloudinitConfig: CloudInitConfig = {
    useCloudInit: true,
    hostname: 'fedora-kubevirt',
    sshKeys: [
      'ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQCj47ubVnxR16JU7ZfDli3N5QVBAwJBRh2xMryyjk5dtfugo5JIPGB2cyXTqEDdzuRmI+Vkb/A5duJyBRlA+9RndGGmhhMnj8and3wu5/cEb7DkF6ZJ25QV4LQx3K/i57LStUHXRTvruHOZ2nCuVXWqi7wSvz5YcvEv7O8pNF5uGmqHlShBdxQxcjurXACZ1YY0YDJDr3AJai1KF9zehVJODuSbrnOYpThVWGjFuFAnNxbtuZ8EOSougN2aYTf2qr/KFGDHtewIkzZmP6cjzKO5bN3pVbXxmb2Gces/BYHntY4MXBTUqwsmsCRC5SAz14bEP/vsLtrNhjq9vCS+BjMT',
    ],
  };

  const customScript: CloudInitConfig = {
    useCloudInit: true,
    useCustomScript: true,
    customScript: basicVMConfig.cloudInitScript,
  };

  it('ID(CNV-874) Create vm using hostname and key as cloud-init data', async () => {
    const testVMConfig = vmConfig('vm-cloudinit-hostname-key', testName, provisionConfig);
    testVMConfig.cloudInit = cloudinitConfig;
    testVMConfig.startOnCreation = false;

    const vm = new VirtualMachine(testVMConfig);
    await withResource(leakedResources, vm.asResource(), async () => {
      await vm.create(testVMConfig);
      const volumeUserData = get(
        getCloudInitVolume(getResourceObject(vm.name, vm.namespace, vm.kind)),
        'cloudInitNoCloud.userData',
        {},
      );
      expect(volumeUserData).toContain(cloudinitConfig.hostname);
      expect(volumeUserData).toContain(cloudinitConfig.sshKeys[0].substring(8));
    });
  });

  it('ID(CNV-4022) Create VM using custom script as cloud-init data', async () => {
    const testVMConfig = vmConfig('vm-cloudinit-customscript', testName, provisionConfig);
    testVMConfig.cloudInit = customScript;
    testVMConfig.startOnCreation = false;

    const vm = new VirtualMachine(testVMConfig);
    await withResource(leakedResources, vm.asResource(), async () => {
      await vm.create(testVMConfig);
      const volumeUserData = get(
        getCloudInitVolume(getResourceObject(vm.name, vm.namespace, vm.kind)),
        'cloudInitNoCloud.userData',
        {},
      );
      expect(volumeUserData).toContain(customScript.customScript);
    });
  });
});
