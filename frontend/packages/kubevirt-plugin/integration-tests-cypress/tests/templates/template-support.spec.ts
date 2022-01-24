import { testName } from '../../support';
import { K8S_KIND, TEMPLATE } from '../../utils/const/index';
import { virtualization } from '../../views/virtualization';
import { wizard } from '../../views/wizard';

const TEMPLATE_NAME = 'foo';
const TEMPLATE_NO_SUPPORT_NAME = 'foo-no-support';

describe('test VM template support', () => {
  before(() => {
    cy.Login();
    cy.visit('');
    cy.createProject(testName);
  });

  after(() => {
    cy.deleteTestProject(testName);
  });

  beforeEach(() => {
    cy.visitVMTemplatesList();
  });

  afterEach(() => {
    cy.deleteResource(K8S_KIND.Template, TEMPLATE_NAME, testName);
    cy.deleteResource(K8S_KIND.Template, TEMPLATE_NO_SUPPORT_NAME, testName);
  });

  it('details show user supported template', () => {
    wizard.template.open();
    wizard.template.createTemplate(TEMPLATE_NAME, 'bar', true);
    virtualization.templates.testProvider(TEMPLATE_NAME, 'bar');
    virtualization.templates.testSource(TEMPLATE_NAME, 'bar');
    virtualization.templates.testSupport(TEMPLATE_NAME, 'Full');

    wizard.template.open();
    wizard.template.createTemplate(TEMPLATE_NO_SUPPORT_NAME, 'bar', false);
    virtualization.templates.testProvider(TEMPLATE_NO_SUPPORT_NAME, 'bar');
    virtualization.templates.testSource(TEMPLATE_NO_SUPPORT_NAME, 'bar');
    virtualization.templates.testSupport(TEMPLATE_NO_SUPPORT_NAME, undefined);
  });

  if (Cypress.env('DOWNSTREAM')) {
    it('shows support modal for community supported template', () => {
      virtualization.templates.testSupport(TEMPLATE.CENTOS7.name, TEMPLATE.CENTOS7.supportLevel);
      virtualization.templates.clickCreate(TEMPLATE.CENTOS7.name);
      cy.get('.ReactModal__Overlay').within(() => {
        cy.get('a').should('have.attr', 'href', 'https://www.centos.org');
        cy.byLegacyTestID('modal-cancel-action').click();
      });
    });

    it('shows no support modal for user supported template based on community supported one', () => {
      wizard.template.open();
      wizard.template.createTemplate(TEMPLATE_NAME, 'bar', true, TEMPLATE.CENTOS7.os);
      virtualization.templates.testProvider(TEMPLATE_NAME, 'bar');
      virtualization.templates.testSource(TEMPLATE_NAME, 'bar');
      virtualization.templates.testSupport(TEMPLATE_NAME, 'Full');
      virtualization.templates.clickCreate(TEMPLATE_NAME);
      cy.get('.ReactModal__Overlay').should('not.exist');
    });

    it('shows support modal for user template based on community supported one', () => {
      wizard.template.open();
      wizard.template.createTemplate(TEMPLATE_NAME, 'bar', false, TEMPLATE.CENTOS7.os);
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
      virtualization.templates.testSupport(TEMPLATE.RHEL8.name, TEMPLATE.RHEL8.supportLevel);
      virtualization.templates.clickCreate(TEMPLATE.RHEL8.name);
      cy.get('.ReactModal__Overlay').should('not.exist');
    });

    it('shows no support modal for user supported template', () => {
      wizard.template.open();
      wizard.template.createTemplate(TEMPLATE_NAME, 'bar', true, TEMPLATE.RHEL8.os);
      virtualization.templates.testProvider(TEMPLATE_NAME, 'bar');
      virtualization.templates.testSource(TEMPLATE_NAME, 'bar');
      virtualization.templates.testSupport(TEMPLATE_NAME, 'Full');
      virtualization.templates.clickCreate(TEMPLATE_NAME);
      cy.get('.ReactModal__Overlay').should('not.exist');
    });
  }
});
