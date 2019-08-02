import * as React from 'react';
import * as _ from 'lodash-es';
import { Base64 } from 'js-base64';
import { PasteIcon } from '@patternfly/react-icons';
import { Button } from '@patternfly/react-core';
import * as classNames from 'classnames';

import { K8sResourceKind, k8sGet } from '../../module/k8s';
import { SectionHeading, ResourceLink, useAccessReview } from '.';
import { SecretModel } from '../../models';
import { errorModal } from '../modals/error-modal';

const kubeAPIServerURL = window.SERVER_FLAGS.kubeAPIServerURL || 'https://<api-server>';
enum TriggerTypes {
  Bitbucket ='Bitbucket',
  ConfigChange = 'ConfigChange',
  Generic = 'Generic',
  GitHub = 'GitHub',
  GitLab = 'GitLab',
  ImageChange = 'ImageChange',
}
const webhookTriggers = new Set<TriggerTypes>([TriggerTypes.Bitbucket, TriggerTypes.Generic, TriggerTypes.GitHub, TriggerTypes.GitLab]);
const getTriggerProperty = (trigger: WebhookTrigger) => trigger.type.toLowerCase();

const getTableColumnClasses = (canGetSecret: boolean) => {
  if (canGetSecret) {
    return [
      classNames('col-lg-2', 'col-md-4', 'col-sm-4', 'col-xs-6'),
      classNames('col-lg-6', 'hidden-md', 'hidden-sm', 'hidden-xs', 'co-break-all'),
      classNames('col-lg-2', 'col-md-4 ', 'col-sm-4', 'hidden-xs'),
      classNames('col-lg-2', 'col-md-4', 'col-sm-4', 'col-xs-6'),
    ];
  }
  return [
    classNames('col-sm-2'),
    classNames('col-sm-7', 'co-break-all'),
    classNames('col-sm-3', 'hidden-xs'),
    classNames('hidden'),
  ];
};

export const WebhookTriggers: React.FC<WebhookTriggersProps> = props => {
  const { resource } = props;
  const { name, namespace } = resource.metadata;
  const { triggers } = resource.spec;
  const canGetSecret = useAccessReview({
    group: SecretModel.apiGroup,
    resource: SecretModel.plural,
    verb: 'get',
    namespace,
  });
  const tableColumnClasses = getTableColumnClasses(canGetSecret);
  const webhooks = _.filter(triggers, trigger => webhookTriggers.has(trigger.type));
  if (_.isEmpty(webhooks)) {
    return null;
  }

  const getWebhookURL = (trigger: WebhookTrigger, secret?: string) => {
    const triggerProperty = getTriggerProperty(trigger);
    return `${kubeAPIServerURL}/apis/build.openshift.io/v1/namespaces/${namespace}/buildconfigs/${name}/webhooks/${secret ? secret : '<secret>'}/${triggerProperty}`;
  };

  const getSecretReference = (trigger: WebhookTrigger) => {
    const triggerProperty = getTriggerProperty(trigger);
    const secretName = _.get(trigger, [triggerProperty, 'secretReference', 'name']);
    return secretName
      ? <ResourceLink kind="Secret" name={secretName} namespace={namespace} title={secretName} />
      : <span className="text-muted">No secret</span>;
  };

  const copyWebhookToClipboard = (trigger: WebhookTrigger) => {
    const triggerProperty = getTriggerProperty(trigger);

    // In case of obsolete `secret` field on the trigger.
    // https://github.com/openshift/api/blob/master/build/v1/types.go#L950
    if (_.has(trigger, [triggerProperty, 'secret'])) {
      const webhookSecret = _.get(trigger, [triggerProperty, 'secret']);
      const url = getWebhookURL(trigger, webhookSecret);
      navigator.clipboard.writeText(url);
      return;
    }

    const secretName = _.get(trigger, [triggerProperty, 'secretReference', 'name']);
    k8sGet(SecretModel, secretName, namespace).then((secret: K8sResourceKind) => {
      if (!_.has(secret, 'data.WebHookSecretKey')) {
        errorModal({error: `Secret referenced in the ${triggerProperty} webhook trigger does not contain 'WebHookSecretKey' key. Webhook trigger won’t work due to the invalid secret reference`});
        return;
      }
      const webhookSecretValue = Base64.decode(secret.data.WebHookSecretKey);
      const url = getWebhookURL(trigger, webhookSecretValue);
      navigator.clipboard.writeText(url);
    }, err => {
      const error = err.message;
      errorModal({error});
    });
  };

  return <div className="co-m-pane__body">
    <SectionHeading text="Webhooks" />
    <div className="co-table-container">
      <table className="table table--layout-fixed">
        <colgroup>
          <col className={tableColumnClasses[0]} />
          <col className={tableColumnClasses[1]} />
          <col className={tableColumnClasses[2]} />
          <col className={tableColumnClasses[3]} />
        </colgroup>
        <thead>
          <tr>
            <th className={tableColumnClasses[0]}>Type</th>
            <th className={tableColumnClasses[1]}>Webhook URL</th>
            <th className={tableColumnClasses[2]}>Secret</th>
            <th className={tableColumnClasses[3]}></th>
          </tr>
        </thead>
        <tbody>
          {_.map(webhooks, (trigger, i) => {
            const webhookURL = getWebhookURL(trigger);
            const secretReference = getSecretReference(trigger);
            return <tr key={i}>
              <td className={tableColumnClasses[0]}>{trigger.type}</td>
              <td className={tableColumnClasses[1]}>{webhookURL || '-'}</td>
              <td className={tableColumnClasses[2]}>{secretReference}</td>
              <td className={tableColumnClasses[3]}>
                <Button variant="link" type="button" onClick={() => copyWebhookToClipboard(trigger)}><PasteIcon />&nbsp;Copy URL with Secret</Button>
              </td>
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

export type WebhookTrigger = {
  type: string;
  [key: string]: any;
};


WebhookTriggers.displayName = 'WebhookTriggers';
