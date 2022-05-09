import { yamlEditor } from '@console/dev-console/integration-tests/support/pages';
import { eventingPO } from '../../pageObjects/global-po';

export const createEventPage = {
  clearYAMLEditor: () => {
    cy.get(eventingPO.yamlEditor)
      .click()
      .focused()
      .type('{ctrl}a')
      .clear();
  },
  setYAMLContent: (yamlLocation: string) => {
    cy.readFile(yamlLocation).then((str) => {
      yamlEditor.setEditorContent(str);
    });
  },
};
