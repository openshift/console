import { safeLoad } from 'js-yaml';
import * as _ from 'lodash';
import {
  AlertmanagerConfig,
  AlertmanagerRoute,
} from '@console/internal/components/monitoring/alertmanager/alertmanager-config';
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
    cy.byTestID('alert-success').should('not.exist');
    yamlEditor.clickSaveCreateButton();
    cy.byTestID('alert-success').should('exist');
  });

  it('creates and deletes a receiver', () => {
    cy.log('create Webhook Receiver');
    const receiverName = `WebhookReceiver-${testName}`;
    const receiverType = 'webhook';
    const configName = `${receiverType}_configs`;
    const label = 'severity = warning';
    const webhookURL = 'http://mywebhookurl';
    alertmanager.createReceiver(receiverName, configName);
    alertmanager.showAdvancedConfiguration();
    cy.byLegacyTestID('send-resolved-alerts').should('be.checked');
    cy.byLegacyTestID('webhook-url').type(webhookURL);
    cy.byLegacyTestID('label-0').type(label);
    alertmanager.save();
    alertmanager.validateCreation(receiverName, receiverType, label);
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
    alertmanager.visitYAMLPage();
    yamlEditor.setEditorContent(yaml);
    yamlEditor.clickSaveCreateButton();
    cy.byTestID('alert-success').should('exist');
    detailsPage.selectTab('details');
    cy.get('[data-test-rows="resource-row"]')
      .contains('team-X-pager')
      .parents('tr')
      .within(() => {
        cy.get('[data-test-id="kebab-button"]').click();
      });
    cy.get('[data-test-action="Delete Receiver"]').should('be.disabled');
    alertmanager.reset();
  });

  it('converts existing match and match_re routing labels to matchers', () => {
    const receiverName = `EmailReceiver-${testName}`;
    const severity = 'severity';
    const warning = 'warning';
    const service = 'service';
    const regex = '^(foo1|foo2|baz)$';
    const matcher1 = `${severity} = ${warning}`;
    const matcher2 = `${service} =~ ${regex}`;
    const yaml = `global:
  resolve_timeout: 5m
inhibit_rules:
  - equal:
      - namespace
      - alertname
    source_matchers:
      - severity = critical
    target_matchers:
      - severity =~ warning|info
  - equal:
      - namespace
      - alertname
    source_matchers:
      - severity = warning
    target_matchers:
      - severity = info
  - equal:
      - namespace
    source_matchers:
      - alertname = InfoInhibitor
    target_matchers:
      - severity = info
receivers:
  - name: Default
  - name: Watchdog
  - name: Critical
  - name: "null"
  - name: ${receiverName}
    email_configs:
      - to: you@there.com
        from: me@here.com
        smarthost: "smarthost:8080"
route:
  group_by:
    - namespace
  group_interval: 5m
  group_wait: 30s
  receiver: Default
  repeat_interval: 12h
  routes:
    - matchers:
        - alertname = Watchdog
      receiver: Watchdog
    - matchers:
        - alertname = InfoInhibitor
      receiver: "null"
    - matchers:
        - severity = critical
      receiver: Critical
    - receiver: ${receiverName}
      match:
        ${severity}: ${warning}
      match_re:
        ${service}: ${regex}`;
    cy.log('add a receiver with match and match_re routing labels');
    alertmanager.visitAlertmanagerPage();
    alertmanager.visitYAMLPage();
    yamlEditor.setEditorContent(yaml);
    yamlEditor.clickSaveCreateButton();
    cy.get('.yaml-editor__buttons .pf-m-success').should('exist');
    detailsPage.selectTab('details');
    listPage.rows.shouldExist(receiverName);
    alertmanager.visitEditPage(receiverName);
    cy.byLegacyTestID('label-0').should('have.value', matcher1);
    cy.byLegacyTestID('label-1').should('have.value', matcher2);
    alertmanager.save();

    cy.log('verify match and match_re routing labels were converted to matchers');
    alertmanager.visitAlertmanagerPage();
    alertmanager.visitYAMLPage();
    yamlEditor.getEditorContent().then((content) => {
      const config: AlertmanagerConfig = safeLoad(content);
      const route: AlertmanagerRoute = _.find(config.route.routes, {
        receiver: receiverName,
      });
      expect(route.matchers[0]).toEqual(matcher1);
      expect(route.matchers[1]).toEqual(matcher2);
    });
  });
});
