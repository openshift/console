import * as _ from 'lodash';
import { nav } from '../../../integration-tests-cypress/views/nav';
import { checkErrors, create, testName } from '../../../integration-tests-cypress/support';
import { modal } from '../../../integration-tests-cypress/views/modal';
import { testCR, testCRD, testCSV } from '../mocks';

describe('Using OLM descriptor components', () => {
  before(() => {
    cy.login();
    cy.visit('/');
    nav.sidenav.switcher.changePerspectiveTo('Administrator');
    nav.sidenav.switcher.shouldHaveText('Administrator');
    cy.createProject(testName);
    create(testCRD);
    create(testCSV);
    create(testCR);
  });

  afterEach(() => {
    checkErrors();
  });

  after(() => {
    cy.exec(`kubectl delete crd ${testCRD.metadata.name}`);
    cy.exec(`kubectl delete -n ${testName} clusterserviceversion ${testCSV.metadata.name}`);
    cy.logout();
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

  it('displays list containing operands', () => {
    cy.visit(
      `/k8s/ns/${testName}/operators.coreos.com~v1alpha1~ClusterServiceVersion/${testCSV.metadata.name}/${testCRD.spec.group}~${testCRD.spec.versions[0].name}~${testCRD.spec.names.kind}`,
    );
    cy.byTestOperandLink('olm-descriptors-test').should('exist');
  });

  it('displays detail view for operand', () => {
    const {
      group,
      names: { kind },
    } = testCRD.spec;
    const version = testCRD.spec.versions[0].name;
    cy.visit(
      `/k8s/ns/${testName}/operators.coreos.com~v1alpha1~ClusterServiceVersion/${testCSV.metadata.name}/${group}~${version}~${kind}/${testCR.metadata.name}`,
    );
    cy.byLegacyTestID('resource-title').should('have.text', `${testCR.metadata.name}`);
  });

  testCSV.spec.customresourcedefinitions.owned[0].specDescriptors.forEach((descriptor) => {
    if (descriptor.path === 'hidden') {
      it(`does not display spec descriptor for ${descriptor.displayName}`, () => {
        cy.byTestSelector(`details-item-label__${descriptor.displayName}`).should('not.exist');
      });
    } else {
      it(`displays spec descriptor for ${descriptor.displayName}`, () => {
        cy.byTestSelector(`details-item-label__${descriptor.displayName}`).should('exist');
      });
    }
  });

  testCSV.spec.customresourcedefinitions.owned[0].statusDescriptors
    // exclude Conditions since they are included in their own section
    .filter((descriptor) => descriptor.path !== 'conditions')
    .forEach((descriptor) => {
      if (descriptor.path === 'hidden') {
        it(`does not display status descriptor for ${descriptor.displayName}`, () => {
          cy.byTestSelector(`details-item-label__${descriptor.displayName}`).should('not.exist');
        });
      } else {
        it(`displays status descriptor for ${descriptor.displayName}`, () => {
          cy.byTestSelector(`details-item-label__${descriptor.displayName}`).should('exist');
        });
      }
    });

  it('deletes operand', () => {
    cy.log(
      'Delete operand instance created in prior steps. Fixes a failure when trying to create a duplicate operand in the "successfully creates operand using form" step.',
    );
    cy.visit(
      `/k8s/ns/${testName}/operators.coreos.com~v1alpha1~ClusterServiceVersion/${testCSV.metadata.name}/${testCRD.spec.group}~${testCRD.spec.versions[0].name}~${testCRD.spec.names.kind}`,
    );
    cy.byTestOperandLink('olm-descriptors-test').should('exist');
    cy.byLegacyTestID('kebab-button').click();
    cy.byTestActionID(`Delete ${testCRD.spec.names.kind}`).click();
    modal.shouldBeOpened();
    modal.submit();
    modal.shouldBeClosed();
  });

  it('displays form for creating operand', () => {
    cy.visit(
      `/k8s/ns/${testName}/operators.coreos.com~v1alpha1~ClusterServiceVersion/${testCSV.metadata.name}/${testCRD.spec.group}~${testCRD.spec.versions[0].name}~${testCRD.spec.names.kind}`,
    );
    cy.byTestID('item-create').click();
    cy.byLegacyTestID('resource-title').should('have.text', 'Create App');
  });

  // TODO: implement tests for more descriptor-based form fields and widgets as well as data syncing.
  atomicFields.forEach(({ label, id, path }) => {
    it(`pre-populates ${label} field`, () => {
      getOperandFormFieldElement(id).should('exist');
      getOperandFormFieldLabel(id).should('have.text', label);
      getOperandFormFieldInput(id).should('have.value', _.get(testCR, path).toString());
    });
  });

  it('pre-populates Select field', () => {
    getOperandFormFieldElement(SELECT_FIELD_ID).should('exist');
    getOperandFormFieldLabel(SELECT_FIELD_ID).should('have.text', 'Select');
    cy.get(`#${SELECT_FIELD_ID} .pf-c-dropdown__toggle-text`).should(
      'have.text',
      testCR?.spec?.select.toString(),
    );
  });

  it('pre-populates Labels field', () => {
    getOperandFormFieldElement(LABELS_FIELD_ID).should('exist');
    getOperandFormFieldLabel(LABELS_FIELD_ID).should('have.text', 'Labels');
    cy.get(`#${LABELS_FIELD_ID}_field .tag-item__content`).should(
      'have.text',
      `automatedTestName=${testName}`,
    );
  });

  it('pre-populates Field Group', () => {
    cy.get(`#${FIELD_GROUP_ID}_field-group`).should('exist');
    cy.get(`#${FIELD_GROUP_ID}_accordion-toggle`)
      .should('exist')
      .click();
    cy.get(`[for="${FIELD_GROUP_ID}_itemOne"]`).should('have.text', 'Item One');
    cy.get(`#${FIELD_GROUP_ID}_itemOne`).should('have.value', testCR.spec.fieldGroup.itemOne);
    cy.get(`[for="${FIELD_GROUP_ID}_itemTwo"]`).should('have.text', 'Item Two');
    cy.get(`#${FIELD_GROUP_ID}_itemTwo`).should('have.value', testCR.spec.fieldGroup.itemTwo);
  });

  it('pre-populates Array Field Group', () => {
    cy.get(`#${ARRAY_FIELD_GROUP_ID}_field-group`).should('exist');
    cy.get(`#${ARRAY_FIELD_GROUP_ID}_accordion-toggle`)
      .should('exist')
      .click();
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
  });

  it('does not render hidden field group', () => {
    cy.get('#root_spec_hiddenFieldGroup_field-group').should('not.exist');
  });

  it('successfully creates operand using form', () => {
    cy.byTestID('create-dynamic-form').click();
    cy.byTestOperandLink('olm-descriptors-test')
      .should('exist')
      .click();
    cy.get('.co-operand-details__section--info').should('exist');
  });
});
