import { testName } from '../../support';
import { virtualization } from '../../view/virtualization';
import { wizard } from '../../view/wizard';

const TEMPLATE_NAME = 'foo';
const TEMPLATE_NO_SUPPORT_NAME = 'foo-no-support';

describe('test VM template support', () => {
  before(() => {
    cy.visit('');
    cy.createProject(testName);
  });

  beforeEach(() => {
    virtualization.templates.visit();
  });

  afterEach(() => {
    cy.deleteResource({
      kind: 'Template',
      metadata: {
        name: TEMPLATE_NAME,
        namespace: testName,
      },
    });
    cy.deleteResource({
      kind: 'Template',
      metadata: {
        name: TEMPLATE_NO_SUPPORT_NAME,
        namespace: testName,
      },
    });
  });

  it('details show user supported template', () => {
    wizard.template.open();
    wizard.template.createTemplate(TEMPLATE_NAME, 'bar', true);
    virtualization.templates.testProvider(TEMPLATE_NAME, 'bar');
    virtualization.templates.testSource(TEMPLATE_NAME, 'bar');

    wizard.template.open();
    wizard.template.createTemplate(TEMPLATE_NO_SUPPORT_NAME, 'bar', false);
    virtualization.templates.testProvider(TEMPLATE_NO_SUPPORT_NAME, 'bar');
    virtualization.templates.testSource(TEMPLATE_NO_SUPPORT_NAME, 'bar');
    virtualization.templates.testSupport(TEMPLATE_NO_SUPPORT_NAME, undefined);
  });

  if (Cypress.env('DOWNSTREAM')) {
    it('shows support modal for community supported template', () => {
      virtualization.templates.testSupport('CentOS 7.0+ VM');
      virtualization.templates.clickCreate('CentOS 7.0+ VM');
      cy.get('.ReactModal__Overlay').within(() => {
        cy.get('a').should('have.attr', 'href', 'https://www.centos.org');
        cy.byLegacyTestID('modal-cancel-action').click();
      });
    });

    it('shows no support modal for user supported template based on community supported one', () => {
      wizard.template.open();
      wizard.template.createTemplate(TEMPLATE_NAME, 'bar', true, 'CentOS 7 or higher');
      virtualization.templates.testProvider(TEMPLATE_NAME, 'bar');
      virtualization.templates.testSource(TEMPLATE_NAME, 'bar');
      virtualization.templates.testSupport(TEMPLATE_NAME, 'bar');
      virtualization.templates.clickCreate(TEMPLATE_NAME);
      cy.get('.ReactModal__Overlay').should('not.exist');
    });

    it('shows support modal for user template based on community supported one', () => {
      wizard.template.open();
      wizard.template.createTemplate(TEMPLATE_NAME, 'bar', false, 'CentOS 7 or higher');
      virtualization.templates.testProvider(TEMPLATE_NAME, 'bar');
      virtualization.templates.testSource(TEMPLATE_NAME, 'bar');
      virtualization.templates.testSupport(TEMPLATE_NAME);
      virtualization.templates.clickCreate(TEMPLATE_NAME);
      cy.get('.ReactModal__Overlay').within(() => {
        cy.get('a').should('have.attr', 'href', 'https://www.centos.org');
        cy.byLegacyTestID('modal-cancel-action').click();
      });
    });

    it('shows no support modal for supported template', () => {
      virtualization.templates.testSupport('Red Hat Enterprise Linux 8.0+ VM', 'Red Hat');
      virtualization.templates.clickCreate('Red Hat Enterprise Linux 8.0+ VM');
      cy.get('.ReactModal__Overlay').should('not.exist');
    });

    it('shows no support modal for user supported template', () => {
      wizard.template.open();
      wizard.template.createTemplate(
        TEMPLATE_NAME,
        'bar',
        true,
        'Red Hat Enterprise Linux 8.0 or higher',
      );
      virtualization.templates.testProvider(TEMPLATE_NAME, 'bar');
      virtualization.templates.testSource(TEMPLATE_NAME, 'bar');
      virtualization.templates.testSupport(TEMPLATE_NAME, 'bar', 'Red Hat');
      virtualization.templates.clickCreate(TEMPLATE_NAME);
      cy.get('.ReactModal__Overlay').should('not.exist');
    });

    it('shows support modal for user template with no support', () => {
      wizard.template.open();
      wizard.template.createTemplate(TEMPLATE_NAME, 'bar', false, 'CentOS 7 or higher');
      virtualization.templates.testProvider(TEMPLATE_NAME, 'bar');
      virtualization.templates.testSource(TEMPLATE_NAME, 'bar');
      cy.exec(
        `kubectl patch template -n ${testName} ${TEMPLATE_NAME} --type=json -p'[{"op": "remove", "path": "/metadata/annotations/template.kubevirt.ui~1parent-support-level"}, {"op": "remove", "path": "/metadata/annotations/template.kubevirt.ui~1parent-provider-url"}]'`,
      );
      virtualization.templates.testSupport(TEMPLATE_NAME);
      virtualization.templates.clickCreate(TEMPLATE_NAME);
      cy.get('.ReactModal__Overlay').within(() => {
        cy.byTestID('no-support-description').should('exist');
      });
    });
  }
});
