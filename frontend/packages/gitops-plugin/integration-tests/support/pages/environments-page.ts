import { environmentsPO } from '../page-objects/environments-po';

export const environmentsPage = {
  verifyNoGitOpsUrlsFound: () => {
    cy.get(environmentsPO.noGitOpsUrlsFound).should(
      'contain.text',
      'No GitOps manifest URLs found',
    );
  },
  verifyArgoCDUrl: () => {
    cy.get(environmentsPO.argoCDLink).should('be.visible');
  },
};
