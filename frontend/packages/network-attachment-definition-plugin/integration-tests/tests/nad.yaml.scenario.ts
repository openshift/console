import { browser, ExpectedConditions as until } from 'protractor';
import { testName } from '@console/internal-integration-tests/protractor.conf';
import {
  saveButton,
  cancelButton,
  setEditorContent,
} from '@console/internal-integration-tests/views/yaml.view';
import { errorMessage, resourceTitle } from '@console/internal-integration-tests/views/crud.view';
import { click } from '@console/shared/src/test-utils/utils';
import { NADDetail } from './models/nadDetail';
import { getNADConfigs } from './nad.form.configs';
import { CNV_BRIDGE, CONFIG_NAME_CNV_BRIDGE, PAGE_LOAD_TIMEOUT_SECS } from './utils/constants';
import { getNADManifest } from './utils/mocks';

describe('Test network attachment definition from YAML', () => {
  const config = getNADConfigs(testName).get(CONFIG_NAME_CNV_BRIDGE);
  const nadDetail = new NADDetail(config);

  beforeEach(async () => {
    await nadDetail.navigateToYAMLEditor();
  });

  it('ID(CNV-4292) Successfully creates NAD from valid YAML', async () => {
    const nadManifest = getNADManifest(testName, config.name, CNV_BRIDGE);
    await setEditorContent(JSON.stringify(nadManifest));
    await click(saveButton);
  });

  it('ID(CNV-4293) Fails to create NAD from invalid YAML', async () => {
    await click(saveButton);
    await browser.wait(until.presenceOf(errorMessage), PAGE_LOAD_TIMEOUT_SECS);
  });

  it('ID(CNV-4294) Cancel button on Create from YAML page redirects back to NAD list.', async () => {
    await click(cancelButton);
    await browser.wait(
      until.textToBePresentInElement(resourceTitle, 'Network Attachment Definitions'),
      PAGE_LOAD_TIMEOUT_SECS,
    );
  });
});
