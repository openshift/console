/* eslint-disable camelcase */
import * as _ from 'lodash-es';
import { Base64 } from 'js-base64';
import { safeLoad, safeDump } from 'js-yaml';

import { k8sPatch, K8sResourceKind } from '../../module/k8s';
import { AlertmanagerConfig } from './alert-manager-config';
import { SecretModel } from '../../models';

// t('public~PagerDuty')
// t('public~Webhook')
// t('public~Email')
// t('public~Slack')
export const receiverTypes = Object.freeze({
  pagerduty_configs: 'PagerDuty',
  webhook_configs: 'Webhook',
  email_configs: 'Email',
  slack_configs: 'Slack',
});

export const getAlertmanagerYAML = (
  secret: K8sResourceKind,
): { yaml: string; errorMessage?: string } => {
  const alertManagerYaml = _.get(secret, ['data', 'alertmanager.yaml']);

  if (_.isEmpty(alertManagerYaml)) {
    return {
      yaml: '',
      errorMessage:
        'Error: alertmanager.yaml not found in Secret "alertmanager-main", in namespace "openshift-monitoring"',
    };
  }

  try {
    const yaml = Base64.decode(alertManagerYaml);
    return { yaml };
  } catch (e) {
    return { yaml: '', errorMessage: `Error decoding alertmanager.yaml: ${e}` };
  }
};

export const getAlertmanagerConfig = (
  secret: K8sResourceKind,
): { config: AlertmanagerConfig; errorMessage?: string } => {
  const parsedAlertManagerYAML = getAlertmanagerYAML(secret);
  try {
    const config = safeLoad(parsedAlertManagerYAML.yaml);
    return { config, errorMessage: parsedAlertManagerYAML.errorMessage };
  } catch (e) {
    return { config: null, errorMessage: `Error loading alertmanager.yaml: ${e}` };
  }
};

export const patchAlertmanagerConfig = (
  secret: K8sResourceKind,
  yaml: object | string,
): Promise<any> => {
  const yamlString = _.isObject(yaml) ? safeDump(yaml) : yaml;
  const yamlEncodedString = Base64.encode(yamlString);
  const patch = [{ op: 'replace', path: '/data/alertmanager.yaml', value: yamlEncodedString }];
  return k8sPatch(SecretModel, secret, patch);
};
