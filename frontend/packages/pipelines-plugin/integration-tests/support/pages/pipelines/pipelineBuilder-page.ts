import { pageTitle } from '@console/dev-console/integration-tests/support/constants/pageTitle';
import { pipelineBuilderText } from '../../constants';
import { pipelineBuilderPO, pipelineDetailsPO } from '../../page-objects/pipelines-po';
import { pipelineDetailsPage } from './pipelineDetails-page';
import { pipelinesPage } from './pipelines-page';

export const pipelineBuilderSidePane = {
  verifyDialog: () => cy.get(pipelineBuilderPO.formView.sidePane.dialog).should('be.visible'),

  selectInputResource: (resourceName: string) => {
    cy.get(pipelineBuilderPO.formView.sidePane.inputResource).select(resourceName);
  },

  removeTask: () => {
    cy.get(pipelineBuilderPO.formView.sidePane.dialog).within(() => {
      cy.selectByDropDownText(pipelineBuilderPO.formView.sidePane.actions, 'Remove task');
    });
    cy.get('[data-test="confirm-action"]').should('be.visible').click();
  },

  enterParameterUrl: (url: string = 'https://github.com/sclorg/golang-ex.git') => {
    pipelineBuilderSidePane.verifyDialog();
    cy.get(pipelineBuilderPO.formView.sidePane.parameterUrlHelper).should(
      'contain.text',
      pipelineBuilderText.formView.sidePane.ParameterUrlHelper,
    );
    cy.get(pipelineBuilderPO.formView.sidePane.parameterUrl).type(url);
  },

  enterRevision: (revision: string) => {
    pipelineBuilderSidePane.verifyDialog();
    cy.get(pipelineBuilderPO.formView.sidePane.parameterRevisionHelper).should(
      'contain.text',
      pipelineBuilderText.formView.sidePane.ParameterRevisionHelper,
    );
    cy.get(pipelineBuilderPO.formView.sidePane.parameterRevision).type(revision);
  },

  selectWorkspace: (workspaceName: string) => {
    pipelineBuilderSidePane.verifyDialog();
    cy.get(pipelineBuilderPO.formView.sidePane.workspaces).scrollIntoView().select(workspaceName);
  },
};

