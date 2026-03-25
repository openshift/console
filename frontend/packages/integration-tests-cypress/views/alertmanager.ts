import { Base64 } from 'js-base64';
import { safeLoad } from 'js-yaml';
import * as _ from 'lodash';
import type {
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
    cy.byTestID('create-receiver').click();
    cy.byTestID('receiver-name').type(receiverName);
    cy.byTestID('receiver-type').click();
    cy.get(`[data-test=receiver-type-${configs}]`).click();
  },
  reset: () =>
    cy.exec(
      `kubectl patch secret 'alertmanager-main' -n 'openshift-monitoring' --type='json' -p='[{ op: 'replace', path: '/data/alertmanager.yaml', value: ${defaultAlertmanagerYaml}}]'`,
    ),
  save: () => cy.byTestID('save-changes').should('be.enabled').click(),
  showAdvancedConfiguration: () => cy.byTestID('advanced-configuration').find('button').click(),
  validateCreation: (receiverName: string, typeCellName: string, labelCellName: string) => {
    listPage.dvFilter.byName(receiverName);
    listPage.dvRows.shouldExist(receiverName);
    listPage.dvRows.shouldExist(receiverName, typeCellName);
    listPage.dvRows.shouldExist(receiverName, labelCellName);
  },
  visitAlertmanagerPage: () => {
    cy.visit('/settings/cluster/alertmanagerconfig');
  },
  visitEditPage: (receiverName: string) => {
    cy.visit(`/settings/cluster/alertmanagerconfig/receivers/${receiverName}/edit`);
  },
  visitYAMLPage: () => {
    detailsPage.selectTab('YAML');
    yamlEditor.isLoaded();
  },
};
