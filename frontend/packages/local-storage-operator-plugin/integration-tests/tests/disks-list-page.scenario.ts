import { $, ExpectedConditions as until, browser, Key } from 'protractor';
import { execSync } from 'child_process';
import { appHost } from '@console/internal-integration-tests/protractor.conf';
import { clickNavLink } from '@console/internal-integration-tests/views/sidenav.view';
import { click } from '@console/shared/src/test-utils/utils';
import {
  page,
  diskList,
  clickFilterDropdown,
  checkDiskFilter,
  clearDiskFilter,
} from '../views/disks-list-page.views';
import { LOCAL_STORAGE_NAMESPACE } from '../../src/constants';
import {
  LocalVolumeDiscoveryResultKind,
  DiskMetadata,
  DiskStates,
} from '../../src/components/disks-list/types';

// Prerequisite: Local volume discovery to be present
describe('Disk list is accessible from Nodes view', () => {
  let discoveredDevices: DiskMetadata[];
  beforeAll(async () => {
    const lvdrJson = JSON.parse(
      execSync(
        `kubectl get localvolumediscoveryresults -n ${LOCAL_STORAGE_NAMESPACE} -o json`,
      ).toString(),
    );
    const lvdr: LocalVolumeDiscoveryResultKind = lvdrJson.items[0];
    const { nodeName } = lvdr.spec;
    discoveredDevices = lvdr.status.discoveredDevices;
    await browser.get(`${appHost}/`);
    await clickNavLink(['Compute', 'Nodes']);
    await page.isLoaded();
    click($(`a[data-test-id="${nodeName}"]`));
  });

  it('`Disks` tab is enabled and accessible', async () => {
    await browser.wait(until.presenceOf(page.diskTab));
    click(page.diskTab);
  });

  it('List title is `Disks`', async () => {
    await page.isLoaded();
    expect(page.resourceTitles.get(1).getText()).toBe('Disks');
  });

  it('Headers are displayed with correct labels', () => {
    diskList.headerNames.forEach(async (header) => {
      const headers = await $(`th[data-label="${header}"]`);
      expect(headers.isPresent()).toBeTruthy();
    });
  });

  it('Rows are displayed with correct data format', async () => {
    const { rows } = diskList;
    expect(rows.count()).toBe(discoveredDevices.length);
    const firstRow = rows.first().$$('td');
    const firstDisk = discoveredDevices[0];
    expect(firstRow.get(0).getText()).toBe(firstDisk.path);
    expect(firstRow.get(1).getText()).toBe(firstDisk.status.state);
    expect(firstRow.get(2).getAttribute('innerText')).toBe(firstDisk.type || '-');
    expect(firstRow.get(3).getAttribute('innerText')).toBe(firstDisk.model || '-');
    /* @TODO: (afreen): importing `units.js` is creating a cyclic dependency. Fix the imports and modify test condition */
    expect(firstRow.get(4).getAttribute('innerText')).not.toBe('-');
    expect(firstRow.get(5).getAttribute('innerText')).toBe(firstDisk.fstype || '-');
  });

  it('Text filter is accessible and working', async () => {
    const textbox = await diskList.textFilter;
    await textbox.sendKeys(discoveredDevices[0].path);
    let updatedRows = diskList.rows.count();
    expect(updatedRows).toBe(1);
    // info: clear() is not triggering event to clear the filter and update rows
    await textbox.sendKeys(Key.chord(Key.CONTROL, 'a'));
    await textbox.sendKeys(Key.chord(Key.DELETE));
    updatedRows = diskList.rows.count();
    expect(updatedRows).toBe(discoveredDevices.length);
  });

  it('`Disk State` filter is accessible and working', async () => {
    await clickFilterDropdown();
    const filterHeader = await diskList.filterDropdownHeader;
    expect(filterHeader.getText()).toBe('Disk State');
    await clickFilterDropdown(); // closes the opened dropdown
    await checkDiskFilter(DiskStates.Available);
    await clearDiskFilter();
    await checkDiskFilter(DiskStates.NotAvailable);
    await clearDiskFilter();
    await checkDiskFilter(DiskStates.Unknown);
  });
});
