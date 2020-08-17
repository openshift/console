import { execSync } from 'child_process';
import { browser } from 'protractor';
import { click, waitForStringInElement } from '@console/shared/src/test-utils/utils';
import { VirtualMachineModel } from '@console/kubevirt-plugin/src/models';
import {
  KUBEVIRT_TEMPLATES_PATH,
  KEBAP_ACTION,
  PAGE_LOAD_TIMEOUT_SECS,
  NOT_RECOMMENDED_BUS_TYPE_WARN,
  CHARACTERS_NOT_ALLOWED,
  SEC,
} from './utils/constants/common';
import { Flavor, OperatingSystem, Workload } from './utils/constants/wizard';
import { Wizard } from './models/wizard';
import { FlavorConfig } from './types/types';
import { customFlavorMemoryHintBlock, clickKebabAction, diskWarning } from '../views/wizard.view';
import { getRandStr } from './utils/utils';
import { diskInterfaceHelper } from '../views/dialogs/diskDialog.view';
import { DiskDialog } from './dialogs/diskDialog';
import { saveButton } from '../views/kubevirtUIResource.view';
import { provisionSources } from './mocks/mocks';
import { vmNameHelper } from '../views/importWizard.view';

describe('Wizard validation', () => {
  const wizard = new Wizard();
  const diskDialog = new DiskDialog();
  const customFlavorNotEnoughMemory: FlavorConfig = {
    flavor: Flavor.CUSTOM,
    cpu: '1',
    memory: '1',
  };
  const customFlavorSufficientMemory: FlavorConfig = {
    flavor: Flavor.CUSTOM,
    cpu: '1',
    memory: '5',
  };

  beforeAll(async () => {
    execSync(`kubectl create -f ${KUBEVIRT_TEMPLATES_PATH}/validationCommonTemplate.yaml`);
  });

  afterAll(() => {
    execSync(
      `kubectl delete --ignore-not-found=true -f ${KUBEVIRT_TEMPLATES_PATH}/validationCommonTemplate.yaml`,
    );
  });

  beforeEach(async () => {
    await wizard.openWizard(VirtualMachineModel);
  });

  afterEach(async () => {
    await wizard.closeWizard();
  });

  it('ID(CNV-3697) Wizard validates custom flavor memory', async () => {
    await wizard.selectOperatingSystem(OperatingSystem.VALIDATION_TEST);
    await wizard.selectFlavor(customFlavorNotEnoughMemory);
    await browser.wait(
      waitForStringInElement(customFlavorMemoryHintBlock, 'Memory must be at least'),
    );
    await wizard.selectFlavor(customFlavorSufficientMemory);
    expect(customFlavorMemoryHintBlock.isPresent()).toBe(false);
  });

  it('ID(CNV-3698) Disk Dialog displays warning when interface not recommended', async () => {
    const WINDOWS_NOT_RECOMMENDED_INTERFACE = 'sata';
    await wizard.selectProvisionSource(provisionSources.Container);
    await wizard.selectOperatingSystem(OperatingSystem.WINDOWS_10);
    await wizard.selectFlavor(customFlavorSufficientMemory);
    await wizard.selectWorkloadProfile(Workload.DESKTOP);
    await wizard.fillName(getRandStr(5));
    await wizard.next();
    // Network tab
    await wizard.next();
    // Storage tab
    // TODO: When BZ 1803132 is fixed, we should also verify that a warning is displayed
    // Right away when user navigates to Storace section because Windows CTs use rootdisk
    // with sata interface, which is not on the recommended list

    await clickKebabAction('rootdisk', KEBAP_ACTION.Edit); // Open dialog
    await diskDialog.selectInterface(WINDOWS_NOT_RECOMMENDED_INTERFACE);
    await browser.wait(
      waitForStringInElement(diskInterfaceHelper, NOT_RECOMMENDED_BUS_TYPE_WARN),
      PAGE_LOAD_TIMEOUT_SECS,
    );
    await click(saveButton); // Close dialog
    // Check that the Warning is also displayed in the storage list view
    await browser.wait(
      waitForStringInElement(diskWarning('rootdisk'), NOT_RECOMMENDED_BUS_TYPE_WARN),
      PAGE_LOAD_TIMEOUT_SECS,
    );
  });

  it('ID(CNV-4551) Import Wizard shows warning when using incorrect VM name', async () => {
    const WRONG_VM_NAME = 'VMNAME';
    await wizard.selectProvisionSource(provisionSources.Container);
    await wizard.selectOperatingSystem(OperatingSystem.WINDOWS_10);
    await wizard.selectFlavor(customFlavorSufficientMemory);
    await wizard.selectWorkloadProfile(Workload.DESKTOP);
    await wizard.fillName(WRONG_VM_NAME);
    await browser.wait(waitForStringInElement(vmNameHelper, CHARACTERS_NOT_ALLOWED), 2 * SEC);
  });
});
