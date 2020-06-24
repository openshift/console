import { execSync } from 'child_process';
import { browser, ExpectedConditions as until } from 'protractor';
import { appHost } from '@console/internal-integration-tests/protractor.conf';
import { untilNoLoadersPresent } from '@console/internal-integration-tests/views/crud.view';
import { waitFor } from '@console/ceph-storage-plugin/integration-tests/utils/helpers';
import { OCP_HEALTH_ICON_COLORS } from '@console/ceph-storage-plugin/integration-tests/utils/consts';
import {
  efficiencyValue,
  healthOfMCG,
  noobaaCount,
  obcCount,
  resourceProviders,
  savingsValue,
  resiliencyOfMCG,
} from '../views/noobaaDashboardPage.view';
import { testBucket } from '../mocks/obcData';

const loadAndWait = async () => {
  await browser.get(`${appHost}/dashboards/object-service`);
  await browser.wait(until.and(untilNoLoadersPresent));
};

describe('Tests Buckets Card', () => {
  beforeAll(async () => {
    await loadAndWait();
  });

  it('Test at least one noobaa bucket is present', async () => {
    await browser.wait(until.and(untilNoLoadersPresent));
    await browser.wait(until.visibilityOf(noobaaCount));
    const text = await noobaaCount.getText();
    const [count] = text.split(' ');
    expect(Number(count)).toBeGreaterThanOrEqual(1);
  });

  it('Create an Object Bucket Claim and test equality', async () => {
    await browser.wait(until.visibilityOf(obcCount));
    let text = await obcCount.getText();
    const [initialCount] = text.split(' ');
    execSync(`echo '${JSON.stringify(testBucket)}' | kubectl create -f -`);
    await waitFor(obcCount, (Number(initialCount) + 1).toString());
    text = await obcCount.getText();
    const [finalCount] = text.split(' ');
    expect(Number(finalCount)).toEqual(Number(initialCount) + 1);
    execSync(`echo '${JSON.stringify(testBucket)}' | kubectl delete -f -`);
  });
});

describe('Test Status Card', () => {
  beforeAll(async () => {
    await loadAndWait();
  });

  it('Check if Multi Cloud Gateway is in a healthy state', async () => {
    await browser.wait(until.and(untilNoLoadersPresent));
    await browser.wait(until.visibilityOf(healthOfMCG));
    const color = healthOfMCG.getAttribute('fill');
    expect(color).toBe(OCP_HEALTH_ICON_COLORS.GREEN);
  });

  it('Check if Data Resiliency of MCG is in healthy state', async () => {
    await browser.wait(until.visibilityOf(resiliencyOfMCG));
    const color = healthOfMCG.getAttribute('fill');
    expect(color).toBe(OCP_HEALTH_ICON_COLORS.GREEN);
  });
});

describe('Test Object Data Reduction Card', () => {
  beforeAll(async () => {
    await loadAndWait();
  });

  it('Check if Efficiency Ratio is in acceptable data range', async () => {
    await browser.wait(until.and(untilNoLoadersPresent));
    await browser.wait(until.visibilityOf(efficiencyValue));
    const effValue = await efficiencyValue.getText();
    const [ratioA, ratioB] = effValue.split(':');
    const [numA, numB] = [Number(ratioA), Number(ratioB)];
    expect(numA).toBeGreaterThan(0);
    expect(numB).toBeGreaterThan(0);
  });

  it('Check for savings value to be in acceptable data range', async () => {
    await browser.wait(until.visibilityOf(savingsValue));
    const savVal = await savingsValue.getText();
    const [savDigits] = savVal.split(' ');
    const numSav = Number(savDigits);
    if (Number.isNaN(numSav)) {
      expect(savVal.trim()).toEqual('No Savings');
    } else {
      expect(numSav).toBeGreaterThanOrEqual(0);
    }
  });
});

describe('Test Resource Providers card', () => {
  beforeAll(async () => {
    await loadAndWait();
  });

  it('Check if resource provider has at least 1 provider', async () => {
    await browser.wait(until.and(untilNoLoadersPresent));
    await browser.wait(until.visibilityOf(resourceProviders));
    const text = await resourceProviders.getText();
    expect(text).toBeDefined();
  });
});
