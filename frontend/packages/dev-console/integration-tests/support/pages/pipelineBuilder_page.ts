export const pipelinesPage = {
  selectTask: (taskName: string = 'kn') => {
    cy.get('foreignObject button').click();
    cy.byTestActionID(taskName).click();
  },

  addParameters: (
    paramName: string,
    description: string = 'description',
    defaultValue: string = 'value1',
  ) => {
    cy.byButtonText('Add Parameters').click();
    cy.get('#form-input-params-0-name-field').type(paramName);
    cy.get('#form-input-params-0-description-field').type(description);
    cy.get('#form-input-params-0-default-field').type(defaultValue);
  },

  addResource: (resourceName: string) => {
    cy.byButtonText('Add Resources').click();
    cy.get('#form-input-resources-0-name-field').type(resourceName);
    cy.byLegacyTestID('dropdown-button').click();
    cy.get('[data-test-dropdown-menu="git"]').click();
  },

  enterPipelineName: (pipelineName: string) => {
    cy.get('#form-input-name-field').clear();
    cy.get('#form-input-name-field').type(pipelineName);
  },

  verifyNewPipelineBuilderPage: () => {
    cy.get('#form-input-name-field').should('have.text', 'new-pipeline');
    cy.byLegacyTestID('submit-button').should('be.disabled');
  },
};

export const createPipelineFromBuilderPage = (pipelineName: string, taskName: string) => {
  cy.byButtonText('Create Pipeline').click();
  pipelinesPage.enterPipelineName(pipelineName);
  pipelinesPage.selectTask(taskName);
  cy.byLegacyTestID('submit-button').click();
};

export const createPipelineFromYamlPage = () => {
  cy.byButtonText('Create Pipeline').click();
  cy.byButtonText('Edit YAML').click();
  cy.get('form[name="form"]').should('be.visible');
  cy.get('form[name="form"] h2').should('contain.text', 'Switch to YAML Editor?');
  cy.get('#confirm-action').click();
  cy.get('p.help-block').should('contain.text', 'YAML or JSON');
  cy.get('#save-changes').click();
};
