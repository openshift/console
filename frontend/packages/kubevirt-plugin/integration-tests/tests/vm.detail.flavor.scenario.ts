import { execSync } from 'child_process';
import { browser } from 'protractor';
import { testName } from '@console/internal-integration-tests/protractor.conf';
import {
  click,
  createResource,
  deleteResource,
  fillInput,
  removeLeakedResources,
  withResource,
} from '@console/shared/src/test-utils/utils';
import { getCPU, getMemory } from '../../src/selectors/vm/selectors';
import * as editFlavorView from '../views/dialogs/editFlavorView';
import { saveButton } from '../views/kubevirtUIResource.view';
import * as virtualMachineView from '../views/virtualMachine.view';
import { getTestDataVolume } from './mocks/mocks';
import { getBasicVMBuilder } from './mocks/vmBuilderPresets';
import { VMBuilder } from './models/vmBuilder';
import { CLONE_VM_TIMEOUT_SECS } from './utils/constants/common';
import { ProvisionSource } from './utils/constants/enums/provisionSource';
import { selectOptionByText } from './utils/utils';

describe('KubeVirt VM detail - edit flavor', () => {
  const leakedResources = new Set<string>();
  const dvName = 'testdv-flavor';
  const testDataVolume = getTestDataVolume(dvName);
  const vm = new VMBuilder(getBasicVMBuilder())
    .setProvisionSource(ProvisionSource.DISK)
    .setPVCName(dvName)
    .build();

  beforeAll(() => {
    createResource(testDataVolume);
    execSync(`oc wait -n ${testName} --for condition=Ready DataVolume ${dvName} --timeout=100s`);
  });

  afterEach(() => {
    removeLeakedResources(leakedResources);
  });

  afterAll(() => {
    deleteResource(testDataVolume);
  });

  it(
    'ID(CNV-3076) Changes tiny to custom',
    async () => {
      await vm.create();
      await withResource(leakedResources, vm.asResource(), async () => {
        await vm.navigateToDetail();
        const template = await virtualMachineView.vmDetailLabelValue('vm.kubevirt.io/template');
        await vm.modalEditFlavor();
        await selectOptionByText(editFlavorView.flavorDropdown, 'Custom');
        await fillInput(editFlavorView.cpusInput(), '2');
        await fillInput(editFlavorView.memoryInput(), '3');
        await click(saveButton);

        await browser.wait(() => (getCPU(vm.getResource()).cores as any) === 2, 5000);
        await browser.wait(() => getMemory(vm.getResource()) === '3Gi', 5000);
        expect(await virtualMachineView.vmDetailLabelValue('vm.kubevirt.io/template')).toEqual(
          template,
        ); // template is not changed (might be in the future)
      });
    },
    CLONE_VM_TIMEOUT_SECS,
  );
});