export const pipelineBuilderPage = {
  verifyTitle: () => {
    cy.get(pipelineBuilderPO.title).should('have.text', pageTitle.PipelineBuilder);
    cy.testA11y(pageTitle.PipelineBuilder);
  },
  verifyDefaultPipelineName: (pipelineName: string = pipelineBuilderText.pipelineName) =>
    cy.get(pipelineBuilderPO.formView.name).should('have.value', pipelineName),
  enterPipelineName: (pipelineName: string) => {
    cy.get(pipelineBuilderPO.formView.name).clear().type(pipelineName);
  },
  AddTask: (taskName: string = 'kn') => {
    cy.get(pipelineBuilderPO.formView.quickSearch).type(taskName);
    cy.byTestID('task-cta').click();
  },
  addRedHatTask: (taskName: string) => {
    cy.get(pipelineBuilderPO.formView.quickSearch).type(taskName);
    cy.get(`[data-test="item-name-${taskName}-Red Hat"]`)
      .its('length')
      .then((length) => {
        if (length > 1) {
          cy.get(`[data-test="item-name-${taskName}-Red Hat"]`).eq(1).click();
        } else {
          cy.get(`[data-test="item-name-${taskName}-Red Hat"]`).first().click();
        }
      });
    cy.byTestID('task-cta').click();
  },
  clickAddTask: () => {
    cy.get(pipelineBuilderPO.formView.taskDropdown).click();
  },
  selectTask: (taskName: string = 'kn') => {
    pipelineBuilderPage.clickAddTask();
    pipelineBuilderPage.AddTask(taskName);
  },
  clickOnTask: (taskName: string) => {
    cy.get('.co-spin', { timeout: 80000 }).should('not.exist');
    cy.get(`[data-id="${taskName}"] text`).click({ force: true });
  },
  selectParallelTask: (taskName: string) => {
    cy.mouseHover(pipelineBuilderPO.formView.task);
    cy.get(pipelineBuilderPO.formView.plusTaskIcon).eq(2).click({ force: true });
    cy.get(pipelineBuilderPO.formView.parallelTask).click();
    pipelineBuilderPage.addRedHatTask(taskName);
  },
  selectSeriesTask: (taskName: string) => {
    cy.mouseHover(pipelineBuilderPO.formView.task);
    cy.get(pipelineBuilderPO.formView.plusTaskIcon).first().click({ force: true });
    cy.get(pipelineBuilderPO.formView.seriesTask).click();
    pipelineBuilderPage.AddTask(taskName);
  },
  clickOnAddWorkSpace: () => {
    cy.byButtonText('Add workspace').click();
  },
  clickOnAddResource: () => {},
  addParameters: (
    paramName: string,
    description: string = 'description',
    defaultValue: string = 'value1',
  ) => {
    cy.byButtonText('Add parameter').click();
    cy.get(pipelineBuilderPO.formView.addParams.name).type(paramName);
    cy.get(pipelineBuilderPO.formView.addParams.description).type(description);
    cy.get(pipelineBuilderPO.formView.addParams.defaultValue).type(defaultValue);
  },
  addResource: (resourceName: string) => {
    cy.get(pipelineBuilderPO.formView.addResourcesLink).eq(1).click();
    cy.get(pipelineBuilderPO.formView.addResources.name).type(resourceName);
  },
  verifySection: () => {
    cy.get(pipelineBuilderPO.formView.sectionTitle).as('sectionTitle');
    cy.get('@sectionTitle').eq(0).should('contain.text', pipelineBuilderText.formView.Tasks);
    cy.get('@sectionTitle').eq(1).should('contain.text', pipelineBuilderText.formView.Parameters);
    cy.get('@sectionTitle').eq(2).should('contain.text', pipelineBuilderText.formView.Workspaces);
  },
  clickCreateButton: () => {
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(3000);
    cy.get(pipelineBuilderPO.create).click({ force: true });
  },
  clickSaveButton: () => cy.get(pipelineBuilderPO.create).click(),
  clickYaml: () => {
    pipelinesPage.clickOnCreatePipeline();
    cy.get(pipelineBuilderPO.configureVia.yamlView).click();
  },
  enterYaml: (yamlContent: string) => {
    cy.get(pipelineBuilderPO.yamlCreatePipeline.yamlEditor)
      .click()
      .focused()
      .type('{ctrl}a')
      .type(yamlContent);
  },
  createPipelineFromBuilderPage: (pipelineName: string, taskName: string = 'kn') => {
    pipelineBuilderPage.enterPipelineName(pipelineName);
    pipelineBuilderPage.selectTask(taskName);
    pipelineBuilderPage.clickCreateButton();
    cy.get(pipelineDetailsPO.title).should('be.visible');
  },
  createPipelineFromYamlPage: () => {
    pipelineBuilderPage.clickYaml();
    cy.get(pipelineBuilderPO.create).click();
  },
  createPipelineWithGitResources: (
    pipelineName: string = 'git-pipeline',
    taskName: string = 'openshift-client',
    resourceName: string = 'Git',
  ) => {
    pipelineBuilderPage.enterPipelineName(pipelineName);
    pipelineBuilderPage.selectTask(taskName);
    pipelineBuilderPage.addResource(resourceName);
    pipelineBuilderPage.clickOnTask(taskName);
    pipelineBuilderPage.clickCreateButton();
    pipelineDetailsPage.verifyTitle(pipelineName);
  },

  createPipelineWithWorkspaces: (
    pipelineName: string = 'git-pipeline',
    taskName: string = 'git-clone',
    workspaceName: string = 'git',
  ) => {
    cy.byTestID('form-view-input').check();
    pipelineBuilderPage.enterPipelineName(pipelineName);
    pipelineBuilderPage.selectTask(taskName);
    pipelineBuilderPage.clickOnAddWorkSpace();
    pipelineBuilderPage.addWorkspace(workspaceName);
    pipelineBuilderPage.clickOnTask(taskName);
    pipelineBuilderSidePane.enterParameterUrl('https://github.com/sclorg/nodejs-ex.git');
    pipelineBuilderSidePane.selectWorkspace(workspaceName);
    pipelineBuilderPage.clickCreateButton();
    pipelineDetailsPage.verifyTitle(pipelineName);
  },

  createPipelineWithParameters: (
    pipelineName: string,
    paramName: string = 'testName',
    description: string = 'parameter description',
    defaultValue: string = 'testValue',
    taskName: string = 'kn',
  ) => {
    pipelineBuilderPage.enterPipelineName(pipelineName);
    pipelineBuilderPage.selectTask(taskName);
    pipelineBuilderPage.addParameters(paramName, description, defaultValue);
    pipelineBuilderPage.clickCreateButton();
    cy.get(pipelineDetailsPO.title).should('be.visible');
  },

  selectSampleInYamlView: (yamlSample: string) => {
    cy.get(pipelineBuilderPO.yamlCreatePipeline.samples.sidebar).within(() => {
      cy.byTestID('resource-sidebar-item')
        .contains(yamlSample)
        .parent()
        .find('button')
        .contains('Try it')
        .click();
    });
  },

  selectOptionalWorkspace: (optional: boolean = false) => {
    if (optional === true) {
      cy.get(pipelineBuilderPO.formView.addWorkspaces.optionalWorkspace).check();
      cy.log(`workspace is selected as optional`);
    }
  },

  addWorkspace: (workSpaceName: string, optional?: boolean) => {
    cy.get(pipelineBuilderPO.formView.addWorkspaces.name)
      .scrollIntoView()
      .clear()
      .type(workSpaceName);
    pipelineBuilderPage.selectOptionalWorkspace(optional);
  },
  addFinallyNode: () => {
    cy.get(pipelineBuilderPO.formView.addFinallyNode).click({ force: true });
  },
  clickFinallyTaskList: () =>
    cy.get(pipelineBuilderPO.formView.finallyTaskList).click({ force: true }),
  selectFinallyTask: (taskName: string) => {
    cy.get(pipelineBuilderPO.formView.finallyTaskList).click({ force: true });
    pipelineBuilderPage.AddTask(taskName);
  },
};
