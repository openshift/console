import { configureVault, isPodRunningWithEncryptedPV } from '../support/vault-standalone';
import { pvc } from '../views/pvc';
import { createStorageClass } from '../views/storage-class';

// Todo(bipuladh): Enable after downstream builds are available with v1 CSIDrivers
xdescribe('Test Ceph pool creation', () => {
  before(() => {
    configureVault();
    cy.login();
    cy.visit('/');
    cy.install();
  });
  it('Sc KMS encryption', () => {
    const scName: string = 'sc-encrypt';
    createStorageClass(scName, '', true);
    cy.clickNavLink(['PersistentVolumeClaims']);
    pvc.createPVC('encrypted-pvc', '1', scName);
    isPodRunningWithEncryptedPV();
  });
});
