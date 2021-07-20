import { execSync } from 'child_process';
import { browser, ExpectedConditions as until } from 'protractor';
import { testName } from '@console/internal-integration-tests/protractor.conf';
import { detailViewAction as vmActions } from '../utils/shared-actions.view';
import {
  click,
  createResource,
  deleteResource,
  getDropdownOptions,
  selectDropdownOption,
  selectDropdownOptionById,
  waitForStringInElement,
} from '../utils/shared-utils';
import {
  consoleTypeSelector,
  consoleTypeSelectorId,
  desktopClientTitle,
  launchRemoteDesktopButton,
  launchRemoteViewerButton,
  manualConnectionTitle,
  networkSelectorId,
  rdpManualConnectionTitles,
  rdpManualConnectionValues,
  rdpServiceNotConfiguredElem,
} from '../views/consolesView';
import * as dashboardView from '../views/dashboard.view';
import * as vmView from '../views/virtualMachine.view';
import * as disksView from '../views/vm.disks.view';
import { getVMManifest, multusNAD } from './mocks/mocks';
import { VirtualMachine } from './models/virtualMachine';
import {
  GUEST_AGENT_FIELD_TIMEOUT_SECS,
  KUBEVIRT_SCRIPTS_PATH,
  PAGE_LOAD_TIMEOUT_SECS,
  SEC,
  VM_CREATE_AND_EDIT_AND_CLOUDINIT_TIMEOUT_SECS,
  VM_CREATE_AND_EDIT_TIMEOUT_SECS,
  VM_WITH_GA_CREATE_AND_EDIT_CLOUDINIT_TIMEOUT_SECS,
} from './utils/constants/common';
import { ProvisionSource } from './utils/constants/enums/provisionSource';
import { VM_ACTION, VM_STATUS } from './utils/constants/vm';
import { getFakeWindowsVM } from './utils/templates/windowsVMForRDPL2';

const VM_LINUX_NAME = `${testName}-linux-vm`;
const VM_WINDOWS_NAME = 'windows-rdp';
const VM_WINDOWS_IP = '123.123.123.123';
const environmentExpecScriptPath = `${KUBEVIRT_SCRIPTS_PATH}/guest-agent-login.sh`;
const JASMINE_EXTENDED_TIMEOUT_INTERVAL = 3000 * 60 * 5;

