import * as React from 'react';
import * as _ from 'lodash-es';

import { K8sResourceKind } from '../../module/k8s';
import { ResourceLink } from './';

const kubeAPIServerURL = (window as any).SERVER_FLAGS.kubeAPIServerURL || 'https://<api-server>';
/* eslint-disable no-undef */
enum TriggerTypes {
  Bitbucket ='Bitbucket',
  ConfigChange = 'ConfigChange',
  Generic = 'Generic',
  GitHub = 'GitHub',
  GitLab = 'GitLab',
  ImageChange = 'ImageChange',
}
const webhookTriggers = new Set<TriggerTypes>([TriggerTypes.Bitbucket, TriggerTypes.Generic, TriggerTypes.GitHub, TriggerTypes.GitLab]);
/* eslint-enable no-undef */
const getTriggerProperty = trigger => webhookTriggers.has(trigger.type) ? trigger.type.toLowerCase() : null;

export const Triggers: React.SFC<TriggersProps> = ({ resource }) => {
  const triggers = _.get(resource, 'spec.triggers');
  const namespace = resource.metadata.namespace;
  const buildConfigName = resource.metadata.name;
  const getWebhookURL = trigger => {
    const triggerProperty = getTriggerProperty(trigger);
    return triggerProperty
      ? `${kubeAPIServerURL}/apis/build.openshift.io/v1/namespaces/${namespace}/buildconfigs/${buildConfigName}/webhooks/<secret>/${triggerProperty}`
      : '-';
  };
  const getSecretReference = trigger => {
    const triggerProperty = getTriggerProperty(trigger);
    const secretName = _.get(trigger, [triggerProperty, 'secretReference', 'name']);
    return secretName
      ? <ResourceLink kind="Secret" name={secretName} namespace={namespace} title={secretName} />
      : '-';
  };
  return !_.isEmpty(triggers) && <div className="co-m-pane__body">
    <h1 className="co-section-title">Triggers</h1>
    <div className="co-table-container">
      <table className="table">
        <thead>
          <tr>
            <th>Type</th>
            <th>Webhook URL</th>
            <th>Secret Reference</th>
          </tr>
        </thead>
        <tbody>
          {_.map(triggers, (trigger, i) => {
            const webhookURL = getWebhookURL(trigger);
            const secretReference = getSecretReference(trigger);
            return <tr key={i}>
              <td>{trigger.type}</td>
              <td>{webhookURL}</td>
              <td>{secretReference}</td>
            </tr>;
          })}
        </tbody>
      </table>
    </div>
  </div>;
};

/* eslint-disable no-undef */
export type TriggersProps = {
  resource: K8sResourceKind;
};
/* eslint-enable no-undef */

Triggers.displayName = 'Triggers';
