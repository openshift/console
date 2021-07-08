export const getEditorContent = () => {
  return cy.window().then((win: any) => {
    return win.monaco.editor.getModels()[0].getValue();
  });
};

export const setEditorContent = (text: string) => {
  return cy.window().then((win: any) => {
    win.monaco.editor.getModels()[0].setValue(text);
  });
};

// initially yamlEditor loads with all grey text, finished loading when editor is color coded
// class='mtk26' is the light blue color of property such as 'apiVersion'
export const isLoaded = () => cy.get("[class='mtk26']").should('exist');
// since yaml editor class mtk26 is a font class it doesn't work on an import page with no text
// adding a check for the 1st line number, AND providing a wait allowed the load of the full component
export const isImportLoaded = () => {
  // eslint-disable-next-line cypress/no-unnecessary-waiting
  cy.wait(3500);
  cy.get('.monaco-editor textarea:first').should('exist');
};
export const clickSaveCreateButton = () => cy.byTestID('save-changes').click();
export const clickCancelButton = () => cy.byTestID('cancel').click();
export const clickReloadButton = () => cy.byTestID('reload-object').click();
