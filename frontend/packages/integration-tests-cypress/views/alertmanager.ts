import { Base64 } from 'js-base64';
import { safeLoad } from 'js-yaml';
import * as _ from 'lodash';
import {
  AlertmanagerConfig,
  AlertmanagerReceiver,
} from '@console/internal/components/monitoring/alertmanager/alertmanager-config';
import { detailsPage } from './details-page';
import { listPage } from './list-page';
import * as yamlEditor from './yaml-editor';

const defaultAlertmanagerYaml = Base64.encode(`"global":
  "resolve_timeout": "5m"
"inhibit_rules":
- "equal":
  - "namespace"
  - "alertname"
  "source_match":
    "severity": "critical"
  "target_match_re":
    "severity": "warning|info"
- "equal":
  - "namespace"
  - "alertname"
  "source_match":
    "severity": "warning"
  "target_match_re":
    "severity": "info"
"receivers":
- "name": "Default"
- "name": "Watchdog"
- "name": "Critical"
"route":
  "group_by":
  - "namespace"
  "group_interval": "5m"
  "group_wait": "30s"
  "receiver": "Default"
  "repeat_interval": "12h"
  "routes":
  - "matchers":
      - "alertname = Watchdog"
    "receiver": "Watchdog"
  - "matchers":
      - "severity = critical"
    "receiver": "Critical"`);

export const getGlobalsAndReceiverConfig = (name: string, configName: string, content: string) => {
  const config: AlertmanagerConfig = safeLoad(content);
  const receiverConfig: AlertmanagerReceiver | undefined = _.find(config.receivers, {
    name,
  });
  return {
    globals: config.global,
    receiverConfig: receiverConfig?.[configName][0],
  };
};

export const alertmanager = {
  createReceiver: (receiverName: string, configs: string) => {
    alertmanager.visitAlertmanagerPage();
    cy.byLegacyTestID('create-receiver').click();
    cy.byLegacyTestID('receiver-name').type(receiverName);
    cy.byLegacyTestID('dropdown-button').click();
    cy.get(`[data-test-dropdown-menu=${configs}]`).click();
  },
  reset: () =>
    cy.exec(
      `kubectl patch secret 'alertmanager-main' -n 'openshift-monitoring' --type='json' -p='[{ op: 'replace', path: '/data/alertmanager.yaml', value: ${defaultAlertmanagerYaml}}]'`,
    ),
  save: () => cy.byLegacyTestID('save-changes').should('be.enabled').click(),
  showAdvancedConfiguration: () => cy.byTestID('advanced-configuration').find('button').click(),
  validateCreation: (receiverName: string, type: string, label: string) => {
    cy.byLegacyTestID('item-filter').clear();
    cy.byLegacyTestID('item-filter').type(receiverName);
    listPage.rows.shouldExist(receiverName);
    listPage.rows.shouldExist(type);
    listPage.rows.shouldExist(label);
  },
  visitAlertmanagerPage: () => {
    cy.visit('/monitoring/alertmanagerconfig');
  },
  visitEditPage: (receiverName: string) => {
    cy.visit(`/monitoring/alertmanagerconfig/receivers/${receiverName}/edit`);
  },
  visitYAMLPage: () => {
    detailsPage.selectTab('yaml');
    yamlEditor.isLoaded();
  },
};
