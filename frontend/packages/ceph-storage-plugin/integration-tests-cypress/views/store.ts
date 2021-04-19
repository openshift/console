export enum Providers {
  AWS = 'AWS S3',
  AZURE = 'Azure Blob',
  S3 = 'S3 Compatible',
  PVC = 'PVC',
}

export const testName = 'test-bucket';

export enum StoreType {
  BackingStore = 'backingstore',
  NamespaceStore = 'namespacestore',
}

let storeType = StoreType.BackingStore;

const inputCustomSecrets = () => {
  cy.byTestID('switch-to-creds').click();
  cy.byTestID(`${storeType}-access-key`).type('my_dummy_test_key');
  cy.byTestID(`${storeType}-secret-key`).type('my_dummy_sec_key');
  cy.byTestID(`${storeType}-target-bucket`).type('my_dummy_target');
};

const setupAWS = () => {
  cy.byTestDropDownMenu(Providers.AWS).click();
  cy.byTestID(`${storeType}-aws-region-dropdown`).click();
  cy.byTestDropDownMenu('us-east-1').click();
  inputCustomSecrets();
};

const setupAzureBlob = () => {
  cy.byTestDropDownMenu(Providers.AZURE).click();
  inputCustomSecrets();
};

const setupS3Endpoint = () => {
  const ENDPOINT = 'http://test-endpoint.com';
  cy.byTestDropDownMenu('S3 Compatible').click();
  cy.byTestID(`${storeType}-s3-endpoint`).type(ENDPOINT);
  inputCustomSecrets();
};

const setupPVC = () => cy.byTestDropDownMenu('PVC').click();

const setupProvider = (provider: Providers) => {
  cy.byTestID(`${storeType}-provider`).click();
  switch (provider) {
    case Providers.AWS:
      setupAWS();
      break;
    case Providers.AZURE:
      setupAzureBlob();
      break;
    case Providers.S3:
      setupS3Endpoint();
      break;
    case Providers.PVC:
      setupPVC();
      break;
    default:
      break;
  }
};

export const store = {
  createStore: (provider: Providers) => {
    cy.byTestID(`${storeType}-name`).type(testName);
    setupProvider(provider);
    cy.byTestID(`${storeType}-create-button`).click();
  },
  setStoreType: (type: StoreType) => {
    storeType = type;
  },
};
