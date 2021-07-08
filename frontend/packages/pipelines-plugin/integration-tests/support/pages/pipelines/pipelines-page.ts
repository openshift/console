import { modal } from '@console/cypress-integration-tests/views/modal';
import * as yamlEditor from '@console/cypress-integration-tests/views/yaml-editor';
import { pipelineActions } from '../../constants/pipelines';
import { pipelinesPO, pipelineBuilderPO } from '../../page-objects/pipelines-po';

export const pipelinesPage = {
  clickOnCreatePipeline: () => cy.get(pipelinesPO.createPipeline).click(),

  selectKebabMenu: (pipelineName: string) => {
    cy.get(pipelinesPO.pipelinesTable.table).within(() => {
      cy.get(pipelinesPO.pipelinesTable.pipelineName).each(($el, index) => {
        if ($el.text().includes(pipelineName)) {
          cy.get('tbody tr')
            .eq(index)
            .find(pipelinesPO.pipelinesTable.kebabMenu)
            .click({ force: true });
        }
      });
    });
  },

  selectActionForPipeline: (pipelineName: string, action: string | pipelineActions) => {
    cy.get(pipelinesPO.pipelinesTable.table).within(() => {
      cy.get(pipelinesPO.pipelinesTable.pipelineName).each(($el, index) => {
        if ($el.text().includes(pipelineName)) {
          cy.get('tbody tr')
            .eq(index)
            .find(pipelinesPO.pipelinesTable.kebabMenu)
            .then(($ele1) => {
              cy.wrap($ele1).click({ force: true });
            });
        }
      });
    });
    cy.byTestActionID(action).click({ force: true });
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
        cy.byTestActionID(pipelineActions.Start).click();
        cy.get('[data-test-section-heading="Pipeline Run Details"]').should('be.visible');
        break;
      }
      case pipelineActions.AddTrigger: {
        cy.byTestActionID(pipelineActions.AddTrigger).click();
        cy.get('form').should('be.visible');
        modal.modalTitleShouldContain('Add Trigger');
        break;
      }
      case pipelineActions.EditLabels: {
        cy.byTestActionID(pipelineActions.EditLabels).click();
        cy.get('form').should('be.visible');
        modal.modalTitleShouldContain('Labels');
        break;
      }
      case pipelineActions.EditAnnotations: {
        cy.byTestActionID(pipelineActions.EditAnnotations).click();
        cy.get('form').should('be.visible');
        modal.modalTitleShouldContain('Edit Annotations');
        break;
      }
      case pipelineActions.EditPipeline: {
        cy.byTestActionID(pipelineActions.EditPipeline).click();
        cy.get('h1.odc-pipeline-builder-header__title').should('contain.text', 'Pipeline Builder');
        break;
      }
      case pipelineActions.DeletePipeline: {
        cy.byTestActionID(pipelineActions.DeletePipeline).click();
        cy.get('form').should('be.visible');
        modal.modalTitleShouldContain('Delete Pipeline?');
        break;
      }
      default: {
        throw new Error('operator is not available');
      }
    }
  },

  searchPipelineInPipelinesPage: (pipelineName: string) => {
    cy.get(pipelinesPO.search)
      .should('be.visible')
      .clear()
      .type(pipelineName);
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(3000);
  },

  search: (pipelineName: string) => {
    pipelinesPage.searchPipelineInPipelinesPage(pipelineName);
    cy.get(pipelinesPO.pipelinesTable.table).should('be.visible');
  },

  clearYAMLEditor: () => {
    cy.get(pipelineBuilderPO.yamlView.yamlEditor)
      .click()
      .focused()
      .type('{ctrl}a')
      .clear();
  },

  setEditorContent: (yamlLocation: string) => {
    cy.readFile(yamlLocation).then((str) => {
      yamlEditor.setEditorContent(str);
    });
  },

  selectPipeline: (pipelineName: string) => cy.byLegacyTestID(pipelineName).click(),

  selectPipelineRun: (pipelineName: string) => {
    cy.get(pipelinesPO.pipelinesTable.table, { timeout: 30000 }).should('exist');
    const pipelineRowId = `[data-test-id="${Cypress.env('NAMESPACE')}-${pipelineName}"]`;
    cy.get(pipelineRowId)
      .find('td')
      .eq(2)
      .click();
  },

  verifyPipelinesTableDisplay: () => cy.get(pipelinesPO.pipelinesTable.table).should('be.visible'),

  verifyPipelineTableColumns: () => {
    cy.get(pipelinesPO.pipelinesTable.columnNames).each(($el) => {
      expect(['Name', 'Last run', 'Task status', 'Last run status', 'Last run time', '']).toContain(
        $el.text(),
      );
    });
  },

  verifyCreateButtonIsEnabled: () => cy.get(pipelinesPO.createPipeline).should('be.enabled'),

  verifyKebabMenu: () => cy.get(pipelinesPO.pipelinesTable.kebabMenu).should('be.visible'),

  verifyNameInPipelinesTable: (pipelineName: string) => {
    cy.get(pipelinesPO.search)
      .should('be.visible')
      .clear()
      .type(pipelineName);
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
    cy.get(pipelinesPO.pipelinesTable.lastRunStatus).should('have.text', lastRunStatus);
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
    modal.shouldBeClosed();
  },
};

