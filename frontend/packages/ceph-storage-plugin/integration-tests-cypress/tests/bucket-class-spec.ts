import {
  createBucketClass,
  Tier,
  BucketClassType,
  StandardBucketClassConfig,
  verifyBucketClass,
  NamespaceBucketClassConfig,
  NamespacePolicyType,
  deleteBucketClass,
  visitBucketClassPage,
} from '../views/bc';
import { checkErrors } from '../../../integration-tests-cypress/support';

describe('Tests creation of Standard Bucket Class', () => {
  const backingStoreResources = ['test-store1', 'test-store2', 'test-store3', 'test-store4'];
  const config = new StandardBucketClassConfig(backingStoreResources, BucketClassType.STANDARD);
  before(() => {
    cy.login();
    cy.visit('/');
    cy.install();
    config.setup();
  });

  beforeEach(() => {
    visitBucketClassPage();
  });

  afterEach(() => {
    verifyBucketClass();
    deleteBucketClass();
    checkErrors();
  });

  after(() => {
    config.cleanup();
    cy.logout();
  });

  it('Create a 1 Tier(Spread) Bucket Class', () => {
    config.tiers = [Tier.SPREAD];
    createBucketClass(config);
  });

  it('Create a 1 Tier(Mirror) Bucket Class', () => {
    config.tiers = [Tier.MIRROR];
    createBucketClass(config);
  });

  it('Create a 2 Tier(Spread, Spread) Bucket Class', () => {
    config.tiers = [Tier.SPREAD, Tier.SPREAD];
    createBucketClass(config);
  });

  it('Create a 2 Tier(Spread, Mirror) Bucket Class', () => {
    config.tiers = [Tier.SPREAD, Tier.MIRROR];
    createBucketClass(config);
  });
});

describe('Tests creation of Namespace Bucket Class', () => {
  const config = new NamespaceBucketClassConfig(
    ['ns1', 'ns2', 'ns3', 'ns4'],
    BucketClassType.NAMESPACE,
  );
  before(() => {
    cy.login();
    cy.visit('/');
    cy.install();
    config.setup();
  });

  beforeEach(() => {
    visitBucketClassPage();
  });

  afterEach(() => {
    verifyBucketClass();
    deleteBucketClass();
    checkErrors();
  });

  after(() => {
    config.cleanup();
    cy.logout();
  });

  it('Create a Single Namespace Bucket Class', () => {
    config.namespacePolicyType = NamespacePolicyType.SINGLE;
    createBucketClass(config);
  });

  it('Create a Multi Namespace Bucket Class', () => {
    config.namespacePolicyType = NamespacePolicyType.MULTI;
    createBucketClass(config);
  });

  it('Create a Cache Namespace Bucket Class', () => {
    config.namespacePolicyType = NamespacePolicyType.CACHE;
    createBucketClass(config);
  });
});
