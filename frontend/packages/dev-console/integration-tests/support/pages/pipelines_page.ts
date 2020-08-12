import { pipelineActions } from "../constants/pipelines";

export const pipelinesObj = {
  createPipeline: '#yaml-create',
  search: 'input[data-test-id="item-filter"]',
  pipelinesTable: {
    table: 'div[role="grid"]',
    pipelineName: 'tr td:nth-child(1)',
    pipelineRunName: 'tr td:nth-child(3)',
    kebabMenu: '[data-test-id="kebab-button"]',
    columnValues: '[aria-label="Pipelines"] tbody tr td',
    columnNames: 'div[aria-label="Pipelines"] thead tr th',
  },
  addTrigger: {
    add: '#confirm-action',
    cancel: '[data-test-id="modal-cancel-action"]',
    gitProviderType: '#form-dropdown-triggerBinding-name-field',
    gitUrl: '#form-input-resources-0-data-params-url-field',
    revision: '#form-input-resources-0-data-params-revision-field',
    variablesMessage: 'p.odc-trigger-binding-section__variable-descriptor',
    variablesLink: '.pf-c-form button',
  },
  editPipeline: {
    title: 'h1.odc-pipeline-builder-header__title'
  },
  removeTrigger: {
    triggerTemplate: '#form-dropdown-selectedTrigger-field',
    remove: '#confirm-action',
    cancel: '[data-test-id="modal-cancel-action"]',
  },
  startPipeline: {
    sectionTitle: 'h2.odc-form-section__heading',
    gitUrl: '#form-input-resources-0-data-params-url-field',
    revision: '#form-input-resources-0-data-params-revision-field',
    start: '#confirm-action',
    cancel: '[data-test-id="modal-cancel-action"]',
    advancedOptions: {
      secretFormTitle: 'h1.odc-secret-form__title',
      secretName: '#form-input-secretName-field',
      accessTo: '#form-dropdown-annotations-key-field',
      serverUrl: '#form-input-annotations-value-field',
      authenticationType: '#form-dropdown-type-field',
      registryServerAddress: 'input[name="address"]',
      userName: 'input[name="username"]',
      password: 'input[name="password"]',
      email: 'input[name="email"]',
      sshPrivateKey: '[data-test-id="file-input-textarea"]',
      tickIcon: '[data-test-id="check-icon"]',
      crossIcon: '[data-test-id="close-icon"]',

    },
  },
  deletePipeline: {
    delete: '#confirm-action',
    cancel: '[data-test-id="modal-cancel-action"]',
  }
}

export const pipelinesPage = {
  createPipeline: () => cy.get(pipelinesObj.createPipeline).click(),

  selectKebabMenu:(pipelineName: string) => {
    cy.get(pipelinesObj.pipelinesTable.table).should('exist');
    cy.get(pipelinesObj.pipelinesTable.pipelineName).each(($el, index) => {
      const text = $el.text()
      if(text.includes(pipelineName)) {
        cy.get('tbody tr').eq(index).find('td:nth-child(6) button').click();
      }
    });
  },

  verifyDefaultPipelineColumnValues: (defaultValue: string = '-') => {
    cy.get(pipelinesObj.pipelinesTable.columnValues).as('colValues');
    cy.get('@colValues').eq(1).should('have.text', defaultValue);
    cy.get('@colValues').eq(2).should('have.text', defaultValue);
    cy.get('@colValues').eq(3).should('have.text', defaultValue);
    cy.get('@colValues').eq(4).should('have.text', defaultValue);
  },
  
  selectAction:(action: pipelineActions)=> {
    switch (action) {
      case pipelineActions.Start: {
        cy.byTestActionID('Start').click();
        cy.get('[data-test-section-heading="Pipeline Run Details"]').should('be.visible');
        break;
      }
      case pipelineActions.AddTrigger: {
        cy.byTestActionID('Add Trigger').click();
        cy.get('form').should('be.visible');
        cy.alertTitleShouldBe('Add Trigger');
        break;
      }
      case pipelineActions.EditLabels: {
        cy.byTestActionID('Edit Labels').click();
        cy.get('form').should('be.visible');
        cy.alertTitleShouldBe('Labels');
        break;
      }
      case pipelineActions.EditAnnotations: {
        cy.byTestActionID('Edit Annotations').click();
        cy.get('form').should('be.visible');
        cy.alertTitleShouldBe('Edit Annotations');
        break;
      }
      case pipelineActions.EditPipeline: {
        cy.byTestActionID('Edit Pipeline').click();
        cy.get('h1.odc-pipeline-builder-header__title').should('contain.text','Pipeline Builder');
        break;
      }
      case pipelineActions.DeletePipeline: {
        cy.byTestActionID('Delete Pipeline').click();
        cy.get('form').should('be.visible');
        cy.alertTitleShouldBe('Delete Pipeline?');
        break;
      }
      default: {
        throw new Error('operator is not available');
      }
    }
  },

  search:(pipelineName: string) => {
    cy.get(pipelinesObj.search, {timeout: 5000}).should('be.visible').clear().type(pipelineName)
    cy.get(pipelinesObj.pipelinesTable.table, {timeout: 2000}).should('be.visible');
  },

  selectPipeline:(pipelineName: string) => cy.byLegacyTestID(pipelineName).click(),

  seelctPipelineRun:(pipelineName: string) => {
    cy.get(pipelinesObj.pipelinesTable.table).should('exist');
    cy.get(pipelinesObj.pipelinesTable.pipelineName).each(($el, index) => {
      if($el.text().includes(pipelineName)) {
        cy.get(pipelinesObj.pipelinesTable.pipelineRunName).eq(index).click();
      }
    });
  },

  verifyPipelinesTableDisplay:() => cy.get(pipelinesObj.pipelinesTable.table).should('be.visible'),

  verifyPipelineTableColumns:() => {
    cy.get(pipelinesObj.pipelinesTable.columnNames).each(($el) => {
      expect(['Name', 'Namespace', 'Last Run', 'Task Status', 'Last Run Status', 'Last Run Time', '']).include($el.text())
    });
  },

  verifyCreateButtonIsEnabled:() => cy.get(pipelinesObj.createPipeline).should('be.enabled'),

  verifyKebabMenu:() => cy.get(pipelinesObj.pipelinesTable.kebabMenu).should('be.visible'),

  verifyNameInPipelinesTable:(pipelineName: string) => {
    cy.get('[title="Pipeline"]').next('a').then(($el) => {
      expect($el.text()).contains(pipelineName);
    });
  },

  verifyNameSpaceInPipelinesTable:(namespace: string) => {
    cy.get('[title="Namespace"]').next('a').then(($el) => {
      expect($el.text()).contains(namespace);
    });
  },

  verifyLastRunStatusInPipelinesTable:(lastRunStatus: string) => {
    cy.get('tbody td:nth-child(5) span span').should('have.text', lastRunStatus);
  },

  verifyOptionInKebabMenu:(option:string) => {
    cy.get('ul.pf-c-dropdown__menu li button').each(($el) => {
      if($el.text().includes(option)) {
        expect($el.text()).contains(option);
      }
    })
  },

  addTrigger:(gitProviderType: string = 'github-pullreq') => {
    cy.alertTitleShouldBe('Add Trigger');
    cy.get(pipelinesObj.addTrigger.gitProviderType).click();
    cy.get(`[data-test-dropdown-menu="${gitProviderType}"]`).click();
    cy.get(pipelinesObj.addTrigger.add).click();
  },

  editPipeline:() => {

  },
};

