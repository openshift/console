import { execSync } from 'child_process';
import { browser, ExpectedConditions as until } from 'protractor';
import { click, waitForStringInElement } from '@console/shared/src/test-utils/utils';
import { VirtualMachineModel } from '@console/kubevirt-plugin/src/models';
import { KUBEVIRT_TEMPLATES_PATH, KEBAP_ACTION, RECOMMENDED } from './utils/constants/common';
import { Flavor, OperatingSystem, Workload } from './utils/constants/wizard';
import { ProvisionSource } from './utils/constants/enums/provisionSource';
import { DISK_SOURCE } from './utils/constants/vm';
import { Wizard } from './models/wizard';
import { Disk, FlavorConfig } from './types/types';
import { getRandStr } from './utils/utils';
import * as view from '../views/wizard.view';
import { diskInterface } from '../views/dialogs/diskDialog.view';
import { DiskDialog } from './dialogs/diskDialog';
import { saveButton } from '../views/kubevirtUIResource.view';

describe('Wizard validation', () => {
  const wizard = new Wizard();
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
    await wizard.openWizard(VirtualMachineModel, true);
  });

  afterEach(async () => {
    await wizard.closeWizard();
    await click(view.cancelButton);
  });

  it('ID(CNV-3697) Wizard validates custom flavor memory', async () => {
    await wizard.selectOperatingSystem(OperatingSystem.VALIDATION_TEST);
    await wizard.selectFlavor(customFlavorNotEnoughMemory);
    await browser.wait(
      waitForStringInElement(view.customFlavorMemoryHintBlock, 'Memory must be at least'),
    );
    await wizard.selectFlavor(customFlavorSufficientMemory);
    expect(view.customFlavorMemoryHintBlock.isPresent()).toBe(false);
  });

  it('ID(CNV-3698) Disk Dialog displays warning when interface not recommended', async () => {
    await wizard.selectOperatingSystem(OperatingSystem.WINDOWS_10);
    await wizard.selectProvisionSource(ProvisionSource.CONTAINER);
    await wizard.selectFlavor(customFlavorSufficientMemory);
    await wizard.selectWorkloadProfile(Workload.DESKTOP);
    await wizard.fillName(getRandStr(5));
    await wizard.next();
    // Network tab
    await wizard.next();
    // Storage tab
    await view.clickKebabAction('rootdisk', KEBAP_ACTION.Edit); // Open dialog
    await browser.wait(waitForStringInElement(diskInterface, RECOMMENDED));
    await click(saveButton); // Close dialog
  });

  it('ID(CNV-4551) Import Wizard shows warning when using incorrect VM name', async () => {
    const WRONG_VM_NAME = 'VMNAME';
    await wizard.selectProvisionSource(ProvisionSource.CONTAINER);
    await wizard.selectFlavor(customFlavorSufficientMemory);
    await wizard.selectWorkloadProfile(Workload.DESKTOP);
    await wizard.fillName(WRONG_VM_NAME);
    await browser.wait(until.presenceOf(view.vmNameHelper));
  });

  it('ID(CNV-5469) Blank disk cannot be used as bootdisk', async () => {
    const disk: Disk = { source: DISK_SOURCE.Blank, size: '1', name: 'blankdisk' };
    const diskDialog = new DiskDialog();

    await wizard.selectProvisionSource(ProvisionSource.DISK);
    await wizard.selectFlavor(customFlavorSufficientMemory);
    await wizard.selectWorkloadProfile(Workload.DESKTOP);
    await wizard.fillName(getRandStr(5));
    await wizard.next();
    // Network tab
    await wizard.next();
    // Storage tab
    await click(view.addDiskButton);
    await diskDialog.create(disk);
    await wizard.selectBootableDisk(disk.name);
    await browser.wait(until.presenceOf(view.storageBootsourceHelper));
  });

  it('ID(CNV-5468) Ephemeral Container disk can be used as bootdisk', async () => {
    const disk: Disk = { source: DISK_SOURCE.EphemeralContainer, size: '1', name: 'containerdisk' };
    const diskDialog = new DiskDialog();

    await wizard.selectProvisionSource(ProvisionSource.DISK);
    await wizard.selectFlavor(customFlavorSufficientMemory);
    await wizard.selectWorkloadProfile(Workload.DESKTOP);
    await wizard.fillName(getRandStr(5));
    await wizard.next();
    // Network tab
    await wizard.next();
    // Storage tab
    await click(view.addDiskButton);
    await diskDialog.create(disk);
    await wizard.selectBootableDisk(disk.name);
    await browser.wait(until.stalenessOf(view.storageBootsourceHelper));
  });
});
