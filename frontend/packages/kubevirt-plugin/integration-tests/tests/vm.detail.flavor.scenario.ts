import { click, fillInput } from '@console/shared/src/test-utils/utils';
import * as virtualMachineView from '../views/virtualMachine.view';
import { saveButton } from '../views/kubevirtUIResource.view';
import { VM_CREATE_AND_EDIT_TIMEOUT_SECS } from './utils/consts';
import * as editFlavorView from '../views/dialogs/editFlavorView';
import { selectOptionByText, getSelectedOptionText } from './utils/utils';
import { getCPU, getMemory } from '../../src/selectors/vm/selectors';
import { vm } from './vm.setup.scenario';

describe('KubeVirt VM detail - edit flavor', () => {
  it(
    'ID(CNV-3076) changes tiny to custom',
    async () => {
      await vm.navigateToDetail();
      await vm.modalEditFlavor();
      expect(await getSelectedOptionText(editFlavorView.flavorDropdown)).toEqual('Tiny');
      await selectOptionByText(editFlavorView.flavorDropdown, 'Custom');
      await fillInput(editFlavorView.cpusInput(), '2');
      await fillInput(editFlavorView.memoryInput(), '3');
      await click(saveButton);

      expect(getCPU(vm.getResource()).cores).toEqual(2);
      expect(getMemory(vm.getResource())).toEqual('3Gi');
      expect(
        (await virtualMachineView.vmDetailLabelValue('vm.kubevirt.io/template')).startsWith(
          'rhel7-desktop-tiny-', // template is not changed (might be in the future)
        ),
      ).toBeTruthy();
    },
    VM_CREATE_AND_EDIT_TIMEOUT_SECS,
  );
});
