import { browser, ExpectedConditions as until } from 'protractor';
import { withResource } from '@console/shared/src/test-utils/utils';
import { isWinToolsImage, getVolumeContainerImage, getVolumes } from '../../src/selectors/vm';
import { VM_BOOTUP_TIMEOUT_SECS } from './utils/constants/common';
import { OperatingSystem } from './utils/constants/wizard';
import { rootDisk, flavorConfigs, provisionSources } from './mocks/mocks';
import { windowsGuestToolsCDElement } from '../views/dialogs/editCDView';
import { VMBuilder } from './models/vmBuilder';
import { getBasicVMBuilder } from './mocks/vmBuilderPresets';

describe('Kubevirt Windows Guest tools', () => {
  const leakedResources = new Set<string>();

  it(
    'ID(CNV-3593) Checks that Guest Tools CD is mounted after Windows VM creation',
    async () => {
      const vm = new VMBuilder(getBasicVMBuilder())
        .setProvisionSource(provisionSources.Container)
        .setOS(OperatingSystem.WINDOWS_10)
        .setFlavor(flavorConfigs.Medium)
        .setDisks([rootDisk])
        .build();

      await vm.create();
      await withResource(leakedResources, vm.asResource(), async () => {
        const isWindowsCDMounted = () =>
          !!getVolumes(vm.getResource()).some((volume) =>
            isWinToolsImage(getVolumeContainerImage(volume)),
          );
        await browser.wait(until.presenceOf(windowsGuestToolsCDElement));
        expect(isWindowsCDMounted()).toBeTruthy();
      });
    },
    VM_BOOTUP_TIMEOUT_SECS,
  );
});
