import { execSync } from 'child_process';
import { browser, ExpectedConditions as until } from 'protractor';
import { appHost } from '@console/internal-integration-tests/protractor.conf';
import { isLoaded as dashboardIsLoaded } from '@console/shared/src/test-views/dashboard-shared.view';
import { click } from '@console/shared/src/test-utils/utils';
import {
  mainHealtGreenSvg,
  mainHealthCardStatus,
  mainHealtRedSvg,
  mainHealtYellowSvg,
  noOutChange,
  seeAllClose,
  seeAllLink,
  seeAllStorageGreenSvg,
  seeAllStorageRedSvg,
  seeAllStorageSection,
  seeAllStorageYellowSvg,
} from '../../views/ocp-dashboard-card-healthcheck.view';
import { SECOND, OCP_TEXT_STATUS } from '../../utils/consts';

describe('Check health data on main OCP dashboard and see all link.', () => {
  beforeAll(async () => {
    await browser.get(`${appHost}/dashboards`);
    await dashboardIsLoaded();
  });

  it('Check main dashboard health is green', async () => {
    expect(mainHealtGreenSvg.isPresent()).toBe(true);
    expect(mainHealthCardStatus.getText()).toContain(OCP_TEXT_STATUS.HEALTHY);
  });

  it('Check main dashboard health floating see all card is green', async () => {
    await click(seeAllLink);
    await browser.wait(until.presenceOf(seeAllClose));
    expect(seeAllStorageGreenSvg.isPresent()).toBe(true);
    expect(seeAllStorageSection.getText()).toContain(OCP_TEXT_STATUS.HEALTHY);
    await click(seeAllClose);
  });

  it('Check main dashboard health icon is yellow and cluster health is degraded', async () => {
    await browser.wait(until.presenceOf(mainHealtGreenSvg));
    noOutChange('set');
    await browser.wait(until.not(until.presenceOf(mainHealtGreenSvg)));
    await browser.sleep(2 * SECOND);
    expect(mainHealtYellowSvg.isPresent()).toBe(true);
    expect(mainHealthCardStatus.getText()).toContain(OCP_TEXT_STATUS.DEGRADED);
  });

  it('Check main dashboard health floating see all card is yellow and health is degraded', async () => {
    await click(seeAllLink);
    await browser.wait(until.presenceOf(seeAllClose));
    expect(seeAllStorageYellowSvg.isPresent()).toBe(true);
    expect(seeAllStorageSection.getText()).toContain(OCP_TEXT_STATUS.DEGRADED);
    await click(seeAllClose);
    noOutChange('unset');
    await browser.wait(until.presenceOf(mainHealtGreenSvg));
  });

  it('Check main dashboard health icon is red and cluster is NA', async () => {
    execSync('kubectl -n openshift-storage scale deployment/rook-ceph-mgr-a --replicas=0');
    await browser.wait(until.not(until.presenceOf(mainHealtGreenSvg)));
    await browser.sleep(2 * SECOND);
    expect(mainHealtRedSvg.isPresent()).toBe(true);
    expect(mainHealthCardStatus.getText()).toContain(OCP_TEXT_STATUS.NOT_AVAILABLE);
  });

  it('Check main dashboard health floating see all card is red and cluster is NA', async () => {
    await click(seeAllLink);
    await browser.wait(until.presenceOf(seeAllClose));
    expect(seeAllStorageRedSvg.isPresent()).toBe(true);
    expect(seeAllStorageSection.getText()).toContain(OCP_TEXT_STATUS.NOT_AVAILABLE);
    await click(seeAllClose);
    execSync('kubectl -n openshift-storage scale deployment/rook-ceph-mgr-a --replicas=1');
    await browser.wait(until.presenceOf(mainHealtGreenSvg));
  });
});
