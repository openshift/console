import { bcName, createBC, Tier, createBackingStore, cleanup } from '../views/bc';
import { commonFlows } from '../views/common';

describe('Tests creation of Bucket Class', () => {
  let tiers: Tier[];

  const createAndTestBucketClass = (tierList: Tier[]) => {
    createBC(tierList);
    // checking bucket class created successfully or not
    cy.byTestSelector('details-item-value__Name').contains(bcName);
    cy.byLegacyTestID('resource-title').contains(bcName);

    // cy.exec(`oc delete bucketclass  ${bcName} -n openshift-storage`);
    cy.byLegacyTestID('actions-menu-button').click();
    cy.byTestActionID('Delete Bucket Class').click();
    cy.byTestID('confirm-action').click();
    cy.byTestID('item-create').should('be.visible');
  };

  before(() => {
    cy.login();
    cy.visit('/');
    createBackingStore();
  });

  beforeEach(() => {
    cy.visit('/');
    commonFlows.navigateToOCS();
    // be.visible check added to wait for the page to load before clicking
    cy.byLegacyTestID('horizontal-link-Bucket Class').should('be.visible');
    cy.byLegacyTestID('horizontal-link-Bucket Class').click();
    cy.byTestID('item-create').click();
  });

  after(() => {
    cleanup();
    cy.logout();
  });

  it('Create a 1 Tier(Spread) Bucket Class', () => {
    tiers = [Tier.SPREAD];
    createAndTestBucketClass(tiers);
  });

  it('Create a 1 Tier(Mirror) Bucket Class', () => {
    tiers = [Tier.MIRROR];
    createAndTestBucketClass(tiers);
  });

  it('Create a 2 Tier(Spread, Spread) Bucket Class', () => {
    tiers = [Tier.SPREAD, Tier.SPREAD];
    createAndTestBucketClass(tiers);
  });

  it('Create a 2 Tier(Spread, Mirror) Bucket Class', () => {
    tiers = [Tier.SPREAD, Tier.MIRROR];
    createAndTestBucketClass(tiers);
  });
});
