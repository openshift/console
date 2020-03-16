import { execSync } from 'child_process';
import { browser, element, by, $, $$, ExpectedConditions as until } from 'protractor';
import { safeDump } from 'js-yaml';
import { startCase, get, find, isUndefined } from 'lodash';
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
import { inputValueFor } from '../views/descriptors.view';

describe('Using OLM descriptor components', () => {
  beforeAll(async () => {
    /* eslint-disable no-console */
    console.log('\nUsing ClusterServiceVersion:');
    console.log(safeDump(testCSV));
    console.log('\nUsing custom resource:');
    console.log(safeDump(testCR));
    /* eslint-enable no-console */

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
    expect(operatorView.operandLink(testCR.metadata.name).isDisplayed()).toBe(true);
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
    await crudView.deleteRow(testCR.kind)(testCR.metadata.name);
  });

  it('displays form for creating operand', async () => {
    await $$('[data-test-id=breadcrumb-link-1]').click();
    await browser.wait(until.visibilityOf(element(by.buttonText('Create App'))));
    await retry(() => element(by.buttonText('Create App')).click());
    await browser.wait(until.presenceOf($('#metadata\\.name')));
    expect($$('.co-create-operand__form-group').count()).not.toEqual(0);
  });

  it('pre-populates form values using sample operand from ClusterServiceVersion', async () => {
    $$('.pf-c-accordion__toggle').each(async (toggleBtn) => {
      const toggleBtnClasses = await toggleBtn.getAttribute('class');
      if (!toggleBtnClasses.includes('pf-m-expanded')) {
        await toggleBtn.click();
      }
    });
    $$('.co-create-operand__form-group').each(async (input) => {
      await browser
        .actions()
        .mouseMove(input)
        .perform();

      const label = await input.$('.form-label').getText();
      const descriptor = testCSV.spec.customresourcedefinitions.owned[0].specDescriptors.find(
        (d) => d.displayName === label,
      );
      if (isUndefined(descriptor)) {
        const hasProperty = (properties) =>
          find(properties, (_, nestedKey) => startCase(nestedKey) === label);
        expect(
          find(
            testCRD.spec.validation.openAPIV3Schema.properties.spec.properties as any,
            (p, k) => startCase(k) === label || hasProperty(p.properties),
          ),
        ).toBeDefined();
      } else {
        const helpText = await input
          .$$('.help-block')
          .last()
          .getText();
        expect(descriptor).toBeDefined();
        expect(label).toEqual(descriptor.displayName);
        expect(helpText).toEqual(descriptor.description);

        if ((await inputValueFor(descriptor['x-descriptors'][0])(input)) !== null) {
          const value = await inputValueFor(descriptor['x-descriptors'][0])(input);
          expect(value).toEqual(get(testCR, ['spec', descriptor.path]));
        }
      }
    });
  });

  it('renders groups of fields together from specDescriptors', async () => {
    expect(element(by.id('specDescriptorFieldGroup')).isDisplayed()).toBe(true);
  });

  it('renders groups of fields together from nested properties in OpenAPI schema', async () => {
    expect(element(by.id('fieldGroup')).isDisplayed()).toBe(true);
    expect(element(by.id('hiddenFieldGroup')).isPresent()).toBe(false);
  });

  it('prevents creation and displays validation errors for required or non-empty fields', async () => {
    await element(by.id('spec.number')).sendKeys('4000');
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
    await browser.wait(until.presenceOf($('#metadata\\.name')));
    await element(by.buttonText('Create')).click();
    await crudView.isLoaded();
    await browser.wait(until.elementToBeClickable(operatorView.operandLink(testCR.metadata.name)));
    await operatorView.operandLink(testCR.metadata.name).click();
    await browser.wait(until.presenceOf($('.loading-box__loaded')), 5000);

    expect($('.co-operand-details__section--info').isDisplayed()).toBe(true);
  });
});
