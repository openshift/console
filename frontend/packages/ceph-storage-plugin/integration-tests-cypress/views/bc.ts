export const bcName = 'test-bucketclass';
const bcDescription =
  'test-bucketClass is a bucket class being used for testing purposes. Please do not use it for real storage purposes in case the test fails and the class is not deleted';

export enum Tier {
  SPREAD = 'SPREAD',
  MIRROR = 'MIRROR',
}

const TierCountMap = Object.freeze({
  [Tier.SPREAD]: 1,
  [Tier.MIRROR]: 2,
});

export const cleanup = () => {
  cy.exec(
    'oc delete backingstore test-store1 test-store2 test-store3 test-store4 -n openshift-storage',
    {
      timeout: 60000,
    },
  );
};

const createPVCBackingStore = (storeName: string) => {
  cy.log(`Creating a Backing Store resource named ${storeName}`);
  const bucketStore = {
    apiVersion: 'noobaa.io/v1alpha1',
    kind: 'BackingStore',
    metadata: {
      name: storeName,
    },
    spec: {
      pvPool: {
        numVolumes: 1,
        storageClass: 'gp2',
        resources: {
          requests: {
            storage: '50Gi',
          },
        },
      },
      type: 'pv-pool',
    },
  };

  cy.exec(`echo '${JSON.stringify(bucketStore)}' | kubectl create -n openshift-storage -f -`);
};

export const createBackingStore = () => {
  createPVCBackingStore('test-store1');
  createPVCBackingStore('test-store2');
  createPVCBackingStore('test-store3');
  createPVCBackingStore('test-store4');
};

const tierLevelToButton = (level: number, tier: Tier) =>
  level === 1
    ? tier === Tier.SPREAD
      ? cy.byTestID('placement-policy-spread1')
      : cy.byTestID('placement-policy-mirror1')
    : tier === Tier.SPREAD
    ? cy.byTestID('placement-policy-spread2')
    : cy.byTestID('placement-policy-mirror2');

const setGeneralData = () => {
  // be.visible check added to wait for the page to load
  cy.byTestID('bucket-class-name')
    .scrollIntoView()
    .should('be.visible');
  cy.byTestID('bucket-class-name').type(bcName);
  cy.byTestID('bucket-class-description').type(bcDescription);
};

const setPlacementPolicy = (tiers: Tier[]) => {
  tierLevelToButton(1, tiers[0]).click();
  if (tiers.length > 1) {
    cy.byTestID('add-tier-btn').click();
    tierLevelToButton(2, tiers[1]).click();
  }
};

const selectBackingStore = (storeNo: number, name: string) => {
  cy.byLegacyTestID(name)
    .eq(storeNo - 1)
    .parent()
    .parent()
    .parent()
    .find('input[type="checkbox"]')
    .first()
    .click();
};

const setBackingStores = (tiers: Tier[]) => {
  const tests = ['test-store4', 'test-store3', 'test-store2', 'test-store1'];
  if (tiers.length > 1) {
    cy.byLegacyTestID('item-filter').should(($items) => {
      expect($items).toHaveLength(2);
    });
  }
  selectBackingStore(1, tests.pop());
  if (TierCountMap[tiers[0]] > 1) {
    selectBackingStore(1, tests.pop());
  }
  // Select tier 2 Backing Stores
  if (tiers.length > 1) {
    selectBackingStore(2, tests.pop());
    if (TierCountMap[tiers[1]] > 1) {
      selectBackingStore(2, tests.pop());
    }
  }
};

export const createBC = (tiers: Tier[]) => {
  setGeneralData();
  cy.contains('Next').click();
  // Placement Policy Page
  setPlacementPolicy(tiers);
  cy.contains('Next').click();
  // Backing Store Selection Page
  setBackingStores(tiers);
  cy.contains('Next').click();
  // Review Page Data Extraction
  cy.contains('button', 'Create BucketClass').click();
};
