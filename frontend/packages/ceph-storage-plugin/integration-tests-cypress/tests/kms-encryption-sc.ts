import { configureVault, isPodRunningWithEncryptedPV } from '../support/vault-standalone';
import { createStorageClass } from '../views/storage-class';
import { pvc } from '../views/pvc';

describe('Test Ceph pool creation', () => {
  before(() => {
    configureVault();
    cy.login();
    cy.visit('/');
    cy.install();
  });
  it('Sc KMS encryption', () => {
    const scName: string = 'sc-encrypt';
    createStorageClass(scName, true);
    cy.clickNavLink(['PersistentVolumeClaims']);
    pvc.createPVC('encrypted-pvc', '1', scName);
    isPodRunningWithEncryptedPV();
  });
});
