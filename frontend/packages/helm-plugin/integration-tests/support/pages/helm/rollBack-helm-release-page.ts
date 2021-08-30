import { helmPO } from '@console/dev-console/integration-tests/support/pageObjects';

export const rollBackHelmRelease = {
  selectRevision: () => {
    cy.get('[id^=form-radiobutton-revision]')
      .last()
      .check();
  },
  clickOnRollBack: () => cy.get(helmPO.rollBackHelmRelease.rollBack).click(),
};
