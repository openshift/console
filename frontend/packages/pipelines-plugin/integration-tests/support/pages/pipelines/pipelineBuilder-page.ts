import { pageTitle } from '@console/dev-console/integration-tests/support/constants/pageTitle';
import { createForm } from '@console/dev-console/integration-tests/support/pages';
import { pipelineBuilderText } from '../../constants';
import { pipelineBuilderPO, pipelineDetailsPO, pipelinesPO } from '../../page-objects/pipelines-po';
import { pipelineDetailsPage } from './pipelineDetails-page';

export const pipelineBuilderSidePane = {
  verifyDialog: () => cy.get(pipelineBuilderPO.formView.sidePane.dialog).should('be.visible'),

  selectInputResource: (resourceName: string) => {
    cy.get(pipelineBuilderPO.formView.sidePane.dialog).within(() => {
      cy.get(pipelineBuilderPO.formView.sidePane.inputResource).select(resourceName);
    });
  },

  removeTask: () => {
    cy.get(pipelineBuilderPO.formView.sidePane.dialog).within(() => {
      cy.selectByDropDownText(pipelineBuilderPO.formView.sidePane.actions, 'Remove Task');
    });
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
      pipelineBuilderText.formView.sidePane.ParamterRevisionHelper,
    );
    cy.get(pipelineBuilderPO.formView.sidePane.parameterRevision).type(revision);
  },

  selectWorkspace: (workspaceName: string) => {
    pipelineBuilderSidePane.verifyDialog();
    cy.get(pipelineBuilderPO.formView.sidePane.workspaces)
      .scrollIntoView()
      .select(workspaceName);
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
    cy.get(pipelineBuilderPO.formView.name)
      .clear()
      .type(pipelineName);
  },
  selectTask: (taskName: string = 'kn') => {
    cy.get('body').then(($body) => {
      if ($body.text().includes('Unable to locate any tasks.')) {
        cy.reload();
      }
    });
    cy.get(pipelineBuilderPO.formView.taskDropdown).click();
    cy.byTestActionID(taskName).click({ force: true });
  },
  clickOnTask: (taskName: string) => cy.get(`[data-id="${taskName}"] text`).click({ force: true }),
  selectParallelTask: (taskName: string) => {
    cy.mouseHover(pipelineBuilderPO.formView.task);
    cy.get(pipelineBuilderPO.formView.plusTaskIcon)
      .eq(2)
      .click({ force: true });
    cy.get(pipelineBuilderPO.formView.parallelTask).click();
    cy.byTestActionID(taskName).click();
  },
  selectSeriesTask: (taskName: string) => {
    cy.mouseHover(pipelineBuilderPO.formView.task);
    cy.get(pipelineBuilderPO.formView.plusTaskIcon)
      .first()
      .click({ force: true });
    cy.get(pipelineBuilderPO.formView.seriesTask).click();
    cy.byTestActionID(taskName).click();
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
  addResource: (resourceName: string, resourceType: string = 'Git') => {
    cy.get(pipelineBuilderPO.formView.addResourcesLink)
      .eq(1)
      .click();
    cy.get(pipelineBuilderPO.formView.addResources.name).type(resourceName);
    cy.get(pipelineBuilderPO.formView.addResources.resourceType).select(resourceType);
  },
  verifySection: () => {
    cy.get(pipelineBuilderPO.formView.sectionTitle).as('sectionTitle');
    cy.get('@sectionTitle')
      .eq(0)
      .should('contain.text', pipelineBuilderText.formView.Tasks);
    cy.get('@sectionTitle')
      .eq(1)
      .should('contain.text', pipelineBuilderText.formView.Parameters);
    cy.get('@sectionTitle')
      .eq(2)
      .should('contain.text', pipelineBuilderText.formView.Resources);
    cy.get('@sectionTitle')
      .eq(3)
      .should('contain.text', pipelineBuilderText.formView.Workspaces);
  },
  clickCreateButton: () => {
    cy.get(pipelineBuilderPO.create).click();
    cy.get('body').then(($body) => {
      if ($body.find('[aria-label="Danger Alert"]').length) {
        cy.log($body.find('[aria-label="Danger Alert"]').text());
        createForm.clickCancel();
      }
    });
  },
  clickSaveButton: () => cy.get(pipelineBuilderPO.create).click(),
  clickYaml: () => {
    cy.get(pipelinesPO.createPipeline).click();
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
    resourceName: string = 'git resource',
  ) => {
    pipelineBuilderPage.enterPipelineName(pipelineName);
    pipelineBuilderPage.selectTask(taskName);
    pipelineBuilderPage.addResource(resourceName);
    pipelineBuilderPage.clickOnTask(taskName);
    pipelineBuilderSidePane.selectInputResource(resourceName);
    pipelineBuilderPage.clickCreateButton();
    pipelineDetailsPage.verifyTitle(pipelineName);
  },

  createPipelineWithWorkspaces: (
    pipelineName: string = 'git-pipeline',
    taskName: string = 'git-clone',
    workspaceName: string = 'git',
  ) => {
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

  selectSampleInYamlView: (yamlSample: string) => {
    cy.get(pipelineBuilderPO.yamlCreatePipeline.samples.sidebar).within(() => {
      cy.get('li.co-resource-sidebar-item')
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
    cy.byTestActionID(taskName).click({ force: true });
  },
};
