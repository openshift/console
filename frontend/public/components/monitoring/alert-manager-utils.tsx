/* eslint-disable camelcase */
import * as _ from 'lodash-es';
import { Base64 } from 'js-base64';
import { safeLoad, safeDump } from 'js-yaml';

import { k8sPatch, K8sResourceKind } from '../../module/k8s';
import { AlertmanagerConfig } from './alert-manager-config';
import { SecretModel } from '../../models';

// t('alert-manager-receiver-forms~PagerDuty')
// t('alert-manager-receiver-forms~Webhook')
// t('alert-manager-receiver-forms~Email')
// t('alert-manager-receiver-forms~Slack')
export const receiverTypes = Object.freeze({
  pagerduty_configs: 'PagerDuty',
  webhook_configs: 'Webhook',
  email_configs: 'Email',
  slack_configs: 'Slack',
});

export const getAlertmanagerYAML = (secret: K8sResourceKind, setErrorMsg): string => {
  const alertManagerYaml = _.get(secret, ['data', 'alertmanager.yaml']);
  let yaml = '';

  if (_.isEmpty(alertManagerYaml)) {
    setErrorMsg(
      'Error: alertmanager.yaml not found in Secret "alertmanager-main", in namespace "openshift-monitoring"',
    );
    return yaml;
  }

  try {
    yaml = Base64.decode(alertManagerYaml);
  } catch (e) {
    setErrorMsg(`Error decoding alertmanager.yaml: ${e}`);
  }

  return yaml;
};

export const getAlertmanagerConfig = (secret: K8sResourceKind, setErrorMsg): AlertmanagerConfig => {
  const alertManagerYAML: string = getAlertmanagerYAML(secret, setErrorMsg);
  try {
    return safeLoad(alertManagerYAML);
  } catch (e) {
    setErrorMsg(`Error loading alertmanager.yaml: ${e}`);
    return null;
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
