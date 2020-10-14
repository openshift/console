import { execSync } from 'child_process';
import { browser, ExpectedConditions as until } from 'protractor';
import { appHost } from '@console/internal-integration-tests/protractor.conf';
import { isLoaded as dashboardIsLoaded } from '@console/shared/src/test-views/dashboard-shared.view';
import {
  mainHealtGreenSvg,
  mainHealtRedSvg,
  mainHealtYellowSvg,
  noOutChange,
} from '../../views/ocp-dashboard-card-healthcheck.view';
import { SECOND } from '../../utils/consts';

describe('Check health data on main OCP dashboard ', () => {
  beforeAll(async () => {
    await browser.get(`${appHost}/dashboards`);
    await dashboardIsLoaded();
  });

  it('Check main dashboard health is green', async () => {
    await browser.sleep(7 * SECOND);
    expect(mainHealtGreenSvg.isPresent()).toBe(true);
  });

  it('Check main dashboard health icon is yellow and cluster health is degraded.', async () => {
    await browser.wait(until.presenceOf(mainHealtGreenSvg));
    noOutChange('set');
    await browser.wait(until.not(until.presenceOf(mainHealtGreenSvg)), 60 * SECOND);
    await browser.sleep(2 * SECOND);
    expect(mainHealtYellowSvg.isPresent()).toBe(true);
    noOutChange('unset');
    await browser.wait(until.presenceOf(mainHealtGreenSvg), 120 * SECOND);
  });

  xit('Check main dashboard health icon is red and cluster is NA', async () => {
    execSync('kubectl -n openshift-storage scale deployment/rook-ceph-mgr-a --replicas=0');
    await browser.wait(until.not(until.presenceOf(mainHealtGreenSvg)));
    await browser.sleep(2 * SECOND);
    expect(mainHealtRedSvg.isPresent()).toBe(true);
    execSync('kubectl -n openshift-storage scale deployment/rook-ceph-mgr-a --replicas=1');
    await browser.wait(until.presenceOf(mainHealtGreenSvg));
  });
});
