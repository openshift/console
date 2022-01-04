import { quickSearchAddPO } from '../../pageObjects';
import { app } from '../app';

export const addQuickSearch = {
  selectQuickOption: (option: string, type: string) => {
    cy.get(quickSearchAddPO.quickSearchListItem(option, type))
      .should('be.visible')
      .click();
  },
  enterNodeName: (nodeName: string) => {
    cy.get(quickSearchAddPO.quickSearchInput)
      .clear()
      .type(nodeName);
    app.waitForDocumentLoad();
  },
};
