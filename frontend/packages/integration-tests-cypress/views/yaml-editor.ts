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

export const isLoaded = () => cy.window().should('have.property', 'yamlEditorReady', true);
export const clickSaveCreateButton = () => cy.byTestID('save-changes').click();
export const clickReloadButton = () => cy.byTestID('reload-object').click();
