import { browser, ExpectedConditions as until } from 'protractor';
import { safeLoad, safeDump } from 'js-yaml';
import * as _ from 'lodash';

import { appHost, testName, checkLogs, checkErrors, retry } from '../protractor.conf';
import * as crudView from '../views/crud.view';
import * as modalAnnotationsView from '../views/modal-annotations.view';
import * as yamlView from '../views/yaml.view';

const BROWSER_TIMEOUT = 15000;
const CONFIG_MAP_NAME = `modal-${testName}`;
const Actions = {
  add: 'add',
  update: 'update',
  delete: 'delete',
};

describe('Modal Annotations', () => {
  beforeAll(async () => {
    await browser.get(`${appHost}/k8s/ns/${testName}/configmaps`);
    await crudView.isLoaded();
    await crudView.createYAMLButton.click();
    await yamlView.isLoaded();
    const content = await yamlView.getEditorContent();
    const newContent = _.defaultsDeep(
      {},
      {
        metadata: {
          name: CONFIG_MAP_NAME,
          labels: { test: testName },
          annotations: { test: testName },
        },
      },
      safeLoad(content),
    );
    await yamlView.setEditorContent(safeDump(newContent));
    await crudView.saveChangesBtn.click();
    // Wait until the resource is created and the details page loads before continuing.
    await browser.wait(until.presenceOf(crudView.resourceTitle));
    checkLogs();
    checkErrors();
  });

  afterEach(() => {
    checkLogs();
    checkErrors();
  });

  afterAll(async () => {
    await browser.get(`${appHost}/k8s/ns/${testName}/configmaps`);
    await crudView.resourceRowsPresent();
    await crudView.textFilter.sendKeys(CONFIG_MAP_NAME);
    await crudView.deleteRow('ConfigMap')(CONFIG_MAP_NAME);
    checkLogs();
    checkErrors();
  });

  const validateKeyAndValue = async function(
    annotationKey: string,
    annotationValue: string,
    isPresent: boolean,
  ) {
    let keyFound = 0;

    await browser.wait(until.presenceOf(modalAnnotationsView.annotationRowsKey.first()));
    await modalAnnotationsView.annotationRowsKey.each(async function(item, index) {
      const annKey = await item.getAttribute('value');
      if (annKey === annotationKey) {
        keyFound = keyFound + 1;
        expect(
          retry(() => modalAnnotationsView.annotationRowsValue.get(index).getAttribute('value')),
        ).toBe(annotationValue);
      }
    });

    if (isPresent) {
      expect(keyFound).toEqual(1);
    } else {
      expect(keyFound).toEqual(0);
    }
  };

  const clickModalAnnotationsLink = async function() {
    await browser.wait(until.elementToBeClickable(crudView.modalAnnotationsLink));
    // Make sure no dialog overlay is blocking the link from being clicked.
    await browser.wait(until.invisibilityOf(modalAnnotationsView.annotationDialogOverlay));
    await crudView.modalAnnotationsLink.click();
  };

  const crudAnnotationFromDetail = async function(
    action: string,
    annotationKey: string,
    annotationValue: string,
  ) {
    await browser.get(`${appHost}/k8s/ns/${testName}/configmaps/${CONFIG_MAP_NAME}`);
    await clickModalAnnotationsLink();
    await modalAnnotationsView.isLoaded();

    switch (action) {
      case Actions.add: {
        await modalAnnotationsView.addAnnotation(annotationKey, annotationValue);
        break;
      }
      case Actions.update: {
        await modalAnnotationsView.updateAnnotation(annotationKey, annotationValue);
        break;
      }
      case Actions.delete: {
        await modalAnnotationsView.deleteAnnotation(annotationKey);
        break;
      }
      default: {
        throw new Error(`Invalid action [${action}]`);
      }
    }

    await modalAnnotationsView.isLoaded();
    await modalAnnotationsView.confirmActionBtn.click();
    await crudView.isLoaded();
  };

  const crudAndValidate = async function(
    action: string,
    annotationKey: string,
    annotationValue: string,
    isPresent: boolean,
  ) {
    await crudAnnotationFromDetail(action, annotationKey, annotationValue);
    await browser.get(`${appHost}/k8s/ns/${testName}/configmaps/${CONFIG_MAP_NAME}`);
    await clickModalAnnotationsLink();
    await modalAnnotationsView.isLoaded();
    await validateKeyAndValue(annotationKey, annotationValue, isPresent);
  };

  // Given I log in into the console if it's required
  //   And I create a deployment
  //   And I open modal annotations from gear option
  //   And I add an annotation
  //   And I open modal annotations from gear option
  //  When I delete the annotation
  //  Then I expect that the annotation is not displayed
  //   And I expect to see that the YAML should not contain the annotation
  it('Delete Annotation', async () => {
    const annotationKey = 'KEY_del3t3';
    const annotationValue = 'delete';

    await crudAnnotationFromDetail(Actions.add, annotationKey, annotationValue);
    await browser.get(`${appHost}/k8s/ns/${testName}/configmaps/${CONFIG_MAP_NAME}`);
    await browser.wait(
      until.textToBePresentInElement(crudView.modalAnnotationsLink, '2'),
      BROWSER_TIMEOUT,
    );
    await clickModalAnnotationsLink();
    await modalAnnotationsView.isLoaded();
    await validateKeyAndValue(annotationKey, annotationValue, true);

    await crudAnnotationFromDetail(Actions.delete, annotationKey, annotationValue);
    await browser.get(`${appHost}/k8s/ns/${testName}/configmaps/${CONFIG_MAP_NAME}`);
    await browser.wait(
      until.textToBePresentInElement(crudView.modalAnnotationsLink, '1'),
      BROWSER_TIMEOUT,
    );
    await clickModalAnnotationsLink();
    await modalAnnotationsView.isLoaded();
    await validateKeyAndValue(annotationKey, annotationValue, false);
  });

  // Scenario: Add numeric Annotation from grid
  // Given I log in into the console if it's required
  //   And I create a deployment
  //   And I go to the configmaps list page
  //   And I open modal annotations from gear option
  //  When I add an annotation
  //   And I close the modal
  //   And I open modal annotations from gear option
  //  Then I expect to see the annotation created
  //   And I expect to see that the YAML should contain the annotation value with simple quotes
  it('Add numeric Annotation from grid', async () => {
    const annotationKey = 'NUM_KEY_FROM_GRID';
    const annotationValue = '2233344';
    const annotationYAML = `${annotationKey}: '${annotationValue}'`;

    await browser.get(`${appHost}/k8s/ns/${testName}/configmaps`);
    await crudView.isLoaded();
    await crudView.clickKebabAction(CONFIG_MAP_NAME, crudView.actions.annotations);
    await modalAnnotationsView.isLoaded();
    await modalAnnotationsView.addAnnotation(annotationKey, annotationValue);
    await modalAnnotationsView.isLoaded();
    await modalAnnotationsView.confirmActionBtn.click();
    await browser.get(`${appHost}/k8s/ns/${testName}/configmaps`);
    await crudView.isLoaded();
    await crudView.clickKebabAction(CONFIG_MAP_NAME, crudView.actions.annotations);
    await modalAnnotationsView.isLoaded();
    await validateKeyAndValue(annotationKey, annotationValue, true);
    await browser.get(`${appHost}/k8s/ns/${testName}/configmaps/${CONFIG_MAP_NAME}/yaml`);
    await yamlView.isLoaded();
    expect(yamlView.getEditorContent()).toContain(annotationYAML);
  });

  // Scenario: Add alphanumeric Annotation from object detail
  // Given I log in into the console if it's required
  //   And I create a deployment
  //   And I open the deployment detail
  //   And I open modal annotations
  //  When I add an annotation
  //   And I close the modal
  //   And I open modal annotations
  //  Then I expect to see the annotation created
  //   And I expect to see that the YAML should contain the annotation value without simple quotes
  it('Add alphanumeric Annotation from object detail', async () => {
    const annotationKey = 'ALPHA_Num_KEY_FROM_detail-12333';
    const annotationValue = 'from_dEtaIL-2';
    const annotationYAML = `${annotationKey}: ${annotationValue}`;

    await crudAndValidate(Actions.add, annotationKey, annotationValue, true);

    await browser.get(`${appHost}/k8s/ns/${testName}/configmaps/${CONFIG_MAP_NAME}/yaml`);
    await yamlView.isLoaded();
    expect(yamlView.getEditorContent()).toContain(annotationYAML);
  });

  // Scenario: Add Annotation without value
  // Given I log in into the console if it's required
  //   And I create a deployment
  //   And I open the deployment detail
  //   And I open modal annotations
  //  When I add an annotation without value
  //  Then I expect to see the annotation created without value
  //   And I expect to see that the YAML should contain an empty string ('') as annotation value
  it('Add Annotation without value', async () => {
    const annotationKey = 'KEY_without_v4lu3';
    const annotationValue = '';
    const annotationYAML = `${annotationKey}: ''`;

    await crudAndValidate(Actions.add, annotationKey, annotationValue, true);

    await browser.get(`${appHost}/k8s/ns/${testName}/configmaps/${CONFIG_MAP_NAME}/yaml`);
    await yamlView.isLoaded();
    expect(yamlView.getEditorContent()).toContain(annotationYAML);
  });

  // Scenario: Add annotation wihout key
  // Given I log in into the console if it's required
  //   And I create a deployment
  //   And I open the deployment detail
  //   And I open modal annotations
  //  When I add an annotation without key
  //   And I close the modal
  //  Then I expect that the annotation is not displayed
  it('Add annotation wihout key', async () => {
    const annotationKey = '';
    const annotationValue = 'value_no_key';

    await crudAndValidate(Actions.add, annotationKey, annotationValue, false);
  });

  // Scenario: Update Annotation from value to empty value
  // Given I log in into the console if it's required
  //   And I create a deployment
  //   And I open the deployment detail
  //   And I open modal annotations
  //  When I add an annotation
  //   And I update this annotation to empty value
  //  Then I expect to see the annotation created without value
  //   And I expect to see that the YAML should contain an empty string ('') as annotation value
  xit('Update Annotation from value to empty value: CONSOLE-394', async () => {
    const annotationKey = 'KEY_UPDATE_FROM_VALUE_TO_EMPTY';
    const annotationValueBeforeUpd = 'new_value_not_empty-1';
    const annotationValueAfterUpd = '';

    await crudAndValidate(Actions.add, annotationKey, annotationValueBeforeUpd, true);
    await crudAndValidate(Actions.update, annotationKey, annotationValueAfterUpd, true);
  });

  //   And I create a deployment
  //   And I open modal annotations from gear option
  //   And I add an annotation without value
  //   And I open modal annotations from gear option
  //  When I update this annotation
  //  Then I expect to see the annotation
  it('Update Annotation from empty value to value', async () => {
    const annotationKey = 'KEY_UPDATE_TO_EMPTY';
    const annotationValueBeforeUpd = '';
    const annotationValueAfterUpd = 'new_value_not_empty-2';
    const annotationYAML = `${annotationKey}: ${annotationValueAfterUpd}`;

    await crudAndValidate(Actions.add, annotationKey, annotationValueBeforeUpd, true);
    await crudAndValidate(Actions.update, annotationKey, annotationValueAfterUpd, true);

    await browser.get(`${appHost}/k8s/ns/${testName}/configmaps/${CONFIG_MAP_NAME}/yaml`);
    await yamlView.isLoaded();
    expect(yamlView.getEditorContent()).toContain(annotationYAML);
  });

  // Scenario: Cancel add Annotation
  // Given I log in into the console if it's required
  //   And I create a deployment
  //   And I go to the configmaps list page
  //   And I open modal annotations from gear option
  //  When I add an annotation
  //   And I cancel the action
  //   And I open modal annotations from gear option
  //  Then I expect that the annotation is not displayed
  it('Cancel add Annotation', async () => {
    const annotationKey = 'KEY_Cancel';
    const annotationValue = 'cancel';

    await browser.get(`${appHost}/k8s/ns/${testName}/configmaps`);
    await crudView.isLoaded();
    await crudView.clickKebabAction(CONFIG_MAP_NAME, crudView.actions.annotations);
    await modalAnnotationsView.isLoaded();
    await modalAnnotationsView.addAnnotation(annotationKey, annotationValue);
    await modalAnnotationsView.isLoaded();
    await modalAnnotationsView.cancelBtn.click();
    await crudView.isLoaded();
    await crudView.clickKebabAction(CONFIG_MAP_NAME, crudView.actions.annotations);
    await modalAnnotationsView.isLoaded();
    await validateKeyAndValue(annotationKey, annotationValue, false);
  });
});
