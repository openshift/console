import { yamlEditor } from './app';

export const importYaml = {
  setYAMLEditorContent: (yamlLocation: string) => {
    cy.get('[data-test="import-yaml"]').click();
    cy.get('.yaml-editor').should('be.visible');
    cy.get('div.monaco-scrollable-element.editor-scrollable.vs-dark')
      .click()
      .focused()
      .type('{ctrl}a')
      .clear();
    yamlEditor.setEditorContent(yamlLocation);
    cy.get('[data-test="save-changes"]').click();
  },
};
