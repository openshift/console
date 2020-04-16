import * as _ from 'lodash';
import { execSync } from 'child_process';
import { browser, element, by, $, $$, ExpectedConditions as until } from 'protractor';
import {
  appHost,
  checkErrors,
  checkLogs,
  create,
  retry,
  testName,
} from '@console/internal-integration-tests/protractor.conf';
import * as crudView from '@console/internal-integration-tests/views/crud.view';
import * as operatorView from '../views/operator.view';
import { testCR, testCRD, testCSV } from '../mocks';
import {
  ARRAY_FIELD_GROUP_ID,
  atomicFields,
  FIELD_GROUP_ID,
  formFieldIsPresent,
  formGroups,
  getOperandFormField,
  getOperandFormFieldGroup,
  HIDDEN_FIELD_ID,
  LABELS_FIELD_ID,
  NAME_FIELD_ID,
} from '../views/descriptors.view';

describe('Using OLM descriptor components', () => {
  beforeAll(async () => {
    create(testCRD);
    create(testCSV);
    create(testCR);

    await browser.get(
      `${appHost}/ns/${testName}/clusterserviceversions/${testCSV.metadata.name}/${testCRD.spec.group}~${testCRD.spec.version}~${testCRD.spec.names.kind}`,
    );
    await crudView.isLoaded();
  });

  afterEach(() => {
    checkLogs();
    checkErrors();
  });

  afterAll(() => {
    execSync(`kubectl delete crd ${testCRD.metadata.name}`);
    execSync(`kubectl delete -n ${testName} clusterserviceversion ${testCSV.metadata.name}`);
  });

  it('displays list containing operands', async () => {
    await crudView.resourceRowsPresent();
    const isDisplayed = retry(() => operatorView.operandLink(testCR.metadata.name).isDisplayed());
    expect(isDisplayed).toBe(true);
  });

  it('displays detail view for operand', async () => {
    const {
      group,
      version,
      names: { kind },
    } = testCRD.spec;
    await browser.get(
      `${appHost}/ns/${testName}/clusterserviceversions/${testCSV.metadata.name}/${group}~${version}~${kind}/${testCR.metadata.name}`,
    );
    await crudView.isLoaded();

    expect(crudView.resourceTitle.getText()).toEqual(testCR.metadata.name);
  });

  testCSV.spec.customresourcedefinitions.owned[0].specDescriptors.forEach((descriptor) => {
    it(`displays spec descriptor for ${descriptor.displayName}`, async () => {
      const label = operatorView.descriptorLabel(descriptor);
      expect(label.isDisplayed()).toBe(true);
    });
  });

  testCSV.spec.customresourcedefinitions.owned[0].statusDescriptors
    // exclude Conditions since they are included in their own section
    .filter((descriptor) => descriptor.path !== 'conditions')
    .forEach((descriptor) => {
      it(`displays status descriptor for ${descriptor.displayName}`, async () => {
        const label = operatorView.descriptorLabel(descriptor);
        expect(label.isDisplayed()).toBe(true);
      });
    });

  // Delete operand instance created in proir steps. Fixes a failure when trying to create a
  // duplicate operand in the 'successfully creates operand using form' step.
  // TODO Test cases need to be fixed so that they will pass independently. They should
  // be self-contained and not depend on state from previous steps.
  it('deletes operand', async () => {
    await browser.get(
      `${appHost}/ns/${testName}/clusterserviceversions/${testCSV.metadata.name}/${testCRD.spec.group}~${testCRD.spec.version}~${testCRD.spec.names.kind}`,
    );
    await crudView.isLoaded();
    await crudView.resourceRowsPresent();
    await retry(() => crudView.deleteRow(testCR.kind)(testCR.metadata.name));
  });

  it('displays form for creating operand', async () => {
    await $$('[data-test-id=breadcrumb-link-1]').click();
    await browser.wait(until.visibilityOf(element(by.buttonText('Create App'))));
    await retry(() => element(by.buttonText('Create App')).click());
    await formFieldIsPresent(NAME_FIELD_ID);
    expect(formGroups.count()).not.toEqual(0);
  });

  // TODO implement tests for more descriptor based form fields and widgets as well as data syncing.
  atomicFields.forEach(({ label, id, path }) => {
    it(`pre-populates ${label} field`, async () => {
      const field = getOperandFormField(id);
      await field.element.isPresent();
      expect(field.label.getText()).toEqual(label);
      expect(field.input.getAttribute('value')).toEqual(_.get(testCR, path).toString());
    });
  });

  it('pre-populates Labels field', async () => {
    const field = getOperandFormField(LABELS_FIELD_ID);
    await field.element.isPresent();
    expect(field.label.getText()).toEqual('Labels');
    expect(field.element.element(by.css('.tag-item__content')).getText()).toEqual(
      `automatedTestName=${testName}`,
    );
  });

  it('pre-populates Field Group', async () => {
    const fieldGroup = getOperandFormFieldGroup(FIELD_GROUP_ID);
    const item1 = getOperandFormField(`${FIELD_GROUP_ID}_itemOne`);
    const item2 = getOperandFormField(`${FIELD_GROUP_ID}_itemTwo`);
    await browser.wait(until.presenceOf(fieldGroup.toggleButton));
    expect(fieldGroup.label.getText()).toEqual('Field Group');
    await fieldGroup.toggleButton.click();
    await browser.wait(until.and(until.presenceOf(item1.element), until.presenceOf(item2.element)));
    expect(item1.label.getText()).toEqual('Item One');
    expect(item1.input.getAttribute('value')).toEqual(testCR.spec.fieldGroup.itemOne);
    expect(item2.label.getText()).toEqual('Item Two');
    expect(item2.input.getAttribute('value')).toEqual(testCR.spec.fieldGroup.itemTwo.toString());
  });

  it('pre-populates Array Field Group', async () => {
    const fieldGroup = getOperandFormFieldGroup(ARRAY_FIELD_GROUP_ID);
    const item1 = getOperandFormField(`${ARRAY_FIELD_GROUP_ID}_0_itemOne`);
    const item2 = getOperandFormField(`${ARRAY_FIELD_GROUP_ID}_0_itemTwo`);
    await browser.wait(
      until.and(until.presenceOf(fieldGroup.label), until.presenceOf(fieldGroup.toggleButton)),
    );
    expect(fieldGroup.label.getText()).toEqual('Array Field Group');
    await fieldGroup.toggleButton.click();
    await browser.wait(until.and(until.presenceOf(item1.element), until.presenceOf(item2.element)));
    expect(item1.label.getText()).toEqual('Item One');
    expect(item1.input.getAttribute('value')).toEqual(testCR.spec.arrayFieldGroup[0].itemOne);
    expect(item2.label.getText()).toEqual('Item Two');
    expect(item2.input.getAttribute('value')).toEqual(
      testCR.spec.arrayFieldGroup[0].itemTwo.toString(),
    );
  });

  it('does not render hidden field group', () => {
    const hiddenFieldGroup = getOperandFormFieldGroup(HIDDEN_FIELD_ID);
    expect(hiddenFieldGroup.element.isPresent()).toBeFalsy();
  });

  // Disabled until client side validation is implemented for new create operand form
  xit('prevents creation and displays validation errors for required or non-empty fields', async () => {
    await element(by.id('root_number')).sendKeys('4000');
    await element(by.buttonText('Create')).click();

    expect($('.co-error').getText()).toContain('Must be less than 4');
    expect($('.pf-c-alert').isPresent()).toBe(true);

    await element(by.id('spec.password')).sendKeys('!@#$%^&*()');
    await element(by.buttonText('Create')).click();

    expect(
      $$('.co-error')
        .last()
        .getText(),
    ).toContain('Does not match required pattern');
    expect($('.pf-c-alert').isPresent()).toBe(true);
  });

  it('successfully creates operand using form', async () => {
    await browser.refresh();
    await formFieldIsPresent(NAME_FIELD_ID);
    await element(by.buttonText('Create')).click();
    await crudView.isLoaded();
    await browser.wait(until.elementToBeClickable(operatorView.operandLink(testCR.metadata.name)));
    await retry(() => operatorView.operandLink(testCR.metadata.name).click());
    await browser.wait(until.presenceOf($('.loading-box__loaded')), 5000);
    expect($('.co-operand-details__section--info').isDisplayed()).toBe(true);
  });
});
