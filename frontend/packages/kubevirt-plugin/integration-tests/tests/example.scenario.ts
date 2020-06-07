import { browser } from 'protractor';
import { isLoaded } from '@console/internal-integration-tests/views/crud.view';
import { appHost, testName } from '@console/internal-integration-tests/protractor.conf';

// This is an dummy test - for development only.
describe('Successful example test', () => {
  it('Navigate to virtualization page', async () => {
    await browser.get(`${appHost}/k8s/ns/${testName}/virtualization`);
    await isLoaded();
  });
});
