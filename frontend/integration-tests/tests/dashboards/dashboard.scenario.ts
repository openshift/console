import { browser, ExpectedConditions as until } from 'protractor';
const execSync = require('child_process').execSync;

import { appHost } from '../../protractor.conf';
import * as dashboardView from '../../views/dashboards/dashboards.view';

describe('Inventory card', () => {
  beforeAll(async () => {
    await browser.get(`${appHost}/dashboards`);
    await dashboardView.isLoaded();
    // wait until the counters in the inventory card show up
    await browser.wait(
      until.textToBePresentInElement(dashboardView.inventoryNodesItemLabel, ' Nodes'),
      10000,
    );
  });

  it('Node count is displayed', async () => {
    // get the number of ready and not ready nodes from the CLI
    const output = execSync('oc get nodes -o json', { encoding: 'utf-8' });
    const nodes = JSON.parse(output);
    const displayedLabel = await dashboardView.inventoryNodesItemLabel.getText();
    // comparing if the dashboards are displaying ${nodes.items.length} nodes total
    expect(displayedLabel).toEqual(`${nodes.items.length} Nodes`);
  });
});
