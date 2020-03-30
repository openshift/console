import { execSync } from 'child_process';
import { browser, ExpectedConditions as until } from 'protractor';
import { testName } from '@console/internal-integration-tests/protractor.conf';
import {
  withResource,
  click,
  deleteResource,
  waitForStringInElement,
  getDropdownOptions,
  selectDropdownOption,
  selectDropdownOptionById,
  createResource,
  removeLeakedResources,
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
import { vmConfig, getProvisionConfigs } from './vm.wizard.configs';
import { ProvisionConfigName } from './utils/constants/wizard';
import { windowsVMConfig, multusNAD } from './utils/mocks';
import { getWindowsVM } from './utils/templates/windowsVMForRDPL2';

const VM_IP = '123.123.123.123';

describe('KubeVirt VM console - RDP', () => {
  beforeAll(async () => {
    createResource(multusNAD);
    // for cmd-line scripts only
    execSync(`kubectl config set-context --current --namespace=${testName}`, { stdio: 'inherit' });
  });

  afterAll(async () => {
    deleteResource(multusNAD);
    execSync(`kubectl config set-context --current --namespace=default`, { stdio: 'inherit' });
  });

  const leakedResources = new Set<string>();
  const provisionConfigs = getProvisionConfigs();

  const configName = ProvisionConfigName.CONTAINER;
  const provisionConfig = provisionConfigs.get(configName);

  provisionConfig.networkResources = [];
  provisionConfig.storageResources = [];

  afterEach(() => {
    removeLeakedResources(leakedResources);
  });

  it(
    'connects via exposed service',
    async () => {
      const windowsConfig = vmConfig(
        configName.toLowerCase(),
        testName,
        provisionConfig,
        windowsVMConfig,
        true, // startOnCreation
      );
      const vm = new VirtualMachine(windowsConfig);
      await withResource(leakedResources, vm.asResource(), async () => {
        await vm.create(windowsConfig);
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
        const hostIP = execSync("kubectl get pod -o yaml|grep hostIP| cut -d ':' -f 2")
          .toString()
          .trim();
        const port = execSync(
          `kubectl get service ${vm.name}-rdp -o yaml|grep nodePort| cut -d ':' -f 2`,
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
      });
    },
    VM_CREATE_AND_EDIT_TIMEOUT_SECS,
  );

  it(
    'connects via L2 network',
    async () => {
      // created just for reusing the later navigation
      const windowsConfig = vmConfig(configName.toLowerCase(), testName, provisionConfig);
      const vm = new VirtualMachine(windowsConfig);
      await withResource(leakedResources, vm.asResource(), async () => {
        /* Pre-requisite:
         * - L2 network is configured on the cluster/node
         * - the Windows-VM has guest-agent installed
         * and so the Windows VM gets IP which is reported back to the VMI object among VMI.status.interfaces[].
         *
         * We mimmic this "final" state here.
         */
        execSync('kubectl create -f -', {
          input: getWindowsVM({
            name: windowsConfig.name,
            networkName: multusNAD.metadata.name,
            vmIP: VM_IP,
          }),
        });

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

        await selectDropdownOptionById(networkSelectorId, 'nic1-link');
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
      });
    },
    VM_CREATE_AND_EDIT_AND_CLOUDINIT_TIMEOUT_SECS,
  );
});
