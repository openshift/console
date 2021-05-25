export enum Providers {
  AWS = 'AWS S3',
  AZURE = 'Azure Blob',
  S3 = 'S3 Compatible',
  PVC = 'PVC',
}

// Used to identify data-test ids, values are based on data-test fields
export enum StoreType {
  BackingStore = 'backingstore',
  NamespaceStore = 'namespacestore',
}

export const testName = 'test-bucket';

const inputCustomSecrets = (storeType: StoreType) => {
  cy.log('Set custom secrets');
  cy.byTestID('switch-to-creds').click();
  cy.byTestID(`${storeType}-access-key`).type('my_dummy_test_key');
  cy.byTestID(`${storeType}-secret-key`).type('my_dummy_sec_key');
  cy.byTestID(`${storeType}-target-bucket`).type('my_dummy_target');
};

const setupAWS = (storeType: StoreType) => {
  cy.log('Setting up AWS provider');
  cy.byTestDropDownMenu(Providers.AWS).click();
  cy.byTestID(`${storeType}-aws-region-dropdown`).click();
  cy.byTestDropDownMenu('us-east-1').click();
  inputCustomSecrets(storeType);
};

const setupAzureBlob = (storeType: StoreType) => {
  cy.log('Setting up Azure provider');
  cy.byTestDropDownMenu(Providers.AZURE).click();
  inputCustomSecrets(storeType);
};

const setupS3Endpoint = (storeType: StoreType) => {
  cy.log('Setting up s3 endpoint provider');
  const ENDPOINT = 'http://test-endpoint.com';
  cy.byTestDropDownMenu('S3 Compatible').click();
  cy.byTestID(`${storeType}-s3-endpoint`).type(ENDPOINT);
  inputCustomSecrets(storeType);
};

const setupPVC = () => {
  cy.log('Setting up PVC provider');
  cy.byTestDropDownMenu('PVC').click();
};
const setupProvider = (provider: Providers, storeType: StoreType) => {
  cy.byTestID(`${storeType}-provider`).click();
  switch (provider) {
    case Providers.AWS:
      setupAWS(storeType);
      break;
    case Providers.AZURE:
      setupAzureBlob(storeType);
      break;
    case Providers.S3:
      setupS3Endpoint(storeType);
      break;
    case Providers.PVC:
      setupPVC();
      break;
    default:
      break;
  }
};

export const createStore = (provider: Providers, storeType: StoreType = StoreType.BackingStore) => {
  cy.log(`Creating ${storeType}`);
  cy.byTestID(`${storeType}-name`).type(testName);
  setupProvider(provider, storeType);
  cy.byTestID(`${storeType}-create-button`).click();
};
