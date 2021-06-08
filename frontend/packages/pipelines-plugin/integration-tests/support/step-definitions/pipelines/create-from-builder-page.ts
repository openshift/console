import { And, Given, When, Then } from 'cypress-cucumber-preprocessor/steps';
import { safeYAMLToJS } from '@console/shared/src/utils/yaml';
import * as yamlEditor from '@console/cypress-integration-tests/views/yaml-editor';
import {
  pipelinesPage,
  pipelineBuilderPage,
  pipelineDetailsPage,
  pipelineBuilderSidePane,
  pipelineRunDetailsPage,
} from '../../pages';
import { navigateTo, sidePane } from '@console/dev-console/integration-tests/support/pages/app';
import { devNavigationMenu } from '@console/dev-console/integration-tests/support/constants/global';
import {
  pipelineBuilderPO,
  pipelineDetailsPO,
  pipelineRunDetailsPO,
} from '../../page-objects/pipelines-po';

When('user clicks Create Pipeline button on Pipelines page', () => {
  pipelinesPage.clickOnCreatePipeline();
});

Then('user will be redirected to Pipeline Builder page', () => {
  pipelineBuilderPage.verifyTitle();
});

Then(
  'user is able to see pipeline name with default value {string}',
  (pipelineDefaultValue: string) => {
    pipelineBuilderPage.verifyDefaultPipelineName(pipelineDefaultValue);
  },
);

Then('Tasks, Parameters, Resources and Workspaces sections are displayed', () => {
  pipelineBuilderPage.verifySection();
});

Then('Edit Yaml link is enabled', () => {
  cy.byButtonText('Edit YAML').should('be.enabled');
});

Then('Yaml view configuration is displayed', () => {
  cy.get(pipelineBuilderPO.configureVia.yamlView).should('be.visible');
});

Then('Create button is in disabled state', () => {
  cy.byLegacyTestID('submit-button').should('be.disabled');
});

Given('user is at Pipeline Builder page', () => {
  navigateTo(devNavigationMenu.Pipelines);
  pipelinesPage.clickOnCreatePipeline();
  pipelineBuilderPage.verifyTitle();
});

When('user enters pipeline name as {string}', (pipelineName: string) => {
  pipelineBuilderPage.enterPipelineName(pipelineName);
});

When('user selects {string} from Task drop down', (taskName: string) => {
  pipelineBuilderPage.selectTask(taskName);
});

When('user adds another task {string} in parallel', (taskName: string) => {
  pipelineBuilderPage.selectParallelTask(taskName);
  pipelineBuilderPage.addResource('git resource');
  pipelineBuilderPage.clickOnTask(taskName);
  cy.get(pipelineBuilderPO.formView.sidePane.inputResource).click();
  cy.byTestDropDownMenu('git resource').click();
  pipelineBuilderPage.clickCreateButton();
});

When('user clicks Create button on Pipeline Builder page', () => {
  pipelineBuilderPage.clickCreateButton();
});

Then(
  'user will be redirected to Pipeline Details page with header name {string}',
  (pipelineName: string) => {
    pipelineDetailsPage.verifyTitle(pipelineName);
  },
);

When('user adds another task {string} in series', (taskName: string) => {
  pipelineBuilderPage.selectSeriesTask(taskName);
  pipelineBuilderPage.addResource('git resource');
  pipelineBuilderPage.clickOnTask(taskName);
  cy.get(pipelineBuilderPO.formView.sidePane.inputResource).click();
  cy.byTestDropDownMenu('git resource').click();
  pipelineBuilderPage.clickCreateButton();
});

When(
  'user adds {string} resource with name {string} to the {string}',
  (resourceType: string, resourceName: string) => {
    pipelineBuilderPage.addResource(resourceName, resourceType);
  },
);

When('user adds the parameter details like Name, Description and Default Value', () => {
  pipelineBuilderPage.addParameters('param-1', 'description', 'openshift/hello-openshift');
});

When('user adds the image name to the pipeline task {string}', (pipelineTaskName: string) => {
  pipelineBuilderPage.clickOnTask(pipelineTaskName);
  cy.get(pipelineBuilderPO.formView.sidePane.imageName).type('openshift/hello-openshift');
  sidePane.close();
});

When('user selects YAML view', () => {
  pipelineBuilderPage.clickYaml();
});

When('user clicks Create button on Pipeline Yaml page', () => {
  pipelineBuilderPage.clickCreateButton();
});

When('user clicks on Add parameter link', () => {
  cy.byButtonText('Add parameter').click();
});