export const startPipelineInPipelinsPage = {
  clicKCancel:() => cy.byLegacyTestID('modal-cancel-action').click(),
  verifySections:() => {
    cy.get(pipelinesObj.startPipeline.sectionTitle).as('sectionTitle');
    cy.get('@sectionTitle').eq(0).should('have.text', 'Git Resources');
    cy.get('@sectionTitle').eq(1).should('have.text', 'Advanced Options');
  },
  addGitResource:(gitUrl: string, revision:string = 'master') => {
    cy.get('form div.odc-pipeline-resource-dropdown').then(($el) => {
      if($el.attr('disabled') == "disabled"){
        cy.get(pipelinesObj.startPipeline.gitUrl).type(gitUrl);
        cy.get(pipelinesObj.startPipeline.revision).type(revision);
      }
      else {
        $el.find('button').click();
        cy.get('button[role="option"]').eq(0).click();
        cy.get(pipelinesObj.startPipeline.gitUrl).type(gitUrl);
        cy.get(pipelinesObj.startPipeline.revision).type(revision);
      }
    });
  },
  start:() => cy.get(pipelinesObj.startPipeline.start).click(),
  clickShowCredentialOptions:() => cy.byButtonText('Show Credential Options').click(),
  clickHideCredentialOptions:() => cy.byButtonText('Hide Credential Options').click(),
  addSecret:(secretName: string, serverUrl: string, userName:string, password: string, provider: string = 'Git Server', authenticationType: string = 'Basic Authentication') => {
    cy.get(pipelinesObj.startPipeline.advancedOptions.secretName).type(secretName);
    cy.selectByDropDownText(pipelinesObj.startPipeline.advancedOptions.accessTo, provider);
    cy.get(pipelinesObj.startPipeline.advancedOptions.serverUrl).type(serverUrl);
    cy.selectByDropDownText(pipelinesObj.startPipeline.advancedOptions.authenticationType, authenticationType);
    cy.get(pipelinesObj.startPipeline.advancedOptions.userName).type(userName);
    cy.get(pipelinesObj.startPipeline.advancedOptions.password).type(password);
    cy.get(pipelinesObj.startPipeline.advancedOptions.tickIcon).click();
    cy.get(pipelinesObj.startPipeline.start).click();
  },
  verifyCreateSourceSecretSection:() => cy.get(pipelinesObj.startPipeline.advancedOptions.secretFormTitle).should('be.visible'),
  verifyFields:() => {
    cy.get('div.odc-secret-form .pf-c-form__group-label').as('labels');
    cy.get('@labels').eq(0).should('contain.text', 'Secret Name');
    cy.get('@labels').eq(1).should('contain.text', 'Access to');
    cy.get('@labels').eq(2).should('contain.text', 'Server URL');
    cy.get('@labels').eq(3).should('contain.text', 'Authentication Type');
  }
}
