import * as _ from 'lodash';
import { checkErrors, create, testName } from '../../../integration-tests-cypress/support';
import { testCR, testCRD, testCSV } from '../mocks';

describe('Using OLM descriptor components', () => {
  before(() => {
    cy.createProjectWithCLI(testName);
    create(testCRD);
    create(testCSV);
  });

  beforeEach(() => {
    cy.login();
    cy.initAdmin();
  });

  afterEach(() => {
    cy.visit('/');
    cy.exec(`oc delete ${testCRD.spec.names.kind} ${testCR.metadata.name} -n ${testName}`);
    checkErrors();
  });

  after(() => {
    cy.exec(`oc delete crd ${testCRD.metadata.name}`);
    cy.exec(`oc delete -n ${testName} clusterserviceversion ${testCSV.metadata.name}`);
    cy.deleteProjectWithCLI(testName);
  });

  const ARRAY_FIELD_GROUP_ID = 'root_spec_arrayFieldGroup';
  const FIELD_GROUP_ID = 'root_spec_fieldGroup';
  const LABELS_FIELD_ID = 'root_metadata_labels';
  const NAME_FIELD_ID = 'root_metadata_name';
  const NUMBER_FIELD_ID = 'root_spec_number';
  const PASSWORD_FIELD_ID = 'root_spec_password';
  const SELECT_FIELD_ID = 'root_spec_select';
  const atomicFields = [
    {
      label: 'Name',
      path: 'metadata.name',
      id: NAME_FIELD_ID,
    },
    {
      label: 'Password',
      path: 'spec.password',
      id: PASSWORD_FIELD_ID,
    },
    {
      label: 'Number',
      path: 'spec.number',
      id: NUMBER_FIELD_ID,
    },
  ];
  const getOperandFormFieldElement = (id) => cy.get(`#${id}_field`);
  const getOperandFormFieldLabel = (id) => cy.get(`[for=${id}]`);
  const getOperandFormFieldInput = (id) => cy.get(`#${id}`);

  const {
    group,
    names: { kind },
  } = testCRD.spec;
  const version = testCRD.spec.versions[0].name;
  const URL = `/k8s/ns/${testName}/operators.coreos.com~v1alpha1~ClusterServiceVersion/${testCSV.metadata.name}/${group}~${version}~${kind}`;

  it('displays list and detail views of an operand', () => {
    create(testCR);
    cy.visit(URL);
    cy.byTestOperandLink('olm-descriptors-test').should('exist');
    cy.visit(`${URL}/${testCR.metadata.name}`);
    cy.byLegacyTestID('resource-title').should('have.text', `${testCR.metadata.name}`);
    testCSV.spec.customresourcedefinitions.owned[0].specDescriptors.forEach((descriptor) => {
      if (descriptor.path === 'hidden') {
        cy.byTestSelector(`details-item-label__${descriptor.displayName}`).should('not.exist');
      } else {
        cy.byTestSelector(`details-item-label__${descriptor.displayName}`).should('exist');
      }
    });
    testCSV.spec.customresourcedefinitions.owned[0].statusDescriptors
      // exclude Conditions since they are included in their own section
      .filter((descriptor) => descriptor.path !== 'conditions')
      .forEach((descriptor) => {
        if (descriptor.path === 'hidden') {
          cy.byTestSelector(`details-item-label__${descriptor.displayName}`).should('not.exist');
        } else {
          cy.byTestSelector(`details-item-label__${descriptor.displayName}`).should('exist');
        }
      });
  });

  it('creates an operand using the form', () => {
    cy.visit(URL);
    // TODO figure out why this element is detaching
    cy.byTestID('item-create').click({ force: true });
    cy.get('[data-test="page-heading"] h1').should('have.text', 'Create App');
    // TODO: implement tests for more descriptor-based form fields and widgets as well as data syncing.
    atomicFields.forEach(({ label, id, path }) => {
      getOperandFormFieldElement(id).should('exist');
      getOperandFormFieldLabel(id).should('have.text', label);
      getOperandFormFieldInput(id).should('have.value', _.get(testCR, path).toString());
    });
    getOperandFormFieldElement(SELECT_FIELD_ID).should('exist');
    getOperandFormFieldLabel(SELECT_FIELD_ID).should('have.text', 'Select');
    cy.get(`#${SELECT_FIELD_ID}`).should('have.text', testCR?.spec?.select.toString());
    getOperandFormFieldElement(LABELS_FIELD_ID).should('exist');
    getOperandFormFieldLabel(LABELS_FIELD_ID).should('have.text', 'Labels');
    cy.get(`#${LABELS_FIELD_ID}_field .tag-item-content`).should(
      'have.text',
      `automatedTestName=${testName}`,
    );
    cy.get(`#${FIELD_GROUP_ID}_field-group`).should('exist');
    cy.get(`#${FIELD_GROUP_ID}_accordion-toggle`).click();
    cy.get(`[for="${FIELD_GROUP_ID}_itemOne"]`).should('have.text', 'itemOne');
    cy.get(`#${FIELD_GROUP_ID}_itemOne`).should('have.value', testCR.spec.fieldGroup.itemOne);
    cy.get(`[for="${FIELD_GROUP_ID}_itemTwo"]`).should('have.text', 'itemTwo');
    cy.get(`#${FIELD_GROUP_ID}_itemTwo`).should('have.value', testCR.spec.fieldGroup.itemTwo);
    cy.get(`#${ARRAY_FIELD_GROUP_ID}_field-group`).should('exist');
    cy.get(`#${ARRAY_FIELD_GROUP_ID}_accordion-toggle`).click();
    cy.get(`[for="${ARRAY_FIELD_GROUP_ID}_0_itemOne"]`).should('have.text', 'Item One');
    cy.get(`#${ARRAY_FIELD_GROUP_ID}_0_itemOne`).should(
      'have.value',
      testCR.spec.arrayFieldGroup[0].itemOne,
    );
    cy.get(`[for="${ARRAY_FIELD_GROUP_ID}_0_itemTwo"]`).should('have.text', 'Item Two');
    cy.get(`#${ARRAY_FIELD_GROUP_ID}_0_itemTwo`).should(
      'have.value',
      testCR.spec.arrayFieldGroup[0].itemTwo,
    );
    cy.get('#root_spec_hiddenFieldGroup_field-group').should('not.exist');
    cy.get('#root_metadata_name').clear().type(testCR.metadata.name);
    cy.byTestID('create-dynamic-form').click();
    // TODO figure out why this element is detaching
    cy.byTestOperandLink(testCR.metadata.name).click({ force: true });
    cy.get('.co-operand-details__section--info').should('exist');
  });
});
