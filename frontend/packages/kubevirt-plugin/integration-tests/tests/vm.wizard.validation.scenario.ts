import { browser, ExpectedConditions as until } from 'protractor';
import { click } from '@console/shared/src/test-utils/utils';
import { VirtualMachineModel } from '@console/kubevirt-plugin/src/models';
import { Flavor, TemplateByName, Workload } from './utils/constants/wizard';
import { ProvisionSource } from './utils/constants/enums/provisionSource';
import { DISK_SOURCE, DISK_INTERFACE } from './utils/constants/vm';
import { Wizard } from './models/wizard';
import { Disk, FlavorConfig } from './types/types';
import { getRandStr } from './utils/utils';
import * as view from '../views/wizard.view';
import { DiskDialog } from './dialogs/diskDialog';
import { tableRows } from '../views/kubevirtUIResource.view';

describe('Wizard validation', () => {
  const wizard = new Wizard();
  const customFlavorSufficientMemory: FlavorConfig = {
    flavor: Flavor.CUSTOM,
    cpu: '1',
    memory: '5',
  };

  beforeEach(async () => {
    await wizard.openWizard(VirtualMachineModel, true, TemplateByName.RHEL6);
  });

  afterEach(async () => {
    await wizard.closeWizard();
    await click(view.cancelButton);
  });

  it('ID(CNV-3698) Verify default disk interface for RHEL6 is sata', async () => {
    await browser.wait(until.presenceOf(view.operatingSystemSelect));
    await wizard.fillName(getRandStr(5));
    await wizard.selectProvisionSource(ProvisionSource.CONTAINER);
    await wizard.selectFlavor(customFlavorSufficientMemory);
    await wizard.selectWorkloadProfile(Workload.DESKTOP);
    await wizard.next();
    // Network tab
    await wizard.next();
    // Storage tab
    const rows = await tableRows();
    rows.forEach((row) => {
      expect(row).toContain(DISK_INTERFACE.sata);
    });
  });

  it('ID(CNV-4551) Import Wizard shows warning when using incorrect VM name', async () => {
    const WRONG_VM_NAME = 'VMNAME';
    await wizard.fillName(WRONG_VM_NAME);
    await browser.wait(until.presenceOf(view.vmNameHelper));
  });

  it('ID(CNV-5469) Blank disk cannot be used as bootdisk', async () => {
    const disk: Disk = { source: DISK_SOURCE.Blank, size: '1', name: 'blankdisk' };
    const diskDialog = new DiskDialog();

    await browser.wait(until.presenceOf(view.operatingSystemSelect));
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
    const disk: Disk = {
      source: DISK_SOURCE.EphemeralContainer,
      size: '1',
      name: 'ephemeralcontainerdisk',
    };
    const diskDialog = new DiskDialog();

    await browser.wait(until.presenceOf(view.operatingSystemSelect));
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

  it('ID(CNV-5628) Registry Container disk can be used as bootdisk', async () => {
    const disk: Disk = { source: DISK_SOURCE.Container, size: '1', name: 'registrycontainerdisk' };
    const diskDialog = new DiskDialog();

    await browser.wait(until.presenceOf(view.operatingSystemSelect));
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
