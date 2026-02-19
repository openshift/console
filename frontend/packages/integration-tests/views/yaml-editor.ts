import type { editor } from 'monaco-editor/esm/vs/editor/editor.api';

export const getEditorContent = () => {
  return cy
    .window()
    .its('monaco.editor.getModels')
    .should('be.a', 'function')
    .then((getModels: typeof editor.getModels) => {
      return getModels()[0].getValue();
    });
};

export const setEditorContent = (text: string) => {
  return cy
    .window()
    .its('monaco.editor.getModels')
    .should('be.a', 'function')
    .then((getModels: typeof editor.getModels) => {
      return getModels()[0].setValue(text);
    });
};

// initially yamlEditor loads with all grey text, finished loading when editor is color coded
// class='mtk27' is the light green color of property such as 'apiVersion'
export const isLoaded = () => cy.get("[class='mtk27']").should('exist');
// since yaml editor class mtk27 is a font class it doesn't work on an import page with no text
// adding a check for the 1st line number, AND providing a wait allowed the load of the full component
export const isImportLoaded = () => {
  // eslint-disable-next-line cypress/no-unnecessary-waiting
  cy.wait(5000);
  cy.get('.monaco-editor textarea:first').should('exist');
};
export const clickSaveCreateButton = () => cy.byTestID('save-changes').click();
export const clickCancelButton = () => cy.byTestID('cancel').click();
export const clickReloadButton = () => cy.byTestID('reload-object').click();

// YAML Editor Settings Modal helpers
const SETTINGS_MODAL_ID = 'edit-yaml-settings-modal';

export const openEditorSettingsModal = () => {
  cy.get('[aria-label="Editor settings"]').click();
  cy.get(`[data-ouia-component-id="${SETTINGS_MODAL_ID}"]`).should('be.visible');
};

export const closeEditorSettingsModal = () => {
  cy.get(`[data-ouia-component-id="${SETTINGS_MODAL_ID}"]`)
    .find('button[aria-label="Close"]')
    .click();
};

export const verifyEditorSettingsModalIsOpen = () => {
  cy.get(`[data-ouia-component-id="${SETTINGS_MODAL_ID}"]`).should('be.visible');
  cy.get(`#${SETTINGS_MODAL_ID}-title`).should('contain.text', 'Editor settings');
  cy.get(`#${SETTINGS_MODAL_ID}-body`).should('be.visible');
};

export const verifyEditorSettingsModalIsClosed = () => {
  cy.get(`[data-ouia-component-id="${SETTINGS_MODAL_ID}"]`).should('not.exist');
};

// Theme setting helpers
export const selectTheme = (themeName: 'Dark' | 'Light' | 'Use theme setting') => {
  cy.get('#ConfigModalItem-color-theme').should('be.visible');
  cy.get('#ConfigModalItem-color-theme').within(() => {
    cy.get('button[aria-labelledby="ConfigModalItem-color-theme-title"]').click();
  });
  cy.contains(themeName).click();
};

export const verifyEditorTheme = (themeClass: 'vs-dark' | 'vs' | null) => {
  if (themeClass) {
    cy.get('.monaco-editor').should('have.class', themeClass);
  } else {
    cy.get('.monaco-editor').should('exist');
  }
};

// Font size setting helpers
export const getFontSizeInput = () => {
  return cy.get('#ConfigModalItem-font-size').find('input[aria-label="Enter a font size"]');
};

export const getFontSizeIncreaseButton = () => {
  return cy.get('#ConfigModalItem-font-size').find('button[aria-label="Increase font size"]');
};

export const getFontSizeDecreaseButton = () => {
  return cy.get('#ConfigModalItem-font-size').find('button[aria-label="Decrease font size"]');
};

export const setFontSize = (size: number) => {
  getFontSizeInput().type(`{selectall}${size}`);
};

export const verifyFontSizeInEditor = (size: number) => {
  cy.get('.monaco-editor .view-lines').should('have.css', 'font-size', `${size}px`);
};
export const showYAMLSidebar = () => cy.get('[aria-label="Show sidebar"]').click();
export const clickFieldDetailsButton = (fieldName: string) => {
  cy.contains('h5', `${fieldName}`)
    .parents('li')
    .find('button.pf-v6-c-button')
    .contains('View details')
    .click();
};
