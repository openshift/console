import { execSync } from 'child_process';
import { browser, ExpectedConditions as until } from 'protractor';
import { appHost } from '@console/internal-integration-tests/protractor.conf';
import { untilNoLoadersPresent } from '@console/internal-integration-tests/views/crud.view';
import { waitFor } from '@console/ceph-storage-plugin/integration-tests/utils/helpers';
import {
  OCP_HEALTH_ICON_COLORS,
  SECOND,
} from '@console/ceph-storage-plugin/integration-tests/utils/consts';
import { click } from '@console/shared/src/test-utils/utils';
import {
  compressionValue,
  healthOfMCG,
  noobaaCount,
  obcCount,
  resourceProviders,
  savingsValue,
  resiliencyOfMCG,
  CapacityBreakdown,
  PerformanceCard,
  unifiedHealthButton,
  POPOVER_GREEN_COLOR,
  unifiedDataResiliencyButton,
  mcgPopover,
  rgwPopover,
} from '../views/noobaaDashboardPage.view';
import { testBucket } from '../mocks/obcData';
import { RGW_PROVISIONER } from '../utils/consts';

const loadAndWait = async () => {
  await browser.get(`${appHost}/dashboards/object-service`);
  await browser.wait(until.and(untilNoLoadersPresent));
};

const storageClasses = JSON.parse(execSync('oc get StorageClasses -o json').toString());
const isRGWPresent = storageClasses.items.some((sc) => sc.provisioner === RGW_PROVISIONER);

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

if (!isRGWPresent) {
  describe('Test Status Card', () => {
    beforeAll(async () => {
      await loadAndWait();
    });

    it('Check if Multi Cloud Gateway is in a healthy state', async () => {
      await browser.wait(until.and(untilNoLoadersPresent));
      await browser.wait(until.visibilityOf(healthOfMCG));
      const color = await healthOfMCG.getAttribute('fill');
      expect(color).toBe(OCP_HEALTH_ICON_COLORS.GREEN);
    });

    it('Check if Data Resiliency of MCG is in healthy state', async () => {
      await browser.wait(until.visibilityOf(resiliencyOfMCG));
      const color = await resiliencyOfMCG.getAttribute('fill');
      expect(color).toBe(OCP_HEALTH_ICON_COLORS.GREEN);
    });
  });
}

