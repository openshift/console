export const pipelineDetailsObj = {
  title: '[data-test-section-heading="Pipeline Details"]',
  actionsMenu: '[data-test-id="actions-menu-button"]',
  details: {
    triggerTemplateSection: 'div.odc-trigger-template-list',
    triggerTemplateLink: 'a[data-test-id^="trigger-template-"]',
  }
}
export const triggerTemplateDetailsObj = {
  title: '[data-test-section-heading="Trigger Template Details"]',
  actions: '[data-test-id="actions-menu-button"]',
  details: {
    eventListenerLink: 'a[data-test-id^="event-listener-"]',
  }
}

export const eventListenerDetailsObj = {
  title: '[data-test-section-heading="Event Listener Details"]',
  actions: '[data-test-id="actions-menu-button"]',
  details: {
    triggerBindingLink: '[data-test-id="github-pullreq"]'
  }
}

export const clusterTriggerBindingDetailsObj = {
  title: '[data-test-section-heading="ClusterTriggerBinding Details"]',
  actions: '[data-test-id="actions-menu-button"]',
}

export const pipelineDetailsPage = {
  verifyTitle:(pipelineName: string) => 
    cy.titleShouldBe(pipelineName),

  clickActionMenu: () => 
    cy.byLegacyTestID('actions-menu-button').click(),
  
  selectActionFromActionsDropdown:(action: string) => {
    cy.get(pipelineDetailsObj.actionsMenu).should('be.enabled').click();
    cy.byTestActionID(action).click();
  },

  verifyTriggerTemplateSection:() => 
    cy.get(pipelineDetailsObj.details.triggerTemplateSection).should('be.visible'),

  verifyPage:() => 
    cy.get(pipelineDetailsObj.title).should('contain.text', 'Pipeline Details'),
  
  selectTriggerTemplateLink:() => 
  cy.get(pipelineDetailsObj.details.triggerTemplateLink).click(),
}

export const triggerTemplateDetailsPage = {
  verifyPage:() => cy.get(triggerTemplateDetailsObj.title).should('contain.text', 'Trigger Template Details'),
  verifyTabs:() => {
    cy.get('ul.co-m-horizontal-nav__menu li a').as('tabName');
    cy.get('@tabName').eq(0).should('have.text', 'Details');
    cy.get('@tabName').eq(1).should('have.text', 'YAML');
  },
  verifyFields:() => {
    cy.get('[data-test-id="resource-summary"] dt').as('fieldNames');
    cy.get('@fieldNames').eq(0).should('have.text', 'Name');
    cy.get('@fieldNames').eq(1).should('have.text', 'Namespace');
    cy.get('@fieldNames').eq(2).should('have.text', 'Labels');
    cy.get('@fieldNames').eq(3).should('have.text', 'Annotations');
    cy.get('@fieldNames').eq(4).should('have.text', 'Created At');
    cy.get('@fieldNames').eq(5).should('have.text', 'Owner');
    cy.get('div.odc-dynamic-resource-link-list').as('dynamicLinks');
    cy.get('@dynamicLinks').should('have.length', 2);
    cy.get('@dynamicLinks').eq(0).find('dl dt').should('have.text', 'Pipelines');
    cy.get('@dynamicLinks').eq(1, {timeout: 8000}).find('dl dt').should('have.text', 'Event Listeners');
  },
  verifyActionsDropdown:() => cy.get(triggerTemplateDetailsObj.actions).should('be.visible'),
  selectEventListener:() => cy.get(triggerTemplateDetailsObj.details.eventListenerLink, {timeout:3000}).click(),
}

export const eventListenerDetailsPage = {
  verifyPage:() => cy.get(eventListenerDetailsObj.title).should('contain.text', 'Event Listener Details'),
  verifyTabs:() => {
    cy.get('ul.co-m-horizontal-nav__menu li a').as('tabName');
    cy.get('@tabName').eq(0).should('have.text', 'Details');
    cy.get('@tabName').eq(1).should('have.text', 'YAML');
  },
  verifyFields:() => {
    cy.get('[data-test-id="resource-summary"] dt').as('fieldNames');
    cy.get('@fieldNames').eq(0).should('have.text', 'Name');
    cy.get('@fieldNames').eq(1).should('have.text', 'Namespace');
    cy.get('@fieldNames').eq(2).should('have.text', 'Labels');
    cy.get('@fieldNames').eq(3).should('have.text', 'Annotations');
    cy.get('@fieldNames').eq(4).should('have.text', 'Created At');
    cy.get('@fieldNames').eq(5).should('have.text', 'Owner');
    cy.get('div.odc-dynamic-resource-link-list dl dt').as('dynamicLinks')
    cy.get('@dynamicLinks').eq(0, {timeout:5000}).should('have.text', 'Trigger Templates');
    cy.get('@dynamicLinks').eq(1, {timeout:5000}).should('have.text', 'Trigger Bindings');
  },
  verifyActionsDropdown:() => cy.get(eventListenerDetailsObj.actions).should('be.visible'),
  selectTriggerBindingLink:() => cy.get(eventListenerDetailsObj.details.triggerBindingLink).click(),
}

export const clusterTriggerBindingDetailsPage = {
  verifyPage:() => cy.get(clusterTriggerBindingDetailsObj.title).should('contain.text', 'ClusterTriggerBinding Details'),
  verifyTabs:() => {
    cy.get('ul.co-m-horizontal-nav__menu li a').as('tabName');
    cy.get('@tabName').eq(0).should('have.text', 'Details');
    cy.get('@tabName').eq(1).should('have.text', 'YAML');
  },
  verifyFields:() => {
    cy.get('[data-test-id="resource-summary"] dt .details-item__label').as('fieldNames');
    cy.get('@fieldNames').eq(0).should('have.text', 'Name');
    cy.get('@fieldNames').eq(1).should('have.text', 'Labels');
    cy.get('@fieldNames').eq(2).should('have.text', 'Annotations');
    cy.get('@fieldNames').eq(3).should('have.text', 'Created At');
    cy.get('@fieldNames').eq(4).should('have.text', 'Owner');
  },
  verifyActionsDropdown:() => cy.get(clusterTriggerBindingDetailsObj.actions).should('be.visible'),
}