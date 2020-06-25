import { execSync } from 'child_process';
import * as _ from 'lodash';
import { $, $$, browser, by, element, ExpectedConditions as until } from 'protractor';
import * as crudView from '@console/internal-integration-tests/views/crud.view';
import { click } from '@console/shared/src/test-utils/utils';
import { testName } from '@console/internal-integration-tests/protractor.conf';
import { TEST_PLATFORM } from '@console/ceph-storage-plugin/integration-tests/views/installFlow.view';
import { mockDefaultBS } from '../mocks/default-backing-store';
import { MOCK_SECRET } from '../utils/consts';

const tier1TableCheckBoxes = $$('table[aria-label="Select Backing Store for Tier 1"] input');
const tier2TableCheckBoxes = $$('table[aria-label="Select Backing Store for Tier 2"] input');

// Wizard Controls
const nextButton = element(by.buttonText('Next'));
const createBucketClassButton = element(by.buttonText('Create Bucket Class'));
const bucketClassNameInput = $('input[aria-label="Bucket Class Name"]');
const bucketClassDescriptionInput = $('textarea[aria-label="Description of bucket class"]');

// Tier Buttons
const tier1Spread = $('input#radio-1');
const tier1Mirror = $('input#radio-2');
const tier2Spread = $('input#radio-3');
const tier2Mirror = $('input#radio-4');
const addTierButton = $('button[data-testid="add-tier-btn"]');

// Review Page Data
const bcName = $('p[data-testid="bc-name"]');
const bcDescription = $('p[data-testid="bc-desc"]');
const tier1Policy = $('h5[data-testid="tier1-policy"]');
const tier2Policy = $('h5[data-testid="tier2-policy"]');

export enum Tier {
  SPREAD = 'SPREAD',
  MIRROR = 'MIRROR',
}

const TierCountMap = Object.freeze({
  [Tier.SPREAD]: 1,
  [Tier.MIRROR]: 2,
});

const getBackingStoreRequiredCount = (tiers: Tier[]) => {
  let count: number = 0;
  count += TierCountMap[tiers[0]];
  if (tiers.length > 1) count += TierCountMap[tiers[1]];
  return count;
};

const createDummyBackingStore = (name: string) => {
  let defaultBS = null;
  if (TEST_PLATFORM === 'OCP') {
    try {
      defaultBS = JSON.parse(
        execSync(
          'kubectl get backingstores.noobaa.io noobaa-default-backing-store -n openshift-storage -o json',
        ).toString(),
      );
    } catch {
      // Create a default backing store by ourselves
      // Create secret to be consumed by the backingstore
      execSync(
        `oc create secret generic ${MOCK_SECRET} -n openshift-storage --from-literal=password='iamthewatcherofthewall'`,
      );
      execSync(
        `echo '${JSON.stringify(mockDefaultBS)}' | kubectl create -n openshift-storage -f -`,
      );
      defaultBS = JSON.parse(
        execSync(
          'kubectl get backingstores.noobaa.io noobaa-default-backing-store -n openshift-storage -o json',
        ).toString(),
      );
    }
  } else {
    defaultBS = JSON.parse(
      execSync(
        'kubectl get backingstores.noobaa.io noobaa-default-backing-store -n openshift-storage -o json',
      ).toString(),
    );
  }
  const customObj = _.pick(defaultBS, ['apiVersion', 'kind', 'metadata', 'spec']);
  customObj.metadata = Object.assign(_.pick(customObj.metadata, ['name', 'namespace']), {
    name,
  });
  execSync(`echo '${JSON.stringify(customObj)}' | kubectl create -f -`);
};

const tierLevelToButton = (level: number, tier: Tier) =>
  level === 1
    ? tier === Tier.SPREAD
      ? tier1Spread
      : tier1Mirror
    : tier === Tier.SPREAD
    ? tier2Spread
    : tier2Mirror;

export class BucketClassHandler {
  name: string;

  namespace: string;

  description: string;

  tiers: Tier[];

  constructor(name: string, description: string, namespace: string = 'openshift-storage') {
    this.name = name;
    this.namespace = namespace;
    this.description = description;
    // Create 3 backingStores similar to default backing store
    for (let count = 0; count < 3; count++) {
      createDummyBackingStore(`${testName}-${count}`);
    }
  }

  setTiers(tiers: Tier[]) {
    this.tiers = tiers;
  }

  async createBC() {
    // Select namespace
    await browser.wait(until.and(crudView.untilNoLoadersPresent));
    // General Data Page
    await this.setGeneralData();
    await click(nextButton);
    // Placement Policy Page
    await browser.wait(until.and(crudView.untilNoLoadersPresent));
    await this.setPlacementPolicy();
    await click(nextButton);
    // Backing Store Selection Page
    await browser.wait(until.and(crudView.untilNoLoadersPresent));
    await this.setBackingStores();
    await click(nextButton);
    // Review Page
    await browser.wait(until.and(crudView.untilNoLoadersPresent));
    const data = await this.getReviewPageData();
    await click(createBucketClassButton);
    return data;
  }

  async setGeneralData() {
    await bucketClassNameInput.sendKeys(this.name);
    await bucketClassDescriptionInput.sendKeys(this.name);
  }

  async setPlacementPolicy() {
    await click(tierLevelToButton(1, this.tiers[0]));
    if (this.tiers.length > 1) {
      await click(addTierButton);
      await click(tierLevelToButton(2, this.tiers[1]));
    }
  }

  async setBackingStores() {
    // Wait until the table gets populated
    await browser.wait(
      until.and(
        async () =>
          getBackingStoreRequiredCount(this.tiers) <= (await tier1TableCheckBoxes.count()),
      ),
    );
    // Select tier 1 Backing Stores
    await click(tier1TableCheckBoxes.get(0));
    if (TierCountMap[this.tiers[0]] > 1) await click(tier1TableCheckBoxes.get(1));
    // Select tier 2 Backing Stores
    if (this.tiers.length > 1) {
      await click(tier2TableCheckBoxes.get(0));
      if (TierCountMap[this.tiers[1]] > 1) await click(tier2TableCheckBoxes.get(1));
    }
  }

  async getReviewPageData() {
    const dump = {
      name: await bcName.getText(),
      description: await bcDescription.getText(),
      tier1Policy: await tier1Policy.getText(),
      tier2Policy: null,
    };
    if (this.tiers.length > 1) {
      dump.tier2Policy = await tier2Policy.getText();
    }
    return dump;
  }
}
