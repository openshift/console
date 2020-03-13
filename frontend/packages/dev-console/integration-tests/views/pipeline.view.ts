import { browser, ExpectedConditions as until, by, element, $ } from 'protractor';

export const pageSidebar = element(by.id('page-sidebar'));
export const pipelineTab = element(by.css('[data-test-id="pipeline-header"]'));
export const pipelinePage = element(by.css('[data-test-id="resource-title"]'));
export const selectTask = element(by.className('odc-task-list-node__trigger'));
export const selectBuildah = element(by.css('[data-test-action="openshift-client"]'));
export const createPipeline = element(by.css('[data-test-id="import-git-create-button"]'));
export const createPipelineYaml = element(by.id('yaml-create'));
export const createPipelineYamlError = $('.pf-c-alert.pf-m-danger');
export const pipelineTable = element(
  by.className('ReactVirtualized__VirtualGrid ReactVirtualized__List'),
);
export const pipelineTableBody = element(
  by.className('ReactVirtualized__VirtualGrid__innerScrollContainer'),
);
export const pipelineTableBodyElement = (testname, pipelinename) =>
  element(by.css(`[data-test-id="${testname}-${pipelinename}"]`));
export const samplePipelineElement = element(by.css('[data-test-id="sample-app-pipeline"]'));
export const pipelineGraph = element(by.css('[data-test-id="topology"]'));
export const pipelineOverviewName = element(by.css('[data-test-id="resource-title"]'));
export const pipelineFilter = element(by.css('[data-test-id="item-filter"]'));
export const pipelineStartKebab = element(by.css('[data-test-id="kebab-button"]'));
export const pipelineActions = element(by.css('[data-test-id="action-items"]'));

export const pipelineStart = element(by.css('[data-test-action="Start"]'));
export const pipelineRunStartLoaded = () =>
  browser.wait(until.elementToBeClickable(pipelineStart), 1000).then(() => browser.sleep(5000));

export const pipelineDelete = element(by.css('[data-test-action="Delete Pipeline"]'));

export const pipelineRunOverview = element(by.cssContainingText('h2', 'Pipeline Run Details'));
export const pipelineRun = element(by.css('[data-test-id="horizontal-link-Pipeline Runs"]'));
export const pipelines = (runName) => element(by.css(`[data-test-id="${runName}"]`));
export const pipelineRuns = element(by.css('[data-test-id="breadcrumb-link-0"]'));
export const pipelineSelect = (name) => element(by.css(`[data-test-id="${name}"]`));
export const pipelineRerun = element(by.cssContainingText('button', 'Rerun'));
export const pipelineActionList = element(by.css('[data-test-id="actions-menu-button"]'));
export const pipelineStartLastRun = element(by.cssContainingText('button', 'Start Last Run'));
export const pipelineRunLogs = element(by.css('[data-test-id="horizontal-link-Logs"]'));
export const pipelineYaml = element(by.css('[data-test-id="horizontal-link-YAML"]'));
export const pipelineRunLogList = element(by.css('[data-test-id="logs-tasklist"]'));
export const pipelineRunLogContainer = element(by.css('[data-test-id="logs-task-container"]'));

export const pipelineScriptRunner = async function() {
  await browser.wait(until.presenceOf(createPipelineYaml));
  await createPipelineYaml.click();
  await browser.wait(until.presenceOf(selectTask));
  await selectTask.click();
  await browser.wait(until.visibilityOf(selectBuildah));
  await selectBuildah.click();
  await browser.wait(until.elementToBeClickable(createPipeline));
  await createPipeline.click();
  await browser.wait(until.visibilityOf(pipelineGraph));
};

export const pipelinecheckStatus = async function() {
  await pipelineTab.click();
  await browser.wait(until.textToBePresentInElement(pipelinePage, 'Pipelines'));
};