describe('Tests involving guest agent', () => {
  let vmLinux: VirtualMachine;
  let vmWindows: VirtualMachine;

  beforeAll(async () => {
    createResource(multusNAD);

    // create linux vm
    const cloudInit =
      '#cloud-config\nuser: cloud-user\npassword: atomic\nchpasswd: {expire: False}\nruncmd:\n- dnf install -y qemu-guest-agent\n- systemctl start qemu-guest-agent';
    const testVM = getVMManifest(ProvisionSource.CONTAINER, testName, VM_LINUX_NAME, cloudInit);
    vmLinux = new VirtualMachine(testVM.metadata);
    createResource(testVM);
    await vmLinux.detailViewAction(VM_ACTION.Start, false);
    await browser.sleep(GUEST_AGENT_FIELD_TIMEOUT_SECS);
    await vmLinux.waitForStatus(VM_STATUS.Running, SEC * 600);
    execSync(
      `expect ${environmentExpecScriptPath} ${VM_LINUX_NAME} ${vmLinux.namespace} ${VM_LINUX_NAME}`,
    );
    await browser.sleep(GUEST_AGENT_FIELD_TIMEOUT_SECS);
    await vmLinux.navigateToOverview();

    // create windows VM
    execSync('kubectl create -f -', {
      input: getFakeWindowsVM({
        name: VM_WINDOWS_NAME,
        networkName: multusNAD.metadata.name,
        vmIP: VM_WINDOWS_IP,
      }),
    });

    vmWindows = new VirtualMachine({ name: VM_WINDOWS_NAME, namespace: testName });
  }, VM_WITH_GA_CREATE_AND_EDIT_CLOUDINIT_TIMEOUT_SECS);

  afterAll(async () => {
    deleteResource(multusNAD);
    deleteResource(vmLinux.asResource());
    deleteResource(vmWindows.asResource());
  });

  describe('Testing guest agent data', () => {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = JASMINE_EXTENDED_TIMEOUT_INTERVAL;

    it('ID(CNV-5318) Displays guest agent data in Details tab', async () => {
      await vmLinux.navigateToDetail();
      await browser.wait(
        until.presenceOf(vmView.vmDetailsActiveUsersList),
        GUEST_AGENT_FIELD_TIMEOUT_SECS,
      );
      expect(vmView.vmDetailHostname(testName, VM_LINUX_NAME).getText()).toContain(VM_LINUX_NAME);
      expect(vmView.vmDetailTimeZone(testName, VM_LINUX_NAME).getText()).toEqual('UTC');
      expect(vmView.vmDetailsActiveUsersList.getText()).toEqual('cloud-user');
    });

    it('ID(CNV-5319) Displays guest agent data in Overview tab', async () => {
      await vmLinux.navigateToOverview();
      expect(dashboardView.vmDetailsHostname.getText()).toContain(VM_LINUX_NAME);
      expect(dashboardView.vmDetailsTZ.getText()).toContain('UTC');
      expect(dashboardView.vmDetailsNumActiveUsersMsg.getText()).toEqual('1 user');
    });

    it('ID(CNV-5320) Displays guest agent data in Disks tab', async () => {
      await vmLinux.navigateToDisks();
      await browser.wait(
        until.presenceOf(disksView.fileSystemsTableHeader),
        GUEST_AGENT_FIELD_TIMEOUT_SECS,
      );
      expect(disksView.fileSystemsTable).toBeDefined();
    });

    it('ID(CNV-5472) Warn user when deleting a VM which has a logged in user	', async () => {
      await vmLinux.navigateToDetail();
      await vmActions(VM_ACTION.Delete, false);
      await browser.wait(until.visibilityOf(vmView.vmDeleteAlert));
      expect(vmView.vmDeleteAlert.getText()).toContain('1 User currently logged in to this VM');
    });
  });

  describe('Testing console RDP connections', () => {
    it(
      'ID(CNV-1721) connects via exposed service',
      async () => {
        await vmWindows.navigateToDetail();
        await vmWindows.navigateToConsole();
        await browser.wait(until.presenceOf(consoleTypeSelector));
        await click(consoleTypeSelector);
        await browser.wait(
          waitForStringInElement(consoleTypeSelector, 'VNC Console'),
          PAGE_LOAD_TIMEOUT_SECS,
        );

        const items = await getDropdownOptions(consoleTypeSelectorId);
        expect(items[0]).toBe('VNC Console');
        expect(items[1]).toBe('Serial Console');
        expect(items[2]).toBe('Desktop Viewer');

        await click(consoleTypeSelector); // close before re-opening
        await selectDropdownOption(consoleTypeSelectorId, 'Desktop Viewer');

        // no service is exposed atm, informative text should be rendered
        await browser.wait(until.presenceOf(rdpServiceNotConfiguredElem));

        // the next command follows recommendation by documentation
        execSync(
          `virtctl expose virtualmachine ${vmWindows.name} --name ${vmWindows.name}-rdp  --namespace=${testName} --port 4567 --target-port 3389 --type NodePort`,
        );

        await browser.wait(until.presenceOf(desktopClientTitle));
        await browser.wait(
          waitForStringInElement(desktopClientTitle, 'Desktop Client'),
          PAGE_LOAD_TIMEOUT_SECS,
        );

        expect(launchRemoteViewerButton.isEnabled()).toBe(false);
        expect(launchRemoteDesktopButton.isEnabled()).toBe(true);

        // there should be just the single laucher-pod
        const hostIP = execSync(
          `kubectl get -n ${testName} pod $(kubectl get -n ${testName} pods -o name | grep ${vmWindows.name} | cut -d'/' -f 2) -o jsonpath='{.status.hostIP}'`,
        )
          .toString()
          .trim();
        const port = execSync(
          `kubectl get -n ${testName} service ${vmWindows.name}-rdp -o jsonpath='{.spec.ports[0].nodePort}'`,
        )
          .toString()
          .trim();
        expect(hostIP.length).toBeGreaterThan(0);
        expect(port.length).toBeGreaterThan(0);

        await browser.wait(
          until.textToBePresentInElement(manualConnectionTitle, 'Manual Connection'),
        );
        const titles = rdpManualConnectionTitles;
        await browser.wait(until.presenceOf(titles));
        expect(titles.first().getText()).toBe('RDP Address:');
        expect(titles.last().getText()).toBe('RDP Port:');

        const values = rdpManualConnectionValues;
        await browser.wait(until.presenceOf(values));
        expect(values.first().getText()).toBe(hostIP);
        expect(values.last().getText()).toBe(port);

        // TODO: download the .rdp file and verify content
        // will require protractor configuration change:
        // https://stackoverflow.com/questions/21935696/protractor-e2e-test-case-for-downloading-pdf-file/26127745#26127745
      },
      VM_CREATE_AND_EDIT_TIMEOUT_SECS,
    );

    // TODO: consider move this to Tier2 tests
    it(
      'ID(CNV-1726) connects via L2 network',
      async () => {
        /* Pre-requisite:
         * - L2 network is configured on the cluster/node
         * - the Windows-VM has guest-agent installed
         * and so the Windows VM gets IP which is reported back to the VMI object among VMI.status.interfaces[].
         *
         * We mimic this "final" state here.
         */

        await vmWindows.navigateToDetail();
        // Waiting for installation & start of the guest-agent and reporting the static IP back
        // It can take up to several minutes.
        await browser.wait(
          waitForStringInElement(
            vmView.vmDetailIP(vmWindows.namespace, vmWindows.name),
            VM_WINDOWS_IP,
          ),
          VM_CREATE_AND_EDIT_AND_CLOUDINIT_TIMEOUT_SECS,
        );

        await vmWindows.navigateToConsole();

        await browser.wait(until.presenceOf(consoleTypeSelector));
        await click(consoleTypeSelector);
        await browser.wait(
          waitForStringInElement(consoleTypeSelector, 'VNC Console'),
          PAGE_LOAD_TIMEOUT_SECS,
        );

        const items = await getDropdownOptions(consoleTypeSelectorId);
        expect(items[0]).toBe('VNC Console');
        expect(items[1]).toBe('Serial Console');
        expect(items[2]).toBe('Desktop Viewer');

        await click(consoleTypeSelector); // close before re-opening
        await selectDropdownOption(consoleTypeSelectorId, 'Desktop Viewer');

        await selectDropdownOptionById(networkSelectorId, 'nic-1-link');
        await browser.wait(
          until.textToBePresentInElement(manualConnectionTitle, 'Manual Connection'),
        );
        const titles = rdpManualConnectionTitles;
        await browser.wait(until.presenceOf(titles));
        expect(titles.first().getText()).toBe('RDP Address:');
        expect(titles.last().getText()).toBe('RDP Port:');

        const values = rdpManualConnectionValues;
        await browser.wait(until.presenceOf(values));
        expect(values.first().getText()).toBe(VM_WINDOWS_IP);
        expect(values.last().getText()).toBe('3389');

        // TODO: download the .rdp file and verify content
        // will require protractor configuration change: https://stackoverflow.com/questions/21935696/protractor-e2e-test-case-for-downloading-pdf-file/26127745#26127745
      },
      VM_CREATE_AND_EDIT_AND_CLOUDINIT_TIMEOUT_SECS,
    );
  });
});
