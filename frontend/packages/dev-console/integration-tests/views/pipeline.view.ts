import { browser, ExpectedConditions as until, by, element, $ } from 'protractor';

export const pageSidebar = element(by.id('page-sidebar'));
export const pipelineTab = element(by.css('[data-test-id="pipeline-header"]'));
export const pipelinePage = element(by.css('[data-test-id="resource-title"]'));
export const createPipelineYaml = element(by.id('yaml-create'));
export const yamlPipeline = element(by.className('lines-content monaco-editor-background'));
export const saveChangesYamlPipeline = element(by.id('save-changes'));
export const createPipelineYamlError = $('.pf-c-alert.pf-m-danger');
export const pipelineTable = element(
  by.className('ReactVirtualized__VirtualGrid ReactVirtualized__List'),
);
export const pipelineTableBody = element(
  by.className('ReactVirtualized__VirtualGrid__innerScrollContainer'),
);
export const pipelineGraph = $('.odc-pipeline-vis-graph__stages');
export const pipelineOverviewName = element(by.css('[data-test-id="resource-title"]'));

export const pipelineScriptRunner = async function() {
  await browser.wait(until.presenceOf(createPipelineYaml));
  await createPipelineYaml.click();
  await browser.wait(until.presenceOf(saveChangesYamlPipeline));
  await saveChangesYamlPipeline.click();
  await browser.wait(until.visibilityOf(pipelineGraph), 5000);
};

export const pipelinecheckStatus = async function() {
  await pipelineTab.click();
  await browser.wait(until.textToBePresentInElement(pipelinePage, 'Pipelines'));
};
