import { detailsPage } from '@console/cypress-integration-tests/views/details-page';
import { modal } from '@console/cypress-integration-tests/views/modal';
import * as yamlEditor from '@console/cypress-integration-tests/views/yaml-editor';
import { pageTitle } from '@console/dev-console/integration-tests/support/constants';
import { app } from '@console/dev-console/integration-tests/support/pages';
import { pipelineActions, pipelineTabs } from '../../constants/pipelines';
import { pipelinesPO, pipelineBuilderPO } from '../../page-objects/pipelines-po';

export const pipelinesPage = {
  clickOnCreatePipeline: () => {
    detailsPage.titleShouldContain(pageTitle.Pipelines);
    app.waitForLoad();
    cy.get('button');
    cy.get('body').then(($body) => {
      if ($body.find(pipelinesPO.createPipeline).length > 0) {
        cy.get(pipelinesPO.createPipeline).click();
      } else {
        cy.contains(`[data-test-id="dropdown-button"]`, 'Create').click();
        cy.get(pipelineBuilderPO.pipeline).click();
      }
    });
  },

  clickCreateRepository: () => {
    detailsPage.titleShouldContain(pageTitle.Pipelines);
    app.waitForLoad();
    cy.get('body').then(($body) => {
      if ($body.find('[data-test-id="dropdown-button"]').length !== 0) {
        cy.contains('[data-test-id="dropdown-button"]', 'Create').click();
        cy.get(pipelineBuilderPO.repository).click();
      } else {
        cy.get(pipelinesPO.createPipeline).click();
      }
    });
  },

  selectTab: (tabName: pipelineTabs) => {
    switch (tabName) {
      case pipelineTabs.Pipelines:
        cy.byLegacyTestID('horizontal-link-Pipelines').click();
        break;
      case pipelineTabs.PipelineRuns:
        cy.byLegacyTestID('horizontal-link-PipelineRuns').click();
        break;
      case pipelineTabs.Repositories:
        cy.byLegacyTestID('horizontal-link-Repositories').click();
        break;
      default:
        throw new Error('Given tab is not available');
    }
  },

  verifySelectedTab: (tabName: pipelineTabs) => {
    cy.get('.co-m-horizontal-nav__menu-item.co-m-horizontal-nav-item--active > a').should(
      'have.text',
      tabName,
    );
  },

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
    cy.get('[data-test-id="action-items"]').should('be.visible');
  },

  selectActionForPipeline: (pipelineName: string, action: string | pipelineActions) => {
    cy.get(pipelinesPO.pipelinesTable.table).within(() => {
      cy.get(pipelinesPO.pipelinesTable.pipelineName).each(($el, index) => {
        if ($el.text().includes(pipelineName)) {
          cy.get('tbody tr')
            .eq(index)
            .within(() => {
              cy.get(`button${pipelinesPO.pipelinesTable.kebabMenu}`)
                .should('be.visible')
                .click({ force: true });
            });
        }
      });
    });
    cy.byLegacyTestID('action-items').should('be.visible');
    cy.byTestActionID(action).click({ force: true });
  },

  verifyDefaultPipelineColumnValues: (defaultValue: string = '-') => {
    cy.get(pipelinesPO.pipelinesTable.columnValues).as('colValues');
    cy.get('@colValues').eq(1).should('have.text', defaultValue);
    cy.get('@colValues').eq(2).should('have.text', defaultValue);
    cy.get('@colValues').eq(3).should('have.text', defaultValue);
    cy.get('@colValues').eq(4).should('have.text', defaultValue);
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
      case pipelineActions.EditRepository: {
        cy.byTestActionID(pipelineActions.EditRepository).click();
        cy.contains('Repository details').should('be.visible');
        break;
      }
      case pipelineActions.DeleteRepository: {
        cy.byTestActionID(pipelineActions.DeleteRepository).click();
        modal.modalTitleShouldContain('Delete Repository?');
        cy.contains('Repository details').should('be.visible');
        break;
      }
      default: {
        throw new Error('operator is not available');
      }
    }
  },

  search: (name: string) => {
    cy.get(pipelinesPO.search).should('be.visible').clear().type(name);
    cy.get('tbody tr')
      .eq(0)
      .within(() => {
        cy.byLegacyTestID(name);
      });
    cy.get(pipelinesPO.pipelinesTable.table).should('be.visible');
  },

  clearYAMLEditor: () => {
    cy.get(pipelineBuilderPO.yamlView.yamlEditor).click().focused().type('{ctrl}a').clear();
  },

  setEditorContent: (yamlLocation: string) => {
    cy.readFile(yamlLocation).then((str) => {
      yamlEditor.setEditorContent(str);
    });
  },

  selectPipeline: (pipelineName: string) => cy.byLegacyTestID(pipelineName).click(),

  selectPipelineRun: (pipelineName: string) => {
    cy.get(pipelinesPO.pipelinesTable.table).should('exist');
    cy.get(pipelinesPO.pipelinesTable.pipelineName).each(($el, index) => {
      if ($el.text().includes(pipelineName)) {
        cy.get('tbody tr').eq(index).find('td').eq(1).find('a').click({ force: true });
      }
    });
  },

  verifyPipelinesTableDisplay: () => cy.get(pipelinesPO.pipelinesTable.table).should('be.visible'),

  verifyPipelineTableColumns: () => {
    cy.get(pipelinesPO.pipelinesTable.columnNames).each(($el) => {
      expect([
        'Name',
        'Last run',
        'Task status',
        'Last run status',
        'Last run time',
        'Actions',
      ]).toContain($el.text());
    });
  },

  verifyCreateButtonIsEnabled: () => cy.contains('button', 'Create').should('be.enabled'),

  verifyKebabMenu: () => cy.get(pipelinesPO.pipelinesTable.kebabMenu).should('be.visible'),

  verifyNameInPipelinesTable: (pipelineName: string) => {
    cy.get(pipelinesPO.search).should('be.visible').clear().type(pipelineName);
    cy.get('[title="Pipeline"]')
      .next('a')
      .then(($el) => {
        expect($el.text()).toMatch(pipelineName);
      });
    // wait for the table to render after search
    cy.get('tbody tr')
      .eq(0)
      .within(() => {
        cy.byLegacyTestID(pipelineName);
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
    cy.byTestActionID(option).should('be.visible');
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
    cy.get('@sectionTitle').eq(0).should('have.text', 'Workspaces');
    cy.get('@sectionTitle').eq(1).should('have.text', 'Advanced options');
  },
  enterGitUrl: (gitUrl: string) => {
    cy.get(pipelinesPO.startPipeline.gitUrl).should('be.enabled').type(gitUrl);
  },
  verifyGitRepoUrlAndEnterGitUrl: (gitUrl: string) => {
    cy.get('.modal-content').then(($btn) => {
      if ($btn.find(pipelinesPO.startPipeline.gitResourceDropdown).length !== 0) {
        startPipelineInPipelinesPage.enterGitUrl(gitUrl);
        // } else {
        // cy.get(pipelinesPO.startPipeline.gitResourceDropdown).select('Create Pipeline resource');
        // startPipelineInPipelinesPage.enterGitUrl(gitUrl);
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
    cy.selectByAutoCompleteDropDownText(pipelinesPO.startPipeline.workspaces.secret, secret);
  },

  selectPVC: (pvc: string) => {
    cy.selectByAutoCompleteDropDownText(pipelinesPO.startPipeline.workspaces.pvc, pvc);
  },

  enterRevision: (revision: string) => {
    cy.get(pipelinesPO.startPipeline.revision).should('be.visible').type(revision);
  },
  addGitResource: (gitUrl: string, revision: string = 'master') => {
    modal.shouldBeOpened();
    cy.get('form').within(() => {
      app.waitForLoad();
      // cy.get(pipelinesPO.startPipeline.gitResourceDropdown).then(($btn) => {
      //   if ($btn.attr('disabled')) {
      //     cy.log('Pipeline resource is not available, so adding a new git resource');
      //   } else {
      //     cy.get(pipelinesPO.startPipeline.gitResourceDropdown).select('Create Pipeline resource');
      //   }
      //   startPipelineInPipelinesPage.enterGitUrl(gitUrl);
      //   startPipelineInPipelinesPage.enterRevision(revision);
      // });
      cy.get('.modal-content').then(($btn) => {
        if ($btn.find(pipelinesPO.startPipeline.gitResourceDropdown).length !== 0) {
          startPipelineInPipelinesPage.enterGitUrl(gitUrl);
          startPipelineInPipelinesPage.enterRevision(revision);
          // } else {
          // cy.get(pipelinesPO.startPipeline.gitResourceDropdown).select('Create Pipeline resource');
          // startPipelineInPipelinesPage.enterGitUrl(gitUrl);
        }
      });
    });
  },
  clickStart: () => cy.get(pipelinesPO.startPipeline.start).click(),
  clickShowCredentialOptions: () => cy.byButtonText('Show credential options').click(),
  clickHideCredentialOptions: () => cy.byButtonText('Hide credential options').click(),
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
