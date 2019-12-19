import { browser, ExpectedConditions as until, $, $$ } from 'protractor';
import { appHost } from '@console/internal-integration-tests/protractor.conf';
import { execSync } from 'child_process';
import { dashboardIsLoaded } from '@console/shared/src/test-views/dashboard-shared.view';
import * as dashStatus from '../../views/status-health-check.view';
import { click } from '@console/shared/src/test-utils/utils';

describe('Check health data on on main OCP dashboard and see all link.', () => {
  beforeAll(async () => {
    await browser.get(`${appHost}/dashboards`);
    await dashboardIsLoaded();
  });

  it('Check main dashboard health is green', async () => {
    expect(dashStatus.mainHealtGreenSvg.isPresent()).toBe(true);
    expect(dashStatus.mainHealthCardStatus.getText()).toContain('healthy');
  });

  it('Check main dashboard health floating see all card is green', async () => {
    click(dashStatus.seeAllLink);
    await browser.wait(until.presenceOf(dashStatus.seeAllClose));
    expect(dashStatus.seeAllStorageGreenSvg.isPresent()).toBe(true);
    expect(dashStatus.seeAllStorageSection.getText()).toContain('healthy');
    click(dashStatus.seeAllClose);
  });

  it('Check main dashboard health icon is yellow and cluster health is degraded', async () => {
    await browser.wait(until.presenceOf(dashStatus.mainHealtGreenSvg));
    dashStatus.noOutChange('set');
    await browser.wait(until.not(until.presenceOf(dashStatus.mainHealtGreenSvg)));
    await browser.sleep(1000);
    expect(dashStatus.mainHealtYellowSvg.isPresent()).toBe(true);
    expect(dashStatus.mainHealthCardStatus.getText()).toContain('health is degraded');

  });
  it('Check main dashboard health floating see all card is yellow and health is degraded', async () => {
    click(dashStatus.seeAllLink);
    await browser.wait(until.presenceOf(dashStatus.seeAllClose));
    expect(dashStatus.seeAllStorageYellowSvg.isPresent()).toBe(true);
    expect(dashStatus.seeAllStorageSection.getText()).toContain('health is degraded');
    click(dashStatus.seeAllClose);
    dashStatus.noOutChange('unset');
    await browser.wait(until.presenceOf(dashStatus.mainHealtGreenSvg));
  });

  it('Check main dashboard health icon is red and cluster is NA', async () => {
    execSync('oc scale deployment/rook-ceph-mgr-a --replicas=0');
    await browser.wait(until.not(until.presenceOf(dashStatus.mainHealtGreenSvg)));
    await browser.sleep(1000);
    expect(dashStatus.mainHealtRedSvg.isPresent()).toBe(true);
    expect(dashStatus.mainHealthCardStatus.getText()).toContain('is not available');
  });

  it('Check main dashboard health floating see all card is red and cluster is NA', async () => {
    click(dashStatus.seeAllLink);
    await browser.wait(until.presenceOf(dashStatus.seeAllClose));
    expect(dashStatus.seeAllStorageRedSvg.isPresent()).toBe(true);
    expect(dashStatus.seeAllStorageSection.getText()).toContain('is not available');
    click(dashStatus.seeAllClose);
    execSync('oc scale deployment/rook-ceph-mgr-a --replicas=1');
    await browser.wait(until.presenceOf(dashStatus.mainHealtGreenSvg));
      });
});
