import { execSync } from 'child_process';
import { browser, ExpectedConditions as until } from 'protractor';
import { appHost } from '../../../../../integration-tests/protractor.conf.ts';
import * as dashboardView from '../../../../../integration-tests/views/dashboards/dashboards.view';

describe('Inventory card', () => {
  beforeAll(async () => {
    await browser.get(`${appHost}/dashboards`);
    await dashboardView.isLoaded();
    // wait until the counters in the inventory card show up
    await browser.wait(
      until.textToBePresentInElement(dashboardView.inventoryHostsItemLabel, ' Bare Metal Hosts'),
      10000,
    );
  });

  it('Host count is displayed', async () => {
    // get the hosts and their statuses from the CLI
    const output = execSync('oc get baremetalhosts -n openshift-machine-api -o json', {
      encoding: 'utf-8',
    });
    const hosts = JSON.parse(output);
    const displayedLabel = await dashboardView.inventoryHostsItemLabel.getText();
    // comparing if the dashboards are displaying ${hosts.items.length} hosts total
    expect(displayedLabel).toEqual(`${hosts.items.length} Bare Metal Hosts`);
  });
});
