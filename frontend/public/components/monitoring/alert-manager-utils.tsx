/* eslint-disable camelcase */
import * as _ from 'lodash-es';
import { Base64 } from 'js-base64';
import { safeLoad, safeDump } from 'js-yaml';

import { k8sPatch, K8sResourceKind } from '../../module/k8s';
import {
  AlertManagerConfig,
  AlertManagerReceiver,
  AlertManagerRoute,
} from './alert-manager-config';
import { SecretModel } from '../../models';

export const DEFAULT_RECEIVER_LABEL = 'All (default receiver)';

export const getAlertManagerConfig = (secret: K8sResourceKind, setErrorMsg) => {
  const alertManagerYaml = _.get(secret, ['data', 'alertmanager.yaml']);
  let config: AlertManagerConfig;

  if (_.isEmpty(alertManagerYaml)) {
    setErrorMsg(
      'Error: alertmanager.yaml not found in Secret "alertmanager-main", in namespace "openshift-monitoring"',
    );
    return config;
  }

  try {
    config = safeLoad(Base64.decode(alertManagerYaml));
  } catch (e) {
    setErrorMsg(`Error loading alertmanager.yaml: ${e}`);
  }
  return config;
};

export const patchAlertManagerConfig = (
  secret: K8sResourceKind,
  yaml: object | string,
): Promise<any> => {
  const yamlString = _.isObject(yaml) ? safeDump(yaml) : yaml;
  const yamlEncodedString = Base64.encode(yamlString);
  const patch = [{ op: 'replace', path: '/data/alertmanager.yaml', value: yamlEncodedString }];
  return k8sPatch(SecretModel, secret, patch);
};

export const receiverTypes = {
  pagerduty_configs: 'PagerDuty',
  webhook_configs: 'Webhook Receiver',
};

/**
 * Converts route object:
 * {
 *   receiver: "MyReceiver",
 *   match: {
 *     severity: "warning",
 *     cluster: "myCluster"
 *   },
 *   match_re: {
 *    service: "$foobar"
 *  }
};
 * ...to array of labels for Routing Labels form component
 * [
 *   {
 *     "name": "severity",
 *     "value": "warning",
 *     "isRegex": false
 *   },
 *   {
 *     "name": "cluster",
 *     "value": "myCluster",
 *     "isRegex": false
 *   },
 *   {
 *     "name": "service",
 *     "value": "$foobar",
 *     "isRegex": true
 *   }
 * ]
 */
export const getRouteLabelsForForm = (
  receiver: AlertManagerReceiver,
  routes: AlertManagerRoute[],
) => {
  const routesOfReceiver = _.find(
    routes,
    (aRoute: AlertManagerRoute) => aRoute.receiver === receiver.name,
  );
  const matches = _.map(_.get(routesOfReceiver, 'match', {}), (v, k) => {
    return { name: k, value: v, isRegex: false };
  });
  const regexMatches = _.map(_.get(routesOfReceiver, 'match_re', {}), (v, k) => {
    return { name: k, value: v, isRegex: true };
  });
  return _.concat([], matches, regexMatches);
};

/**
 * Returns new Route object
 * Ex:
 * {
 *   receiver: myNewReceiver,
 *   match: {
 *     "severity": "warning",
 *     "cluster": "myCluster"
 *   }
 *   match_re {
 *     "service": "^(foo1|foo2|baz)$",
 *   }
 * }
 */
export const createRoute = (receiver: AlertManagerReceiver, routeLabels) => {
  const newRoute = { receiver: receiver.name };
  _.each(routeLabels, (label) => {
    _.set(newRoute, [label.isRegex ? 'match_re' : 'match', label.name], label.value);
  });
  return newRoute;
};

/**
 * Returns new Receiver object
 * Ex:
 * {
 *   name: MyNewReceiver
 *   pagerduty_configs: {
 *     routing_key: <integration_key>
 *   }
 * }
 */
export const createReceiver = (
  receiverName: string,
  receiverType: string,
  pagerDutyValues: any,
  webhookUrl: string,
) => {
  let receiverConfig;
  switch (receiverType) {
    case 'pagerduty_configs':
      // eslint-disable-next-line no-case-declarations
      const pagerDutyIntegrationKeyName = `${
        pagerDutyValues.integrationType === 'events' ? 'routing' : 'service'
      }_key`;
      receiverConfig = {
        [pagerDutyIntegrationKeyName]: pagerDutyValues.integrationKey,
      };
      break;
    case 'webhook_configs':
      receiverConfig = { url: webhookUrl };
      break;
    default:
  }
  return {
    name: receiverName,
    [receiverType]: [{ ...receiverConfig }],
  };
};

export const isDefaultReceiverLabel = (routeLabel: AlertRoutingLabel) => {
  return routeLabel.name === DEFAULT_RECEIVER_LABEL && routeLabel.value === DEFAULT_RECEIVER_LABEL;
};

export const addDefaultReceiverLabel = () => [
  { name: DEFAULT_RECEIVER_LABEL, value: DEFAULT_RECEIVER_LABEL, isRegex: false },
];

export const removeDefaultReceiverLabel = (routeLabels: AlertRoutingLabel[]) => {
  const index = _.findIndex(routeLabels, {
    name: DEFAULT_RECEIVER_LABEL,
    value: DEFAULT_RECEIVER_LABEL,
  });
  if (index !== -1) {
    routeLabels.splice(index, 1);
  }
};

type AlertRoutingLabel = {
  name: string;
  value: string;
  isRegex: boolean;
};