When('user selects the {string} node', (taskName: string) => {
  pipelineBuilderPage.clickOnTask(taskName);
});

When('user adds the git url in the url Parameter in cluster task sidebar', () => {
  pipelineBuilderSidePane.enterParameterUrl();
});

When('user clicks on Add workspace', () => {
  cy.byButtonText('Add workspace').click();
});

When('user adds the Workspace name as {string}', (workspaceName: string) => {
  pipelineBuilderPage.addWorkspace(workspaceName);
});

When('user edits the Workspace name as {string}', (workspaceName: string) => {
  pipelineBuilderPage.addWorkspace(workspaceName);
});

When(
  'user selects the {string} workspace in the Output of Workspaces in cluster task sidebar',
  (workspaceName: string) => {
    pipelineBuilderSidePane.selectWorkspace(workspaceName);
  },
);

Then(
  'user will see workspace mentioned as {string} in the Workspaces section of Pipeline Details page',
  (workspaceName: string) => {
    cy.get(pipelineDetailsPO.details.fieldValues.workspace).should('contain.text', workspaceName);
  },
);

When('user clicks on Optional Workspace checkbox', () => {
  pipelineBuilderPage.selectOptionalWorkspace(true);
});

When('user enters pipeline name {string}', (pipelineName: string) => {
  pipelineBuilderPage.enterPipelineName(pipelineName);
});

And('user selects the first task as {string}', (task: string) => {
  pipelineBuilderPage.selectTask(task);
});

And('user clicks on Add finally task', () => {
  pipelineBuilderPage.addFinallyNode();
});

And('user selects the {string} task from finally task list', (finallyTask: string) => {
  cy.exec(
    `oc apply -f testData/pipelines-workspaces/pipeline-task-${finallyTask}.yaml -n ${Cypress.env(
      'NAMESPACE',
    )}`,
  );
  pipelineBuilderPage.selectFinallyTask(finallyTask);
});

And('user clicks on Add finally task again', () => {
  pipelineBuilderPage.addFinallyNode();
});

And('user selects {string} from finally task list', (finallyTask: string) => {
  pipelineBuilderPage.selectFinallyTask(finallyTask);
});

And('user clicks on Create', () => {
  pipelineBuilderPage.clickCreateButton();
  cy.url().should('include', 'Pipeline');
  pipelineDetailsPage.verifyPage();
});

And(
  'user is able to see finally tasks {string}, {string} and {string} mentioned under "Finally tasks" section in the Pipeline details page',
  (tkn: string, openshift: string, kn: string) => {
    cy.get(`[data-test="finally-task-node ${tkn}"]`).should('be.visible');
    cy.get(`[data-test="finally-task-node ${openshift}"]`).should('be.visible');
    cy.get(`[data-test="finally-task-node ${kn}"]`).should('be.visible');
  },
);

Given('user has chain of 3 tasks created in series', () => {
  cy.get(pipelineBuilderPO.yamlView.switchToYAMLView).click();
  cy.exec(
    `oc apply -f testData/pipelines-workspaces/sum-and-multiply-pipeline/task-sum.yaml -n ${Cypress.env(
      'NAMESPACE',
    )}`,
  );
  cy.exec(
    `oc apply -f testData/pipelines-workspaces/sum-and-multiply-pipeline/task-multiply.yaml -n ${Cypress.env(
      'NAMESPACE',
    )}`,
  );
  cy.fixture(`pipelines-workspaces/sum-and-multiply-pipeline/sum-and-multiply-pipeline.yaml`).then(
    (yaml) => {
      cy.get(pipelineBuilderPO.yamlCreatePipeline.yamlEditor)
        .click()
        .focused();
      yamlEditor.setEditorContent(yaml);
    },
  );
  cy.get(pipelineBuilderPO.formView.switchToFormView).click();
});

When('user clicks on third task', () => {
  cy.fixture(`pipelines-workspaces/sum-and-multiply-pipeline/sum-and-multiply-pipeline.yaml`).then(
    (yaml) => {
      const pipeline = safeYAMLToJS(yaml);
      pipelineBuilderPage.clickOnTask(pipeline.spec.tasks[2].name);
    },
  );
});

And('user navigates to When Expressions section', () => {
  cy.get(pipelineBuilderPO.formView.sidePane.addWhenExpression).scrollIntoView();
});

And('user clicks on Add When Expressions', () => {
  cy.get(pipelineBuilderPO.formView.sidePane.addWhenExpression).click();
});

Then('user can see a diamond shaped structure appear in front of third task', () => {
  cy.byTestID('diamond-decorator').should('be.visible');
});

