import { execSync } from 'child_process';
import { testName } from '@console/internal-integration-tests/protractor.conf';
import {
  click,
  createResource,
  deleteResource,
  fillInput,
  removeLeakedResources,
  withResource,
} from '@console/shared/src/test-utils/utils';
import * as virtualMachineView from '../views/virtualMachine.view';
import { saveButton } from '../views/kubevirtUIResource.view';
import * as editFlavorView from '../views/dialogs/editFlavorView';
import { selectOptionByText } from './utils/utils';
import { getCPU, getMemory } from '../../src/selectors/vm/selectors';
import { VMBuilder } from './models/vmBuilder';
import { getBasicVMBuilder } from './mocks/vmBuilderPresets';
import { getTestDataVolume } from './mocks/mocks';
import { CLONE_VM_TIMEOUT_SECS } from './utils/constants/common';
import { ProvisionSource } from './utils/constants/enums/provisionSource';

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
        await vm.modalEditFlavor();
        await selectOptionByText(editFlavorView.flavorDropdown, 'Custom');
        await fillInput(editFlavorView.cpusInput(), '2');
        await fillInput(editFlavorView.memoryInput(), '3');
        await click(saveButton);

        expect(getCPU(vm.getResource()).cores).toEqual(2);
        expect(getMemory(vm.getResource())).toEqual('3Gi');
        expect(
          (await virtualMachineView.vmDetailLabelValue('vm.kubevirt.io/template')).startsWith(
            'rhel7-highperformance-large-', // template is not changed (might be in the future)
          ),
        ).toBeTruthy();
      });
    },
    CLONE_VM_TIMEOUT_SECS,
  );
});
