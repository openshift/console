import { execSync } from 'child_process';
import { browser } from 'protractor';
import { testName } from '@console/internal-integration-tests/protractor.conf';
import { VirtualMachineModel } from '@console/kubevirt-plugin/src/models';
import { isLoaded } from '../../../../integration-tests/views/crud.view';
import {
  createResources,
  deleteResources,
  removeLeakedResources,
  waitForStringInElement,
  withResource,
} from '../utils/shared-utils';
import * as view from '../views/wizard.view';
import { cdGuestTools, getTestDataVolume, multusNAD } from './mocks/mocks';
import { getBasicVMBuilder, vmPresets } from './mocks/vmBuilderPresets';
import { VMBuilder } from './models/vmBuilder';
import { Wizard } from './models/wizard';
import {
  CLONE_VM_TIMEOUT_SECS,
  JASMINE_EXTENDED_TIMEOUT_INTERVAL,
  VM_BOOTUP_TIMEOUT_SECS,
} from './utils/constants/common';
import { ProvisionSource } from './utils/constants/enums/provisionSource';

describe('Kubevirt create VM using wizard', () => {
  const leakedResources = new Set<string>();
  const dvName = `testdv-${testName}`;
  const testDataVolume = getTestDataVolume(dvName);

  const VMTestCaseIDs = {
    'ID(CNV-870)': vmPresets[ProvisionSource.CONTAINER.getValue()],
    'ID(CNV-2446)': vmPresets[ProvisionSource.DISK.getValue()],
    'ID(CNV-869)': vmPresets[ProvisionSource.URL.getValue()],
    'ID(CNV-771)': vmPresets[ProvisionSource.PXE.getValue()],
  };

  beforeAll(async () => {
    createResources([testDataVolume]);
    execSync(`oc wait -n ${testName} --for condition=Ready DataVolume ${dvName} --timeout=100s`);
  });

  afterAll(async () => {
    deleteResources([testDataVolume]);
  });

  beforeEach(async () => {
    createResources([multusNAD]);
  });

  afterEach(() => {
    deleteResources([multusNAD]);

    removeLeakedResources(leakedResources);
  });

  for (const [id, vm] of Object.entries(VMTestCaseIDs)) {
    const { provisionSource } = vm.getData();
    const specTimeout =
      provisionSource === ProvisionSource.DISK ? CLONE_VM_TIMEOUT_SECS : VM_BOOTUP_TIMEOUT_SECS;
    it(
      `${id} Create VM using ${provisionSource}.`,
      async () => {
        await withResource(leakedResources, vm.asResource(), async () => {
          await vm.create();
          await vm.navigateToDetail();
        });
      },
      specTimeout,
    );
  }

  it(
    'ID(CNV-3657) Creates VM with CD ROM added in Wizard',
    async () => {
      const vm = new VMBuilder(getBasicVMBuilder())
        .setProvisionSource(ProvisionSource.URL)
        .setDisks([cdGuestTools])
        .setCustomize(true)
        .build();

      await withResource(leakedResources, vm.asResource(), async () => {
        await vm.create();
        await vm.navigateToDetail();
      });
    },
    JASMINE_EXTENDED_TIMEOUT_INTERVAL,
  );

  it('ID(CNV-5045) Verify PXE provision source must have NAD available', async () => {
    deleteResources([multusNAD]);

    const vm = new VMBuilder(getBasicVMBuilder())
      .setName(testName)
      .setProvisionSource(ProvisionSource.PXE)
      .setCustomize(true)
      .build();
    const wizard = new Wizard();
    await vm.navigateToListView();
    await isLoaded();
    await wizard.openWizard(VirtualMachineModel, true);
    await wizard.processGeneralStep(vm.getData(), true);
    await browser.wait(
      waitForStringInElement(view.bootError, 'No Network Attachment Definitions available'),
      1000,
    );
    await browser.wait(
      waitForStringInElement(view.footerError, 'Please correct the following field: Boot Source'),
      1000,
    );
    await wizard.closeWizard();
  });
});
