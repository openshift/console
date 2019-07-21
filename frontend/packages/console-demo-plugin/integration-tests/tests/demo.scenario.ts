import { browser } from 'protractor';
import { appHost, testName } from '@console/internal-integration-tests/protractor.conf';
import * as crudView from '@console/internal-integration-tests/views/crud.view';

describe('Demo integration test', () => {
  it(`will load namespace ${testName} details`, async () => {
    // Use projects if OpenShift so non-admin users can run tests.
    const resource = browser.params.openshift === 'true' ? 'projects' : 'namespaces';
    await browser.get(`${appHost}/k8s/cluster/${resource}/${testName}`);
    await crudView.isLoaded();

    expect(browser.getCurrentUrl()).toContain(appHost);
  });
});