And('user can see "Input", "Operator" and "Value" fields in When Expressions section', () => {
  cy.get(pipelineBuilderPO.formView.sidePane.whenExpression).within(() => {
    cy.get('[data-test="row formData.tasks.2.when.0"]').within(() => {
      cy.byTestID('input').should('be.visible');
      cy.byTestID('operator').should('be.visible');
      cy.get('[data-test~="values"]').should('be.visible');
    });
  });
});

And('user can see "Operator" has values "in" and "notin"', () => {
  cy.get('[data-test="row formData.tasks.2.when.0"] [data-test~="operator"]').click();
  cy.byTestDropDownMenu('in').should('be.visible');
  cy.byTestDropDownMenu('notin').should('be.visible');
});

And(
  'user can see "Add Value", "Add When Expressions" and "Remove When Expressions" options',
  () => {
    cy.get(pipelineBuilderPO.formView.sidePane.whenExpression).within(() => {
      cy.get('[data-test="row formData.tasks.2.when.0"]').within(() => {
        cy.get('[data-test="values"] [data-test="add-action"]').should('be.visible');
        cy.get('[data-test="add-action"]').should('be.visible');
        cy.get('[data-test="remove-when-expression"]').should('be.visible');
      });
    });
  },
);

And('user has named pipeline as {string}', (pipelineName: string) => {
  pipelineBuilderPage.enterPipelineName(pipelineName);
});

And('user has tasks {string} and {string} in series', (task1: string, task2: string) => {
  pipelineBuilderPage.selectTask(task1);
  pipelineBuilderPage.selectSeriesTask(task2);
});

And('user has a finally task as {string}', (finallyTask: string) => {
  pipelineBuilderPage.addFinallyNode();
  pipelineBuilderPage.selectFinallyTask(finallyTask);
  cy.get(`[data-test="finally-task-node ${finallyTask}"]`).as('finallyTask');
});

When('user clicks on finally task', () => {
  cy.get('@finallyTask').click({ force: true });
});

And('user navigates to When Expressions section', () => {
  cy.get(pipelineBuilderPO.formView.sidePane.addWhenExpression).scrollIntoView();
});

And('user clicks on Add When Expression', () => {
  cy.get(pipelineBuilderPO.formView.sidePane.addWhenExpression).click();
});

And('user enters the input value as {string}', (value: string) => {
  cy.get('[data-test="when-expression"] [data-test="row formData.finallyTasks.0.when.0"]').as(
    'whenExpression',
  );
  cy.get('@whenExpression').within(() => {
    cy.byTestID('input').type(value);
  });
});

And('user chooses the operator value {string} from the dropdown', (value: string) => {
  cy.get('@whenExpression').within(() => {
    cy.byTestID('operator').click();
    cy.byTestDropDownMenu(value).click();
  });
});

And('user enters the value as {string}', (value: string) => {
  cy.get('@whenExpression').within(() => {
    cy.get('[data-test~="value"]').type(value);
  });
});

And('user clicks Create button on Pipeline Builder page', () => {
  pipelineBuilderPage.clickCreateButton();
});

And(
  'user will see tooltip saying {string} while scrolling over diamond structure before conditional task',
  (value: string) => {
    pipelineDetailsPage.finallyNode().within(() => {
      cy.get('[data-test="diamond-decorator"]').click();
    });
    cy.get('[data-test="when-expression-tooltip"]').should('have.text', value);
  },
);

When('user selects {string} from Select task list', (task: string) => {
  pipelineBuilderPage.selectTask(task);
});

And('user enters pipeline name as {string}', (pipelineName: string) => {
  pipelineBuilderPage.enterPipelineName(pipelineName);
});

And('user clicks on Add Parameter', () => {
  cy.get('[data-test="pipeline-parameters"]').as('pipelineParameters');
  cy.get('@pipelineParameters').within(() => {
    cy.get('[data-test="add-action"]').click();
  });
});

And('user adds Name as {string}', (name: string) => {
  cy.get('@pipelineParameters')
    .get('[data-test="row formData.params.0"] [data-test="name"]')
    .type(name);
});

And('user Default value as {string}', (url: string) => {
  cy.get('@pipelineParameters')
    .get('[data-test="row formData.params.0"] [data-test="default"]')
    .type(url);
});

And('user clicks on Add Workspace and add name as {string}', (workspace: string) => {
  cy.get('[data-test="pipeline-workspaces"]').as('pipelineWorkspaces');
  cy.get('@pipelineWorkspaces').within(() => {
    cy.get('[data-test="add-action"]').click();
    cy.get('[data-test="row formData.workspaces.0"] [data-test="name"]').type(workspace);
  });
});

