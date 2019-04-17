import { browser, $, $$, by, ExpectedConditions as until, Key, element } from 'protractor';
import { appHost, testName, checkLogs, checkErrors } from '../protractor.conf';
import { execSync } from 'child_process';

import * as yamlView from '../views/project-status.view';
import * as namespaceView from '../views/namespace.view';
import * as projectStatusView from '../views/project-status.view';


describe('Status page for all projects', () => {

    it('check project selection list for all projects', async() => {
      await browser.get(`${appHost}/overview/all-namespaces`);
      await browser.wait(until.presenceOf(namespaceView.namespaceSelector));
      await namespaceView.namespaceSelector.click();
      await browser.wait(until.presenceOf(namespaceView.selectedNamespace));
      await namespaceView.selectedNamespace.click();
      expect(namespaceView.selectedNamespace.getText()).toEqual('all projects');
    });
     
    it('Check Software Info on the right side', async() => {
      var serverVersion = execSync(`oc version | grep 'Server Version' | gawk -F , '{print $3}' | gawk -F '"' '{print $2}'`).toString();
      await browser.wait(until.presenceOf(projectStatusView.softwareInfo));
      await expect(projectStatusView.softwareInfo.getText()).toContain('Software Info');
      await expect(projectStatusView.softwareInfo.getText()).toContain('Kubernetes');
      await expect(projectStatusView.softwareInfo.innerText === serverVersion);
    });

});
