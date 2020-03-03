import { execSync } from 'child_process';
import { browser } from 'protractor';
import { click, waitForStringInElement } from '@console/shared/src/test-utils/utils';
import {
  KUBEVIRT_TEMPLATES_PATH,
  KEBAP_ACTION,
  PAGE_LOAD_TIMEOUT_SECS,
  NOT_RECOMMENDED_BUS_TYPE_WARN,
} from './utils/consts';
import {
  Flavor,
  OperatingSystem,
  ProvisionConfigName,
  WorkloadProfile,
} from './utils/constants/wizard';
import { Wizard } from './models/wizard';
import { FlavorConfig } from './utils/types';
import { customFlavorMemoryHintBlock, clickKebabAction, diskWarning } from '../views/wizard.view';
import { getProvisionConfigs } from './vm.wizard.configs';
import { getRandStr } from './utils/utils';
import { diskInterfaceHelper } from '../views/dialogs/diskDialog.view';
import { DiskDialog } from './dialogs/diskDialog';
import { saveButton } from '../views/kubevirtDetailView.view';

describe('Wizard validation', () => {
  const wizard = new Wizard();
  const diskDialog = new DiskDialog();
  const provisionConfig = getProvisionConfigs().get(ProvisionConfigName.CONTAINER);
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
    execSync(`kubectl delete -f ${KUBEVIRT_TEMPLATES_PATH}/validationCommonTemplate.yaml`);
  });

  beforeEach(async () => {
    await wizard.openWizard();
  });

  afterEach(async () => {
    await wizard.closeWizard();
  });

  it('Displays error when not enough memory provided', async () => {
    await wizard.selectOperatingSystem(OperatingSystem.VALIDATION_TEST);
    await wizard.selectFlavor(customFlavorNotEnoughMemory);
    await browser.wait(
      waitForStringInElement(customFlavorMemoryHintBlock, 'Memory must be at least'),
    );
    await wizard.selectFlavor(customFlavorSufficientMemory);
    expect(customFlavorMemoryHintBlock.isPresent()).toBe(false);
  });

  it('Displays warning when interface not recommended', async () => {
    const WINDOWS_NOT_RECOMMENDED_INTERFACE = 'sata';
    await wizard.selectProvisionSource(provisionConfig.provision);
    await wizard.selectOperatingSystem(OperatingSystem.WINDOWS_10);
    await wizard.selectFlavor(customFlavorSufficientMemory);
    await wizard.selectWorkloadProfile(WorkloadProfile.DESKTOP);
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
});
