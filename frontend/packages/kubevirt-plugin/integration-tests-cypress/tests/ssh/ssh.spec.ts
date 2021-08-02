import { testName } from '../../support';
import sshAdvancedWizardTesting from './ssh-advanced-wizard-testing.includes';
import sshSecretTesting from './ssh-secret-testing.includes';
import sshServiceTesting from './ssh-service-testing.includes';
import sshSimpleWizardTest from './ssh-simple-wizard-test.includes';
import sshVMDetailsPageTesting from './ssh-vm-details-page-testing.includes';

describe('Connect to a VM using SSH testing', () => {
  const sshTestingFunctions = [
    sshAdvancedWizardTesting,
    sshSimpleWizardTest,
    sshSecretTesting,
    sshServiceTesting,
    sshVMDetailsPageTesting,
  ];
  before(() => {
    cy.Login();
    cy.visit('');
    cy.createProject(testName);
  });

  after(() => {
    cy.deleteResource({
      kind: 'Namespace',
      metadata: {
        name: testName,
      },
    });
  });

  sshTestingFunctions.forEach((fn) => fn({ vmName: `${testName}-vm` }));
});