export const startPipelineInPipelinesPage = {
  clickCancel: () => cy.byLegacyTestID('modal-cancel-action').click(),
  verifySections: () => {
    cy.get(pipelinesPO.startPipeline.sectionTitle).as('sectionTitle');
    cy.get('@sectionTitle')
      .eq(0)
      .should('have.text', 'Git resources');
    cy.get('@sectionTitle')
      .eq(1)
      .should('have.text', 'Advanced options');
  },
  enterGitUrl: (gitUrl: string) => {
    cy.get(pipelinesPO.startPipeline.gitUrl)
      .should('be.enabled')
      .type(gitUrl);
  },
  verifyGitRepoUrlAndEnterGitUrl: (gitUrl: string) => {
    cy.get(pipelinesPO.startPipeline.gitResourceDropdown).then(($btn) => {
      if ($btn.attr('disabled')) {
        startPipelineInPipelinesPage.enterGitUrl(gitUrl);
      } else {
        cy.get(pipelinesPO.startPipeline.gitResourceDropdown).select('Create Pipeline resource');
        startPipelineInPipelinesPage.enterGitUrl(gitUrl);
      }
    });
  },
  selectConfigMap: (configMapValue: string) => {
    cy.selectByAutoCompleteDropDownText(
      pipelinesPO.startPipeline.workspaces.configMap,
      configMapValue,
    );
  },

  selectSecret: (secret: string) => {
    cy.selectByDropDownText(pipelinesPO.startPipeline.workspaces.secret, secret);
  },

  selectPVC: (pvc: string) => {
    cy.selectByAutoCompleteDropDownText(pipelinesPO.startPipeline.workspaces.pvc, pvc);
  },

  enterRevision: (revision: string) => {
    cy.get(pipelinesPO.startPipeline.revision)
      .should('be.visible')
      .type(revision);
  },
  addGitResource: (gitUrl: string, revision: string = 'master') => {
    modal.shouldBeOpened();
    cy.get('form').within(() => {
      // eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.wait(1000);
      cy.get(pipelinesPO.startPipeline.gitResourceDropdown).then(($btn) => {
        if ($btn.attr('disabled')) {
          cy.log('Pipeline resource is not available, so adding a new git resource');
        } else {
          cy.get(pipelinesPO.startPipeline.gitResourceDropdown).select('Create Pipeline resource');
        }
        startPipelineInPipelinesPage.enterGitUrl(gitUrl);
        startPipelineInPipelinesPage.enterRevision(revision);
      });
    });
  },
  clickStart: () => cy.get(pipelinesPO.startPipeline.start).click(),
  clickShowCredentialOptions: () => cy.byButtonText('Show Credential options').click(),
  clickHideCredentialOptions: () => cy.byButtonText('Hide Credential options').click(),
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
    startPipelineInPipelinesPage.clickStart();
  },
  verifyCreateSourceSecretSection: () => {
    cy.get(pipelinesPO.startPipeline.advancedOptions.secretFormTitle).should('be.visible');
    // cy.testA11y('Secret source creation in Start Pipeline Modal');
  },
  verifyFields: () => {
    cy.get(pipelinesPO.startPipeline.secretForm).within(() => {
      cy.get(pipelinesPO.startPipeline.advancedOptions.secretName)
        .scrollIntoView()
        .should('be.visible');
      cy.get(pipelinesPO.startPipeline.advancedOptions.accessTo)
        .scrollIntoView()
        .should('be.visible');
      cy.get(pipelinesPO.startPipeline.advancedOptions.authenticationType)
        .scrollIntoView()
        .should('be.visible');
      cy.get(pipelinesPO.startPipeline.advancedOptions.serverUrl)
        .scrollIntoView()
        .should('be.visible');
    });
  },
  selectWorkSpace: (option: string) => {
    cy.get(pipelinesPO.startPipeline.sharedWorkspace).click();
    switch (option) {
      case 'Empty Directory':
        cy.byTestDropDownMenu('emptyDirectory').click();
        break;
      case 'Config Map':
        cy.byTestDropDownMenu('configMap').click();
        break;
      case 'Secret':
        cy.byTestDropDownMenu('secret').click();
        break;
      case 'PersistentVolumeClaim' || 'PVC':
        cy.byTestDropDownMenu('pvc').click();
        break;
      case 'VolumeClaimTemplate':
        cy.byTestDropDownMenu('volumeClaimTemplate').click();
        break;
      default:
        break;
    }
    cy.log(`user selected ${option} as workspace`);
  },

  selectView: (option: string) => {
    switch (option) {
      case 'Form View':
        cy.get(pipelineBuilderPO.formView.switchToFormView).click();
        break;
      case 'YAML View':
        cy.get(pipelineBuilderPO.yamlView.switchToYAMLView).click();
        break;
      default:
        break;
    }
  },
};