describe('Test Object Storage Efficiency Card', () => {
  beforeAll(async () => {
    await loadAndWait();
  });

  it('Check if Efficiency Ratio is in acceptable data range', async () => {
    await browser.wait(until.and(untilNoLoadersPresent));
    await browser.wait(until.visibilityOf(compressionValue));
    const effValue = await compressionValue.getText();
    const [ratioA, ratioB] = effValue.split(':');
    const [numA, numB] = [Number(ratioA), Number(ratioB)];
    if (Number.isNaN(numA) || Number.isNaN(numB)) {
      expect(effValue).toEqual('Not available');
    } else {
      expect(numA).toBeGreaterThan(0);
      expect(numB).toEqual(1);
    }
  });

  it('Check for savings value to be in acceptable data range', async () => {
    await browser.wait(until.visibilityOf(savingsValue));
    const savVal = await savingsValue.getText();
    const [savDigits] = savVal.split(' ');
    const numSav = Number(savDigits);
    if (Number.isNaN(numSav)) {
      expect(savVal.trim()).toEqual('Not available');
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

if (isRGWPresent) {
  describe('Test RGW Dashboard items are shown', () => {
    beforeAll(async () => {
      await loadAndWait();
      await browser.sleep(10 * SECOND);
    });

    it('Check if dropdown for Service Type is available in Capacity Breakdown Card', async () => {
      await browser.wait(until.visibilityOf(CapacityBreakdown.serviceTypeDropdown(true)));
      await click(CapacityBreakdown.serviceTypeDropdown(true));
      expect(await CapacityBreakdown.serviceTypeItems.ALL.isPresent()).toBeTruthy();
      expect(await CapacityBreakdown.serviceTypeItems.MCG.isPresent()).toBeTruthy();
      expect(await CapacityBreakdown.serviceTypeItems.RGW.isPresent()).toBeTruthy();
    });

    it('Check if MCG Related Breakdown is disabled when RGW/All Service is selected', async () => {
      await click(CapacityBreakdown.serviceTypeItems.ALL);
      await click(CapacityBreakdown.serviceTypeDropdown(false));
      await click(CapacityBreakdown.breakByDropdown(false));
      expect(await CapacityBreakdown.breakByItems.TOTAL.isEnabled()).toBeTruthy();
      expect(await CapacityBreakdown.breakByItems.PROJECTS.isEnabled()).toBeFalsy();
      expect(await CapacityBreakdown.breakByItems.BUCKETS.isEnabled()).toBeFalsy();
      await click(CapacityBreakdown.breakByDropdown(false));
      await click(CapacityBreakdown.serviceTypeDropdown(false));
      await click(CapacityBreakdown.serviceTypeItems.RGW);
      await click(CapacityBreakdown.serviceTypeDropdown(false));
      await click(CapacityBreakdown.breakByDropdown(false));
      expect(await CapacityBreakdown.breakByItems.TOTAL.isEnabled()).toBeTruthy();
      expect(await CapacityBreakdown.breakByItems.PROJECTS.isEnabled()).toBeFalsy();
      expect(await CapacityBreakdown.breakByItems.BUCKETS.isEnabled()).toBeFalsy();
      await click(CapacityBreakdown.breakByDropdown(false));
    });

    it('Check MCG Related breakdown is enabled when MCG is selected', async () => {
      await click(CapacityBreakdown.serviceTypeDropdown(false));
      await click(CapacityBreakdown.serviceTypeItems.MCG);
      await click(CapacityBreakdown.serviceTypeDropdown(true));
      await click(CapacityBreakdown.breakByDropdown(true));
      expect(await CapacityBreakdown.breakByItems.TOTAL.isEnabled()).toBeTruthy();
      expect(await CapacityBreakdown.breakByItems.PROJECTS.isEnabled()).toBeTruthy();
      expect(await CapacityBreakdown.breakByItems.BUCKETS.isEnabled()).toBeTruthy();
      await click(CapacityBreakdown.breakByDropdown(true));
    });

    it('Check if dropdown for Service Type is available in Performance Card', async () => {
      await click(PerformanceCard.serviceTypeDropdown);
      await expect(await PerformanceCard.serviceTypeItems.MCG.isPresent()).toBeTruthy();
      await expect(await PerformanceCard.serviceTypeItems.RGW.isPresent()).toBeTruthy();
    });

    // Expand on this test after https://github.com/openshift/console/pull/6214 merges
    xit('Check that RGW Performance Graph is visible', async () => {
      await click(PerformanceCard.serviceTypeDropdown.RGW);
      await browser.sleep(3 * SECOND);
      await expect(PerformanceCard.performanceGraph.isPresent()).toBeTruthy();
    });

    it('Check if Both MCG and RGW health are in a healthy state', async () => {
      await browser.wait(until.and(untilNoLoadersPresent));
      await browser.wait(until.visibilityOf(healthOfMCG));
      const overallHealthIcon = await healthOfMCG.getAttribute('fill');
      expect(overallHealthIcon).toBe(POPOVER_GREEN_COLOR);
      await click(unifiedHealthButton);
      await browser.wait(until.visibilityOf(mcgPopover));
      const mcgHealthIcon = await mcgPopover.getAttribute('fill');
      expect(mcgHealthIcon).toBe(POPOVER_GREEN_COLOR);
      await browser.wait(until.visibilityOf(rgwPopover));
      const rgwHealthIcon = rgwPopover.getAttribute('fill');
      expect(rgwHealthIcon).toBe(POPOVER_GREEN_COLOR);
      await click(unifiedHealthButton);
      await browser.sleep(2 * SECOND);
    });

    it('Check if both MCG and RGW are resillient', async () => {
      await browser.wait(until.visibilityOf(resiliencyOfMCG));
      const overallResiliency = resiliencyOfMCG.getAttribute('fill');
      expect(overallResiliency).toBe(POPOVER_GREEN_COLOR);
      await click(unifiedDataResiliencyButton);
      await browser.wait(until.visibilityOf(mcgPopover));
      const mcgResilliencyIcon = await mcgPopover.getAttribute('fill');
      expect(mcgResilliencyIcon).toBe(POPOVER_GREEN_COLOR);
      await browser.wait(until.visibilityOf(rgwPopover));
      const rgwResilliencyIcon = await rgwPopover.getAttribute('fill');
      expect(rgwResilliencyIcon).toBe(POPOVER_GREEN_COLOR);
    });
  });
}
