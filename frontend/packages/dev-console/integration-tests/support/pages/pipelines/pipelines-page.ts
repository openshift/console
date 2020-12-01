import { modal } from '../../../../../integration-tests-cypress/views/modal';
import { pipelineActions } from '../../constants/pipelines';
import { pipelinesPO } from '../../pageObjects/pipelines-po';

export const pipelinesPage = {
  clickOncreatePipeline: () => cy.get(pipelinesPO.createPipeline).click(),

  selectKebabMenu: (pipelineName: string) => {
    cy.get(pipelinesPO.pipelinesTable.table).should('exist');
    cy.get(pipelinesPO.pipelinesTable.pipelineName).each(($el, index) => {
      const text = $el.text();
      if (text.includes(pipelineName)) {
        cy.get('tbody tr')
          .eq(index)
          .find('td:nth-child(6) button')
          .click();
      }
    });
  },

  verifyDefaultPipelineColumnValues: (defaultValue: string = '-') => {
    cy.get(pipelinesPO.pipelinesTable.columnValues).as('colValues');
    cy.get('@colValues')
      .eq(1)
      .should('have.text', defaultValue);
    cy.get('@colValues')
      .eq(2)
      .should('have.text', defaultValue);
    cy.get('@colValues')
      .eq(3)
      .should('have.text', defaultValue);
    cy.get('@colValues')
      .eq(4)
      .should('have.text', defaultValue);
  },

  selectAction: (action: pipelineActions) => {
    switch (action) {
      case pipelineActions.Start: {
        cy.byTestActionID('Start').click();
        cy.get('[data-test-section-heading="Pipeline Run Details"]').should('be.visible');
        break;
      }
      case pipelineActions.AddTrigger: {
        cy.byTestActionID('Add Trigger').click();
        cy.get('form').should('be.visible');
        modal.modalTitleShouldContain('Add Trigger');
        break;
      }
      case pipelineActions.EditLabels: {
        cy.byTestActionID('Edit Labels').click();
        cy.get('form').should('be.visible');
        modal.modalTitleShouldContain('Labels');
        break;
      }
      case pipelineActions.EditAnnotations: {
        cy.byTestActionID('Edit Annotations').click();
        cy.get('form').should('be.visible');
        modal.modalTitleShouldContain('Edit Annotations');
        break;
      }
      case pipelineActions.EditPipeline: {
        cy.byTestActionID('Edit Pipeline').click();
        cy.get('h1.odc-pipeline-builder-header__title').should('contain.text', 'Pipeline Builder');
        break;
      }
      case pipelineActions.DeletePipeline: {
        cy.byTestActionID('Delete Pipeline').click();
        cy.get('form').should('be.visible');
        modal.modalTitleShouldContain('Delete Pipeline?');
        break;
      }
      default: {
        throw new Error('operator is not available');
      }
    }
  },

  search: (pipelineName: string) => {
    cy.get(pipelinesPO.search)
      .should('be.visible')
      .clear()
      .type(pipelineName);
    cy.get(pipelinesPO.pipelinesTable.table).should('be.visible');
  },

  selectPipeline: (pipelineName: string) => cy.byLegacyTestID(pipelineName).click(),

  seelctPipelineRun: (pipelineName: string) => {
    cy.get(pipelinesPO.pipelinesTable.table, { timeout: 30000 }).should('exist');
    cy.get(pipelinesPO.pipelinesTable.pipelineName).each(($el, index) => {
      if ($el.text().includes(pipelineName)) {
        cy.get(pipelinesPO.pipelinesTable.pipelineRunName)
          .eq(index)
          .click();
        cy.get('[data-test-section-heading="Pipeline Run Details"]').should('be.visible');
      }
    });
  },

  verifyPipelinesTableDisplay: () => cy.get(pipelinesPO.pipelinesTable.table).should('be.visible'),

  verifyPipelineTableColumns: () => {
    cy.get(pipelinesPO.pipelinesTable.columnNames).each(($el) => {
      expect(['Name', 'Last Run', 'Task Status', 'Last Run Status', 'Last Run Time', '']).toContain(
        $el.text(),
      );
    });
  },

  verifyCreateButtonIsEnabled: () => cy.get(pipelinesPO.createPipeline).should('be.enabled'),

  verifyKebabMenu: () => cy.get(pipelinesPO.pipelinesTable.kebabMenu).should('be.visible'),

  verifyNameInPipelinesTable: (pipelineName: string) => {
    cy.get('[title="Pipeline"]')
      .next('a')
      .then(($el) => {
        expect($el.text()).toMatch(pipelineName);
      });
  },

  verifyNameSpaceInPipelinesTable: (namespace: string) => {
    cy.get('[title="Namespace"]')
      .next('a')
      .then(($el) => {
        expect($el.text()).toMatch(namespace);
      });
  },

  verifyLastRunStatusInPipelinesTable: (lastRunStatus: string) => {
    cy.get('tbody td:nth-child(4) span span').should('have.text', lastRunStatus);
  },

  verifyOptionInKebabMenu: (option: string) => {
    cy.get('ul.pf-c-dropdown__menu li button').each(($el) => {
      if ($el.text().includes(option)) {
        expect($el.text()).toMatch(option);
      }
    });
  },

  addTrigger: (gitProviderType: string = 'github-pullreq') => {
    modal.modalTitleShouldContain('Add Trigger');
    cy.get(pipelinesPO.addTrigger.gitProviderType).click();
    cy.get(`[id$="${gitProviderType}-link"]`).click({ force: true });
    cy.get(pipelinesPO.addTrigger.add).click();
  },
};

