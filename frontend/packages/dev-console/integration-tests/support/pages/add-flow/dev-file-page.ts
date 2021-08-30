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

  verifyValidatedMessage: (gitUrl: string) => {
    cy.get(gitPO.gitSection.validatedMessage).should(
      'not.have.text',
      messages.addFlow.gitUrlDevfileMessage,
    );
    cy.get(gitPO.gitSection.validatedMessage).should('not.have.text', 'Validating...');
    cy.get('body').then(($body) => {
      if (
        $body
          .find(gitPO.gitSection.validatedMessage)
          .text()
          .includes(messages.addFlow.rateLimitExceeded)
      ) {
        // Remove .git suffix and remove all parts before the last path
        const componentName = gitUrl.replace(/\.git$/, '').replace(/^.*[\\\\/]/, '');
        cy.log(
          `Git Rate limit exceeded for url ${gitUrl}, fill component name "${componentName}" based on the URL to continue tests.`,
        );
        cy.get(gitPO.nodeName).clear();
        cy.get(gitPO.nodeName).type(componentName);
      } else if (
        $body
          .find(gitPO.gitSection.validatedMessage)
          .text()
          .includes(messages.addFlow.privateGitRepoMessage) ||
        $body.find('[aria-label="Warning Alert"]').length
      ) {
        cy.log(`Issue with git url ${gitUrl}, maybe a private repo url. Please check it`);
      }
    });
  },
};
