import { authenticationType, messages } from '../../constants';
import { devFilePO, createSourceSecret, gitPO } from '../../pageObjects';

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
  verifyValidatedMessage: (gitUrl = 'https://github.com/sclorg/nodejs-ex.git') => {
    cy.get(gitPO.gitSection.validatedMessage).should('not.have.text', 'Validating...');
    cy.get('body').then(($body) => {
      if (
        $body
          .find(gitPO.gitSection.validatedMessage)
          .text()
          .includes(messages.addFlow.privateGitRepoMessage) ||
        $body
          .find(gitPO.gitSection.validatedMessage)
          .text()
          .includes(messages.addFlow.rateLimitExceeded) ||
        $body.find('[aria-label="Warning Alert"]').length
      ) {
        cy.log(
          `Issue with Git Rate limit or given ${gitUrl} may be private repo url. please check it`,
        );
      }
    });
  },
};
