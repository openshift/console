import { helmPO } from '../../pageObjects/helm-po';

export const rollBackHelmRelease = {
  selectRevision: () => cy.get(helmPO.rollBackHelmRelease.revision1).check(),
  clickOnRollBack: () => cy.get(helmPO.rollBackHelmRelease.rollBack).click(),
};