export const startPipelineInPipelinsPage = {
  clicKCancel: () => cy.byLegacyTestID('modal-cancel-action').click(),
  verifySections: () => {
    cy.get(pipelinesPO.startPipeline.sectionTitle).as('sectionTitle');
    cy.get('@sectionTitle')
      .eq(0)
      .should('have.text', 'Git Resources');
    cy.get('@sectionTitle')
      .eq(1)
      .should('have.text', 'Advanced Options');
  },
  addGitResource: (gitUrl: string, revision: string = 'master') => {
    cy.get('form').then(($el) => {
      if ($el.find('#form-input-parameters-1-default-field').length !== 0) {
        cy.get('#form-input-parameters-1-default-field').type(gitUrl);
      } else if ($el.attr('disabled') === 'disabled') {
        cy.get(pipelinesPO.startPipeline.gitUrl).type(gitUrl);
        cy.get(pipelinesPO.startPipeline.revision).type(revision);
      } else {
        $el.find('button').click();
        cy.get('button[role="option"]')
          .eq(0)
          .click();
        cy.get(pipelinesPO.startPipeline.gitUrl).type(gitUrl);
        cy.get(pipelinesPO.startPipeline.revision).type(revision);
      }
    });
  },
  clickStart: () => cy.get(pipelinesPO.startPipeline.start).click(),
  clickShowCredentialOptions: () => cy.byButtonText('Show Credential Options').click(),
  clickHideCredentialOptions: () => cy.byButtonText('Hide Credential Options').click(),
  addSecret: (
    secretName: string,
    serverUrl: string,
    userName: string,
    password: string,
    provider: string = 'Git Server',
    authenticationType: string = 'Basic Authentication',
  ) => {
    cy.get(pipelinesPO.startPipeline.advancedOptions.secretName).type(secretName);
    cy.selectByDropDownText(pipelinesPO.startPipeline.advancedOptions.accessTo, provider);
    cy.get(pipelinesPO.startPipeline.advancedOptions.serverUrl).type(serverUrl);
    cy.selectByDropDownText(
      pipelinesPO.startPipeline.advancedOptions.authenticationType,
      authenticationType,
    );
    cy.get(pipelinesPO.startPipeline.advancedOptions.userName).type(userName);
    cy.get(pipelinesPO.startPipeline.advancedOptions.password).type(password);
    cy.get(pipelinesPO.startPipeline.advancedOptions.tickIcon).click();
    startPipelineInPipelinsPage.clickStart();
  },
  verifyCreateSourceSecretSection: () =>
    cy.get(pipelinesPO.startPipeline.advancedOptions.secretFormTitle).should('be.visible'),
  verifyFields: () => {
    cy.get('div.odc-secret-form .pf-c-form__group-label').as('labels');
    cy.get('@labels')
      .eq(0)
      .should('contain.text', 'Secret Name');
    cy.get('@labels')
      .eq(1)
      .should('contain.text', 'Access to');
    cy.get('@labels')
      .eq(2)
      .should('contain.text', 'Server URL');
    cy.get('@labels')
      .eq(3)
      .should('contain.text', 'Authentication Type');
  },
};
