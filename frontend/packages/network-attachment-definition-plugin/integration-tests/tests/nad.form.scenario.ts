import { browser, ExpectedConditions as until } from 'protractor';
import { testName } from '@console/internal-integration-tests/protractor.conf';
import * as nadFormView from '../views/nad.form.view';
import { NetworkAttachmentDefinition } from './models/nad';
import { NADForm } from './models/nadForm';
import { getNADConfigs } from './nad.form.configs';
import {
  CNV_BRIDGE_ITEM_ID,
  CONFIG_NAME_CNV_BRIDGE,
  CONFIG_NAME_INVALID_NAME,
} from './utils/constants';

describe('Create network attachment definition using form', () => {
  const configs = getNADConfigs(testName);

  it(`ID(CNV-3256) Creates NAD using CNV bridge`, async () => {
    const config = configs.get(CONFIG_NAME_CNV_BRIDGE);
    const nad = new NetworkAttachmentDefinition(config);
    await nad.create(config, CNV_BRIDGE_ITEM_ID);
    expect(browser.getCurrentUrl()).toContain(testName);
  });

  describe('Test network attachment definition form validation', () => {
    it('ID(CNV-4307) Displays warning in NAD form when invalid name is entered', async () => {
      const config = configs.get(CONFIG_NAME_INVALID_NAME);
      const nad = new NetworkAttachmentDefinition(config);
      await nad.navigateToForm();

      const form = new NADForm();
      await form.fillName(config.name);
      await form.selectNetworkTypeByID(CNV_BRIDGE_ITEM_ID);
      await form.fillBridgeName(config.bridgeName);

      await browser.wait(until.presenceOf(nadFormView.nameErrorBlock));
      expect(nadFormView.nameErrorBlock.getText()).toMatch(
        /has to end with alphanumeric character/,
      );
      expect(nadFormView.createBtn.isEnabled()).toBeFalsy();
    });

    it('ID(CNV-4308) Does not enable create button until all required fields are filled', async () => {
      const config = configs.get(CONFIG_NAME_CNV_BRIDGE);
      const nad = new NetworkAttachmentDefinition(config);
      await nad.navigateToForm();

      const form = new NADForm();
      await form.fillName(config.name);
      expect(nadFormView.createBtn.isEnabled()).toBeFalsy();

      await form.selectNetworkTypeByID(CNV_BRIDGE_ITEM_ID);
      expect(nadFormView.createBtn.isEnabled()).toBeFalsy();

      await form.fillBridgeName(config.bridgeName);
      expect(nadFormView.createBtn.isEnabled()).toBeTruthy();
    });
  });
});
