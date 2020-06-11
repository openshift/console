import { execSync } from 'child_process';
import { browser, ExpectedConditions as until } from 'protractor';
import { testName } from '@console/internal-integration-tests/protractor.conf';
import {
  click,
  deleteResource,
  waitForStringInElement,
  getDropdownOptions,
  selectDropdownOption,
  selectDropdownOptionById,
  createResource,
} from '@console/shared/src/test-utils/utils';
import {
  consoleTypeSelector,
  consoleTypeSelectorId,
  rdpServiceNotConfiguredElem,
  desktopClientTitle,
  launchRemoteViewerButton,
  launchRemoteDesktopButton,
  manualConnectionTitle,
  rdpManualConnectionTitles,
  rdpManualConnectionValues,
  networkSelectorId,
} from '../views/consolesView';
import { vmDetailIP } from '../views/virtualMachine.view';
import {
  VM_CREATE_AND_EDIT_TIMEOUT_SECS,
  PAGE_LOAD_TIMEOUT_SECS,
  VM_CREATE_AND_EDIT_AND_CLOUDINIT_TIMEOUT_SECS,
} from './utils/consts';
import { VirtualMachine } from './models/virtualMachine';
import { getWindowsVM } from './utils/templates/windowsVMForRDPL2';
import { multusNAD } from './utils/mocks';

const VM_IP = '123.123.123.123';

describe('KubeVirt VM console - RDP', () => {
  let vm: VirtualMachine;

  beforeAll(async () => {
    createResource(multusNAD);
    const vmName = 'windows-rdp';

    // for cmd-line scripts only
    execSync(`kubectl config set-context --current --namespace=${testName}`, { stdio: 'inherit' });
    execSync('kubectl create -f -', {
      input: getWindowsVM({
        name: vmName,
        networkName: multusNAD.metadata.name,
        vmIP: VM_IP,
      }),
    });
    vm = new VirtualMachine({ name: vmName, namespace: testName });
  });

  afterAll(async () => {
    deleteResource(multusNAD);
    deleteResource(vm.asResource());
    execSync(`kubectl config set-context --current --namespace=default`, { stdio: 'inherit' });
  });

  it(
    'ID(CNV-1721) connects via exposed service',
    async () => {
      await vm.navigateToConsoles();
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
        `virtctl expose virtualmachine ${vm.name} --name ${vm.name}-rdp --port 4567 --target-port 3389 --type NodePort`,
        { stdio: 'inherit' },
      );

      await browser.wait(until.presenceOf(desktopClientTitle));
      await browser.wait(
        waitForStringInElement(desktopClientTitle, 'Desktop Client'),
        PAGE_LOAD_TIMEOUT_SECS,
      );

      expect(launchRemoteViewerButton.isEnabled()).toBe(false);
      expect(launchRemoteDesktopButton.isEnabled()).toBe(true);

      // there should be just the single laucher-pod
      const hostIP = execSync("kubectl get pod -o json | jq '.items[0].status.hostIP' -r")
        .toString()
        .trim();
      const port = execSync(
        `kubectl get service ${vm.name}-rdp -o json | jq '.spec.ports[0].nodePort' -r`,
      )
        .toString()
        .trim();
      expect(hostIP.length).toBeGreaterThan(0);
      expect(port.length).toBeGreaterThan(0);

      await browser.wait(
        until.textToBePresentInElement(manualConnectionTitle, 'Manual Connection'),
      );
      const titles = rdpManualConnectionTitles();
      expect(titles.first().getText()).toBe('RDP Address:');
      expect(titles.last().getText()).toBe('RDP Port:');

      const values = rdpManualConnectionValues();
      expect(values.count()).toBe(2);
      expect(values.first().getText()).toBe(hostIP);
      expect(values.last().getText()).toBe(port);

      // TODO: download the .rdp file and verify content
      // will require protractor configuration change: https://stackoverflow.com/questions/21935696/protractor-e2e-test-case-for-downloading-pdf-file/26127745#26127745
    },
    VM_CREATE_AND_EDIT_TIMEOUT_SECS,
  );

  it(
    'ID(CNV-1726) connects via L2 network',
    async () => {
      /* Pre-requisite:
       * - L2 network is configured on the cluster/node
       * - the Windows-VM has guest-agent installed
       * and so the Windows VM gets IP which is reported back to the VMI object among VMI.status.interfaces[].
       *
       * We mimmic this "final" state here.
       */

      await vm.navigateToDetail();
      // eslint-disable-next-line no-console
      console.log(
        'Waiting for static IP to be reported by the guest-agent (can take up to several minutes ...)',
      );
      // Waiting for instllation & start of the guest-agent and reporting the static IP back
      await browser.wait(
        waitForStringInElement(vmDetailIP(vm.namespace, vm.name), VM_IP),
        VM_CREATE_AND_EDIT_AND_CLOUDINIT_TIMEOUT_SECS,
      );

      await vm.navigateToConsoles();

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
      const titles = rdpManualConnectionTitles();
      expect(titles.first().getText()).toBe('RDP Address:');
      expect(titles.last().getText()).toBe('RDP Port:');

      const values = rdpManualConnectionValues();
      expect(values.count()).toBe(2);
      expect(values.first().getText()).toBe(VM_IP);
      expect(values.last().getText()).toBe('3389');

      // TODO: download the .rdp file and verify content
      // will require protractor configuration change: https://stackoverflow.com/questions/21935696/protractor-e2e-test-case-for-downloading-pdf-file/26127745#26127745
    },
    VM_CREATE_AND_EDIT_AND_CLOUDINIT_TIMEOUT_SECS,
  );
});
