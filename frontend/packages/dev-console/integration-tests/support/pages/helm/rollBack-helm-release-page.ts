import { helmPO } from '../../pageObjects';

export const rollBackHelmRelease = {
  selectRevision: () => cy.get(helmPO.rollBackHelmRelease.revision1).check(),
  clickOnRollBack: () => cy.get(helmPO.rollBackHelmRelease.rollBack).click(),
};
