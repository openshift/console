import { $, ExpectedConditions as until, browser } from 'protractor';
import { global_palette_green_500 as okColor } from '@patternfly/react-tokens/dist/js/global_palette_green_500';
import { global_danger_color_100 as dangerColor } from '@patternfly/react-tokens/dist/js/global_danger_color_100';
import { click } from '@console/shared/src/test-utils/utils';
import { TemplateInstanceKind } from '@console/internal/module/k8s';
import { appHost } from '@console/internal-integration-tests/protractor.conf';
import { clickNavLink } from '@console/internal-integration-tests/views/sidenav.view';
import { LocalVolumeDiscoveryResultKind } from '@console/local-storage-operator-plugin/src/components/disks-list/types';
import { LOCAL_STORAGE_NAMESPACE } from '@console/local-storage-operator-plugin/src/constants';
import { Status } from '../../../src/components/attached-devices-mode/lso-disk-inventory/state-reducer';
import { execCommand } from '../../utils/helpers';
import { list, cells, page, modal } from '../../views/disk-replacement.views';
import { NS } from '../../utils/consts';

let lvdr: LocalVolumeDiscoveryResultKind;

xdescribe('Test disk replacement flow in non failure scenarios', () => {
  beforeAll(async () => {
    const lvdrJson = execCommand(
      `kubectl get localvolumediscoveryresults -n ${LOCAL_STORAGE_NAMESPACE} -o json`,
    );
    lvdr = { ...lvdrJson.items[0] };
    const { nodeName } = lvdr.spec;
    await browser.get(`${appHost}/`);
    await clickNavLink(['Compute', 'Nodes']);
    await page.isLoaded();
    click($(`a[data-test-id="${nodeName}"]`));
    await browser.wait(until.presenceOf(page.diskTab));
    click(page.diskTab);
    await page.isLoaded();
    browser.sleep(5000); // Ensures page is completely loaded for the following tests cases to get verified
  });

  it(`'OCS Status' column is visible`, async () => {
    expect(list.columns.getText()).toBe('OCS Status');
  });

  it(`'OCS Status' column is reflecting '${Status.Online}' status`, async () => {
    const onlineCells = cells.online;
    expect(onlineCells.count()).toBeGreaterThan(0);
    const statusIcon = await cells.statusIcon(onlineCells.first());
    const statusText = await cells.statusText(onlineCells.first());
    expect(statusIcon.getAttribute('fill')).toBe(okColor.value);
    expect(statusText.getText()).toBe(Status.Online);
  });

  it(`Troubleshoot link is not displayed`, async () => {
    const link = await cells.troubleshootLink;
    expect(link.isPresent()).toBeFalsy();
  });

  it('Kebabs are visible and disabled', async () => {
    const kebabs = await list.disabledKebabs;
    expect(kebabs.length).toBe(lvdr.status.discoveredDevices.length);
  });
});

describe('Test disk replacement flow in failure scenarios', () => {
  beforeAll(async () => {
    // execCommand(`kubectl scale deployment rook-ceph-osd-0 --replicas=0 -n ${NS}`);
    const lvdrJson = execCommand(
      `kubectl get localvolumediscoveryresults -n ${LOCAL_STORAGE_NAMESPACE} -o json`,
    );
    lvdr = { ...lvdrJson.items[0] };
    const { nodeName } = lvdr.spec;
    await browser.get(`${appHost}/`);
    await clickNavLink(['Compute', 'Nodes']);
    await page.isLoaded();
    click($(`a[data-test-id="${nodeName}"]`));
    await browser.wait(until.presenceOf(page.diskTab));
    click(page.diskTab);
    await page.isLoaded();
    browser.sleep(5000); // Ensures page is completely loaded for the following tests cases to get verified
  });
  // afterAll(() => {
  //   execCommand(`kubectl scale deployment rook-ceph-osd-0 --replicas=1 -n ${NS}`);
  // });

  it(`'OCS Disk' column is reflecting '${Status.NotResponding}'`, async () => {
    await browser.wait(until.presenceOf(cells.notResponding));
    const notRespondingCell = cells.notResponding;
    const statusIcon = await cells.statusIcon(notRespondingCell);
    const statusText = await cells.statusText(notRespondingCell);
    expect(statusIcon.getAttribute('fill')).toBe(dangerColor.value);
    expect(statusText.getText()).toBe(Status.NotResponding);
  });

  it(`Popover is working when status is ${Status.NotResponding}`, async () => {
    const notRespondingCell = await cells.notResponding;
    await click(notRespondingCell.$('button'));
    await notRespondingCell.getAttribute('data-test-disk').then(async (text) => {
      expect(cells.popover.getText()).toBe(`Troubleshoot disk ${text} here`);
    });
  });

  it('Troubleshoot link is present', () => {
    const link = $('a[data-test-id="disk-troubleshoot-link"]');
    expect(link.isPresent()).toBeTruthy();
  });

  it('Start disk replacement action is working', () => {
    click(list.kebab);
    expect(modal.title.getText()).toBe('Disk Replacement');
    // grab diskname from url
    click(modal.replaceButton);
  });

  it(`'Disk Status' column reflect disk as '${Status.ReplacementReady}' after replace action`, async () => {
    browser.wait(until.presenceOf(cells.replaceReady));
    const statusText = await cells.statusText(cells.replaceReady);
    expect(statusText).toBe(Status.ReplacementReady);
    await click(cells.replaceReady.$('button'));
    // popover
    // expect(cells.popover.getText()).toBe(`${diskName} can be replaced with a disk of same type`);
  });

  xit(`Template is instantiated and is in 'Ready' state`, () => {
    const ti: TemplateInstanceKind = execCommand(`kubectl get templateinstance -n ${NS} -o json`);
    const status = ti.status.conditions?.[0].type;
    expect(status).toBe('Ready');
  });

  xit(`Start replacement action is no more available`, async () => {
    const kebabs = await list.disabledKebabs;
    expect(kebabs.length).toBe(1);
  });
});
