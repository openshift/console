import { devFilePO } from '../../pageObjects/add-flow-po';
import { createSourceSecret } from '../../pageObjects/global-po';
import { authenticationType } from '../../constants/global';

export const devFilePage = {
  clickTrySample: () =>
    cy
      .get(devFilePO.form)
      .find('button')
      .first()
      .click(),

  enterSourceSecret: (secretName: string, type: authenticationType) => {
    cy.get(devFilePO.form)
      .find('button')
      .contains('Show advanced Git options')
      .click();
    cy.get(devFilePO.formFields.advancedGitOptions.sourceSecret).click();
    cy.get('[data-test-dropdown-menu="create-source-secret"]').click();
    cy.get(createSourceSecret.secretName).type(secretName);
    cy.get(createSourceSecret.authenticationType).click();
    if (type === 'SSHKey') {
      cy.get('[data-test-dropdown-menu="kubernetes.io/ssh-auth"]').click();
      cy.get(createSourceSecret.sshKey.sshPrivateKey).type('');
    } else {
      cy.get('[data-test-dropdown-menu="kubernetes.io/basic-auth"]').click();
      cy.get(createSourceSecret.basicAuthentication.userName).type('');
      cy.get(createSourceSecret.basicAuthentication.password).type('');
    }
  },
};