And('user clicks on {string} task node', (task: string) => {
  pipelineBuilderPage.clickOnTask(task);
});

And('user enters url under Parameters section {string}', (url: string) => {
  cy.get('[data-test="parameter url"] [data-test~="value"]').type(url);
});

And('user adds workspace as {string}', (workspace: string) => {
  cy.get('[data-test~="workspaces"]')
    .scrollIntoView()
    .select(workspace);
});

Given('user has applied yaml {string}', (yamlFile: string) => {
  cy.exec(
    `oc apply -f testData/pipelines-workspaces/using-optional-workspaces-in-when-expressions-pipelineRun/${yamlFile} -n ${Cypress.env(
      'NAMESPACE',
    )}`,
  );
});

And('user is at YAML view', () => {
  cy.get('[data-test="import-yaml"]').click();
  cy.get('.yaml-editor').should('be.visible');
});

When('user pastes the {string} code', (yamlFile: string) => {
  cy.fixture(
    `pipelines-workspaces/using-optional-workspaces-in-when-expressions-pipelineRun/${yamlFile}`,
  ).then((yaml) => {
    yamlEditor.setEditorContent(yaml);
  });
});

And('user clicks on Create button', () => {
  cy.get('[data-test="save-changes"]').click();
});

And('user clicks on Logs tab in PipelineRun details page', () => {
  pipelineRunDetailsPage.selectTab('Logs');
});

Then('user will be able to see the output in print-motd task', () => {
  cy.get(pipelineRunDetailsPO.logs.logPage).should('be.visible');
});

Given('user is at pipelines page', () => {
  navigateTo(devNavigationMenu.Pipelines);
});

When('user clicks on import YAML button', () => {
  cy.get('[data-test="import-yaml"]').click();
  cy.get('.yaml-editor').should('be.visible');
});

And('user enters yaml content from yaml file {string} in the editor', (yamlFile: string) => {
  cy.fixture(`pipelines-workspaces/${yamlFile}`).then((yaml) => {
    yamlEditor.setEditorContent(yaml);
  });
});

Then(
  'user will be able to see the TaskRun UID, PipelineRun UID, Task name, TaskRun name, Pipeline name, PipelineRun name',
  () => {
    cy.get(pipelineRunDetailsPO.logs.logPage).should('be.visible');
    cy.get(pipelineRunDetailsPO.logs.logPage).contains('TaskRun UID');
    cy.get(pipelineRunDetailsPO.logs.logPage).contains('PipelineRun UID');
    cy.get(pipelineRunDetailsPO.logs.logPage).contains('Task name');
    cy.get(pipelineRunDetailsPO.logs.logPage).contains('TaskRun name');
    cy.get(pipelineRunDetailsPO.logs.logPage).contains('Pipeline name');
    cy.get(pipelineRunDetailsPO.logs.logPage).contains('PipelineRun name');
  },
);

Given('user has imported YAML {string} and {string}', (task1: string, task2: string) => {
  cy.exec(
    `oc apply -f testData/pipelines-workspaces/sum-and-multiply-pipeline/${task1} -n ${Cypress.env(
      'NAMESPACE',
    )}`,
  );
  cy.exec(
    `oc apply -f testData/pipelines-workspaces/sum-and-multiply-pipeline/${task2} -n ${Cypress.env(
      'NAMESPACE',
    )}`,
  );
});

And('user is at YAML view of Pipeline Builder page', () => {
  navigateTo(devNavigationMenu.Pipelines);
  pipelinesPage.clickOnCreatePipeline();
  cy.get(pipelineBuilderPO.yamlView.switchToYAMLView).click();
});

When('user enters the yaml content from yaml file {string}', (yamlFile: string) => {
  cy.fixture(`pipelines-workspaces/sum-and-multiply-pipeline/${yamlFile}`).then((yaml) => {
    cy.get(pipelineBuilderPO.yamlCreatePipeline.yamlEditor)
      .click()
      .focused();
    yamlEditor.setEditorContent(yaml);
  });
});

And('user enters yaml content from yaml file {string}', (yamlFile: string) => {
  cy.fixture(`pipelines-workspaces/sum-and-multiply-pipeline/${yamlFile}`).then((yaml) => {
    yamlEditor.setEditorContent(yaml);
  });
});

Then('user will be able to see the output in sum and multipy task', () => {
  cy.get(pipelineRunDetailsPO.logs.logPage).should('be.visible');
});
