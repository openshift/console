// import * as _ from 'lodash';
import { checkErrors, testName } from '../../../support';
import { alertmanager } from '../../../views/alertmanager';
import { detailsPage } from '../../../views/details-page';
import { listPage } from '../../../views/list-page';
import { modal } from '../../../views/modal';
import { nav } from '../../../views/nav';
import * as yamlEditor from '../../../views/yaml-editor';

describe('Alertmanager', () => {
  before(() => {
    cy.login();
    cy.initAdmin();
  });

  afterEach(() => {
    checkErrors();
  });

  after(() => {
    alertmanager.reset();
  });

  it('displays the Alertmanager Configuration Details page', () => {
    nav.sidenav.clickNavLink(['Administration', 'Cluster Settings']);
    detailsPage.selectTab('Configuration');
    cy.byLegacyTestID('Alertmanager').click();
    cy.byTestSectionHeading('Alert routing').should('exist');
  });

  it('launches Alert Routing modal, edits and saves correctly', () => {
    alertmanager.visitAlertmanagerPage();
    cy.byTestID('edit-alert-routing-btn').click();
    cy.byLegacyTestID('input-group-by').type(', cluster');
    cy.byLegacyTestID('input-group-wait').clear();
    cy.byLegacyTestID('input-group-wait').type('60s');
    cy.byLegacyTestID('input-group-interval').clear();
    cy.byLegacyTestID('input-group-interval').type('10m');
    cy.byLegacyTestID('input-repeat-interval').clear();
    cy.byLegacyTestID('input-repeat-interval').type('24h');
    cy.byTestID('confirm-action').click();
    modal.shouldBeClosed();
    cy.byLegacyTestID('group_by_value').should('contain', ', cluster');
    cy.byLegacyTestID('group_wait_value').should('contain', '60s');
    cy.byLegacyTestID('group_interval_value').should('contain', '10m');
    cy.byLegacyTestID('repeat_interval_value').should('contain', '24h');
  });

  it('displays the Alertmanager YAML page and saves Alertmanager YAML', () => {
    alertmanager.visitAlertmanagerPage();
    detailsPage.selectTab('yaml');
    yamlEditor.isLoaded();
    cy.get('.yaml-editor__buttons .pf-m-success').should('not.exist');
    yamlEditor.clickSaveCreateButton();
    cy.get('.yaml-editor__buttons .pf-m-success').should('exist');
  });

  it('creates and deletes a receiver', () => {
    cy.log('create Webhook Receiver');
    const receiverName = `WebhookReceiver-${testName}`;
    const receiverType = 'webhook';
    const configName = `${receiverType}_configs`;
    const severity = 'severity';
    const warning = 'warning';
    const webhookURL = 'http://mywebhookurl';
    alertmanager.createReceiver(receiverName, configName);
    alertmanager.showAdvancedConfiguration();
    cy.byLegacyTestID('send-resolved-alerts').should('be.checked');
    cy.byLegacyTestID('webhook-url').type(webhookURL);
    cy.byLegacyTestID('label-name-0').type(severity);
    cy.byLegacyTestID('label-value-0').type(warning);
    alertmanager.save();
    alertmanager.validateCreation(receiverName, receiverType, severity, warning);
    listPage.rows.clickKebabAction(receiverName, 'Delete Receiver');
    modal.submit();
    modal.shouldBeClosed();
    listPage.rows.shouldNotExist(receiverName);
  });

  it('prevents deletion and form edit of a receiver with sub-route', () => {
    const yaml = `route:
  routes:
    - match:
      service: database
      receiver: team-DB-pager
      routes:
        - match:
          owner: team-X
          receiver: team-X-pager
receivers:
- name: 'team-X-pager'
- name: 'team-DB-pager'`;
    alertmanager.visitAlertmanagerPage();
    detailsPage.selectTab('yaml');
    yamlEditor.isLoaded();
    yamlEditor.setEditorContent(yaml);
    yamlEditor.clickSaveCreateButton();
    cy.get('.yaml-editor__buttons .pf-m-success').should('exist');
    detailsPage.selectTab('details');
    cy.get(`[data-test-rows="resource-row"]`)
      .contains('team-X-pager')
      .parents('tr')
      .within(() => {
        cy.get('[data-test-id="kebab-button"]').click();
      });
    cy.get('[data-test-action="Delete Receiver"]').should('be.disabled');
    alertmanager.reset();
  });
});
