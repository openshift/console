import { get } from 'lodash';
import { withResource } from '@console/shared/src/test-utils/utils';
import { getCloudInitVolume } from '../../src/selectors/vm/selectors';
import { provisionSources, cloudInitScript } from './mocks/mocks';
import { CloudInitConfig } from './types/types';
import { VMBuilder } from './models/vmBuilder';
import { getBasicVMBuilder } from './mocks/vmBuilderPresets';

describe('Kubevirt create VM using cloud-init', () => {
  const leakedResources = new Set<string>();
  const cloudinitConfig: CloudInitConfig = {
    hostname: 'fedora-kubevirt',
    sshKeys: [
      'ssh-rsa ' +
        'AAAAB3NzaC1yc2EAAAADAQABAAABAQCj47ubVnxR16JU7ZfDli3N5QVBAwJBRh2xMryyjk5dtfugo5JIPGB2cyXT' +
        'qEDdzuRmI+Vkb/A5duJyBRlA+9RndGGmhhMnj8and3wu5/cEb7DkF6ZJ25QV4LQx3K/i57LStUHXRTvruHOZ2nCu' +
        'VXWqi7wSvz5YcvEv7O8pNF5uGmqHlShBdxQxcjurXACZ1YY0YDJDr3AJai1KF9zehVJODuSbrnOYpThVWGjFuFAn' +
        'NxbtuZ8EOSougN2aYTf2qr/KFGDHtewIkzZmP6cjzKO5bN3pVbXxmb2Gces/BYHntY4MXBTUqwsmsCRC5SAz14bE' +
        'P/vsLtrNhjq9vCS+BjMT',
    ],
  };
  const customScript: CloudInitConfig = {
    useCustomScript: true,
    customScript: cloudInitScript,
  };

  it('ID(CNV-874) Create vm using hostname and key as cloud-init data', async () => {
    const vm = new VMBuilder(getBasicVMBuilder())
      .setProvisionSource(provisionSources.Container)
      .setCloudInit(cloudinitConfig)
      .build();

    await vm.create();
    await withResource(leakedResources, vm.asResource(), async () => {
      const volumeUserData = get(
        getCloudInitVolume(vm.getResource()),
        'cloudInitNoCloud.userData',
        {},
      );
      expect(volumeUserData).toContain(cloudinitConfig.hostname);
      expect(volumeUserData).toContain(cloudinitConfig.sshKeys[0].substring(8));
    });
  });

  it('ID(CNV-4022) Create VM using custom script as cloud-init data', async () => {
    const vm = new VMBuilder(getBasicVMBuilder())
      .setProvisionSource(provisionSources.Container)
      .setCloudInit(customScript)
      .build();

    await vm.create();
    await withResource(leakedResources, vm.asResource(), async () => {
      const volumeUserData = get(
        getCloudInitVolume(vm.getResource()),
        'cloudInitNoCloud.userData',
        {},
      );
      expect(volumeUserData).toContain(customScript.customScript);
    });
  });
});
