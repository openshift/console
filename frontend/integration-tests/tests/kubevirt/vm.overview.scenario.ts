/* eslint-disable no-undef */
import { browser } from 'protractor';
import { execSync } from 'child_process';

import { appHost, testName } from '../../protractor.conf';
import { isLoaded } from '../../views/crud.view';
import { getVmManifest, basicVmConfig, emptyStr } from './mocks';
import * as vmView from '../../views/kubevirt/virtualMachine.view';
import { fillInput, execCommandFromCli, exposeService, selectDropdownOption, asyncForEach } from './utils/utils';
import { VirtualMachine } from './models/virtualMachine';

describe('Test vm overview page', () => {
  const vmName = `vm-${testName}`;
  const vm = new VirtualMachine(vmName, testName);
  const cloudInit = `#cloud-config\nuser: cloud-user\npassword: atomic\nchpasswd: {expire: False}\nhostname: vm-${testName}.example.com`;
  const testVm = getVmManifest('Container', testName, vmName, cloudInit);

  beforeAll(async() => {
    execCommandFromCli(`echo '${JSON.stringify(testVm)}' | kubectl create -f -`);
  });

  afterAll(async() => {
    execCommandFromCli(`echo '${JSON.stringify(testVm)}' | kubectl delete -f -`);
  });

  beforeEach(async() => {
    await vm.navigateToTab(vmView.overviewTab);
    await isLoaded();
  });

  it('Check vm details in overview when vm is off', async() => {

    // Non empty fields when vm is off
    expect(vmView.vmDetailName(testName, vmName).getText()).toEqual(vmName);
    expect(vmView.vmDetailDesc(testName, vmName).getText()).toEqual(testName);
    expect(vmView.statusIcon(vmView.statusIcons.off).isPresent()).toBeTruthy();
    expect(vmView.vmDetailOS(testName, vmName).getText()).toEqual(basicVmConfig.operatingSystem);
    expect(vmView.vmDetailWorkloadProfile(testName, vmName).getText()).toEqual(basicVmConfig.workloadProfile);
    expect(vmView.vmDetailTemplate(testName, vmName).getText()).toEqual('openshift/rhel7-generic-small');
    expect(vmView.vmDetailNamespace(testName, vmName).$('a').getText()).toEqual(testName);
    expect(vmView.vmDetailBootOrder(testName, vmName).getText()).toEqual(['rootdisk', 'nic0', 'cloudinitdisk']);
    expect(vmView.vmDetailFlavor(testName, vmName).getText()).toEqual(basicVmConfig.flavor);
    expect(vmView.vmDetailFlavorDesc(testName, vmName).getText()).toEqual('1 CPU, 2G Memory');

    // Empty fields when vm is off
    expect(vmView.vmDetailIP(testName, vmName).getText()).toEqual(emptyStr);
    expect(vmView.vmDetailPod(testName, vmName).getText()).toEqual(emptyStr);
    expect(vmView.vmDetailHostname(testName, vmName).getText()).toEqual(emptyStr);
    expect(vmView.vmDetailNode(testName, vmName).getText()).toEqual(emptyStr);

    // Edit button is enabled when VM is off
    expect(vmView.detailViewEditBtn.isEnabled()).toBe(true);
  });

  it('Check vm details in overview when vm is running', async() => {
    await vm.action('Start');
    expect(vmView.statusIcon(vmView.statusIcons.running).isPresent()).toBeTruthy();

    // Empty fields turn into non-empty
    expect(vmView.vmDetailIP(testName, vmName).getText()).toContain('10');
    // Known issue for hostname: https://bugzilla.redhat.com/show_bug.cgi?id=1688124
    expect(vmView.vmDetailHostname(testName, vmName).getText()).toEqual(vmName);
    expect(vmView.vmDetailPod(testName, vmName).$('a').getText()).toContain('virt-launcher');
    expect(vmView.vmDetailNode(testName, vmName).$('a').getText()).not.toEqual(emptyStr);

    // Edit button is disabled when VM is running
    expect(vmView.detailViewEditBtn.isEnabled()).toBe(false);
  });

  it('Edit vm flavor', async() => {
    const newVMDescription = 'edited vm description';
    await vm.action('Stop');
    await isLoaded();

    // Cancel edit
    await vmView.detailViewEditBtn.click();
    await fillInput(vmView.vmDetailDescTextarea(testName, vmName), newVMDescription);
    await selectDropdownOption(vmView.vmDetailFlavorDropdownId(testName, vmName), 'Custom');
    await fillInput(vmView.vmDetailFlavorCPU(testName, vmName), '2');
    await fillInput(vmView.vmDetailFlavorMemory(testName, vmName), '4');
    await vmView.detailViewCancelBtn.click();
    expect(vmView.vmDetailDesc(testName, vmName).getText()).toEqual(testName);
    expect(vmView.vmDetailFlavorDesc(testName, vmName).getText()).toEqual('1 CPU, 2G Memory');

    // Save edit
    await vmView.detailViewEditBtn.click();
    await fillInput(vmView.vmDetailDescTextarea(testName, vmName), newVMDescription);
    await selectDropdownOption(vmView.vmDetailFlavorDropdownId(testName, vmName), 'Custom');
    await fillInput(vmView.vmDetailFlavorCPU(testName, vmName), '2');
    await fillInput(vmView.vmDetailFlavorMemory(testName, vmName), '4');
    await vmView.detailViewSaveBtn.click();
    await isLoaded();
    expect(vmView.vmDetailDesc(testName, vmName).getText()).toEqual(newVMDescription);
    expect(vmView.vmDetailFlavorDesc(testName, vmName).getText()).toEqual('2 CPU, 4G Memory');
  });

  describe('VM Services', () => {
    const serviceTemplate = {name: vmName, kind: 'vm', type: 'NodePort'};
    const exposeServices = new Set<any>();
    exposeServices.add({exposeName: `${vmName}-service-ssh`, port: '22', targetPort: '20022', ...serviceTemplate});
    exposeServices.add({exposeName: `${vmName}-service-smtp`, port: '25', targetPort: '20025', ...serviceTemplate});
    exposeServices.add({exposeName: `${vmName}-service-http`, port: '80', targetPort: '20080', ...serviceTemplate});

    beforeAll(async() => {
      execSync(`oc project ${testName}`);
      exposeService(exposeServices);
    });

    afterAll(async() => {
      exposeServices.forEach((service) => {
        execCommandFromCli(`kubectl delete service ${service.exposeName} -n ${testName}`);
      });
    });

    it('Check vm overview page services', async() => {
      await asyncForEach(exposeServices, async(srv) => {
        expect(vmView.vmDetailService(testName, srv.exposeName).getText()).toEqual(srv.exposeName);
        await vmView.vmDetailService(testName, srv.exposeName).click();
        expect(browser.getCurrentUrl()).toEqual(`${appHost}/k8s/ns/${testName}/services/${srv.exposeName}`);

        await browser.get(`${appHost}/k8s/ns/${testName}/virtualmachines/${vmName}`);
        await isLoaded();
      });
    });
  });
});
