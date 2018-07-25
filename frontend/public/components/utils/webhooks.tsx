/* eslint-disable no-undef */

import * as React from 'react';
import * as _ from 'lodash-es';

import { K8sResourceKind } from '../../module/k8s';
import { SectionHeading, ResourceLink } from '.';
import { Overflow } from './overflow';

const kubeAPIServerURL = (window as any).SERVER_FLAGS.kubeAPIServerURL || 'https://<api-server>';
enum TriggerTypes {
  Bitbucket ='Bitbucket',
  ConfigChange = 'ConfigChange',
  Generic = 'Generic',
  GitHub = 'GitHub',
  GitLab = 'GitLab',
  ImageChange = 'ImageChange',
}
const webhookTriggers = new Set<TriggerTypes>([TriggerTypes.Bitbucket, TriggerTypes.Generic, TriggerTypes.GitHub, TriggerTypes.GitLab]);
const getTriggerProperty = trigger => trigger.type.toLowerCase();

export const WebhookTriggers: React.SFC<WebhookTriggersProps> = ({ resource }) => {
  const { name, namespace } = resource.metadata;
  const { triggers } = resource.spec;
  const webhooks = _.filter(triggers, trigger => webhookTriggers.has(trigger.type));
  if (_.isEmpty(webhooks)) {
    return null;
  }

  const getWebhookURL = trigger => {
    const triggerProperty = getTriggerProperty(trigger);

    // FIXME: Consider showing the secret in the table so that users can copy the real URL. Maybe a show/hide toggle like secrets?
    // const secret = _.get(trigger, [triggerProperty, 'secret'], '<secret>');
    // return `${kubeAPIServerURL}/apis/build.openshift.io/v1/namespaces/${namespace}/buildconfigs/${name}/webhooks/${secret}/${triggerProperty}`;

    return `${kubeAPIServerURL}/apis/build.openshift.io/v1/namespaces/${namespace}/buildconfigs/${name}/webhooks/<secret>/${triggerProperty}`;
  };

  const getSecretReference = trigger => {
    const triggerProperty = getTriggerProperty(trigger);
    const secretName = _.get(trigger, [triggerProperty, 'secretReference', 'name']);
    return secretName
      ? <ResourceLink kind="Secret" name={secretName} namespace={namespace} title={secretName} />
      : <span className="text-muted">No secret</span>;
  };

  return <div className="co-m-pane__body">
    <SectionHeading text="Webhooks" />
    <div className="co-table-container">
      <table className="table">
        <colgroup>
          <col className="col-sm-2" />
          <col className="col-sm-7" />
          <col className="col-sm-3" />
        </colgroup>
        <thead>
          <tr>
            <th>Type</th>
            <th>Webhook URL</th>
            <th>Secret</th>
          </tr>
        </thead>
        <tbody>
          {_.map(webhooks, (trigger, i) => {
            const webhookURL = getWebhookURL(trigger);
            const secretReference = getSecretReference(trigger);
            return <tr key={i}>
              <td>{trigger.type}</td>
              <td><Overflow value={webhookURL} /></td>
              <td>{secretReference}</td>
            </tr>;
          })}
        </tbody>
      </table>
    </div>
  </div>;
};

export type WebhookTriggersProps = {
  resource: K8sResourceKind;
};

WebhookTriggers.displayName = 'WebhookTriggers';
