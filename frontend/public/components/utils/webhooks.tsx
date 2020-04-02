import * as React from 'react';
import * as _ from 'lodash-es';
import { Base64 } from 'js-base64';
import { PasteIcon } from '@patternfly/react-icons';
import { Button, AlertVariant } from '@patternfly/react-core';
import * as classNames from 'classnames';

import { K8sResourceKind, k8sGet } from '../../module/k8s';
import { ExpandableAlert } from './alerts';
import { SectionHeading } from './headings';
import { ResourceLink } from './resource-link';
import { useAccessReview } from './rbac';
import { SecretModel } from '../../models';
import { errorModal } from '../modals/error-modal';

const kubeAPIServerURL = window.SERVER_FLAGS.kubeAPIServerURL || 'https://<api-server>';
enum TriggerTypes {
  Bitbucket = 'Bitbucket',
  ConfigChange = 'ConfigChange',
  Generic = 'Generic',
  GitHub = 'GitHub',
  GitLab = 'GitLab',
  ImageChange = 'ImageChange',
}
const webhookTriggerTypes = new Set<TriggerTypes>([
  TriggerTypes.Bitbucket,
  TriggerTypes.Generic,
  TriggerTypes.GitHub,
  TriggerTypes.GitLab,
]);
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

export const WebhookTriggers: React.FC<WebhookTriggersProps> = (props) => {
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
  const [webhookSecrets, setWebhookSecrets] = React.useState<K8sResourceKind[]>([]);
  const [webhookTriggers, setWebhookTriggers] = React.useState<WebhookTrigger[]>([]);
  const [secretNames, setSecretNames] = React.useState<string[]>([]);
  const [secretErrors, setSecretErrors] = React.useState<string[]>([]);
  const [isLoaded, setLoaded] = React.useState(false);

  React.useEffect(() => {
    setWebhookTriggers((previousTriggers) => {
      const newTriggers = _.filter(triggers, ({ type }) => webhookTriggerTypes.has(type));
      return _.isEqual(previousTriggers, newTriggers) ? previousTriggers : newTriggers;
    });
  }, [triggers]);

  React.useEffect(() => {
    const newSecretNames: string[] = _.uniq(
      webhookTriggers.reduce((acc: string[], webhook: WebhookTrigger): string[] => {
        const triggerProperty = getTriggerProperty(webhook);
        const secretName = _.get(webhook, [triggerProperty, 'secretReference', 'name']);
        return secretName ? [...acc, secretName] : acc;
      }, []),
    );
    setSecretNames(newSecretNames);
  }, [webhookTriggers]);

  React.useEffect(() => {
    if (!canGetSecret) {
      return;
    }
    let errors: string[] = [];
    Promise.all(
      secretNames.map(
        (webhookName: string): Promise<K8sResourceKind> => {
          return k8sGet(SecretModel, webhookName, namespace).then(
            (secret) => secret,
            (error) => {
              errors = [...errors, `Error: ${error.message}`];
              return null;
            },
          );
        },
      ),
    ).then((secrets) => {
      setSecretErrors(errors);
      setWebhookSecrets(_.compact(secrets));
      setLoaded(true);
    });
  }, [secretNames, isLoaded, canGetSecret, namespace]);

  if (_.isEmpty(webhookTriggers)) {
    return null;
  }

  const getWebhookURL = (trigger: WebhookTrigger, secret?: string) => {
    const triggerProperty = getTriggerProperty(trigger);
    return `${kubeAPIServerURL}/apis/build.openshift.io/v1/namespaces/${namespace}/buildconfigs/${name}/webhooks/${
      secret ? secret : '<secret>'
    }/${triggerProperty}`;
  };

  const getSecretReference = (trigger: WebhookTrigger) => {
    const triggerProperty = getTriggerProperty(trigger);
    const secretName = _.get(trigger, [triggerProperty, 'secretReference', 'name']);
    if (!secretName) {
      return <span className="text-muted">No secret</span>;
    }
    const webhookSecret: K8sResourceKind = webhookSecrets.find(
      (secret: K8sResourceKind) => secret.metadata.name === secretName,
    );
    if (!webhookSecret) {
      return secretName;
    }
    return (
      <ResourceLink kind="Secret" name={secretName} namespace={namespace} title={secretName} />
    );
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
    const webhookSecret: K8sResourceKind = webhookSecrets.find(
      (secret: K8sResourceKind) => secret.metadata.name === secretName,
    );
    if (!_.has(webhookSecret, 'data.WebHookSecretKey')) {
      errorModal({
        error: `Secret referenced in the ${triggerProperty} webhook trigger does not contain 'WebHookSecretKey' key. Webhook trigger won’t work due to the invalid secret reference`,
      });
      return;
    }
    const webhookSecretValue = Base64.decode(webhookSecret.data.WebHookSecretKey);
    const url = getWebhookURL(trigger, webhookSecretValue);
    navigator.clipboard.writeText(url);
  };

  const getClipboardButton = (trigger: WebhookTrigger) => {
    const triggerProperty = getTriggerProperty(trigger);
    const plainSecret = _.get(trigger, [triggerProperty, 'secret']);
    const secretReference = _.get(trigger, [triggerProperty, 'secretReference', 'name']);
    const webhookSecret: K8sResourceKind = webhookSecrets.find(
      (secret: K8sResourceKind) => secret.metadata.name === secretReference,
    );
    return webhookSecret || plainSecret ? (
      <Button variant="link" type="button" onClick={() => copyWebhookToClipboard(trigger)}>
        <PasteIcon />
        &nbsp;Copy URL with Secret
      </Button>
    ) : null;
  };

  return (
    <div className="co-m-pane__body">
      {!_.isEmpty(secretErrors) && (
        <ExpandableAlert
          variant={AlertVariant.warning}
          alerts={_.map(secretErrors, (error, i) => (
            <div className="co-pre-line" key={i}>
              {error}
            </div>
          ))}
        />
      )}
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
              <th className={tableColumnClasses[3]} />
            </tr>
          </thead>
          <tbody>
            {_.map(webhookTriggers, (trigger, i) => {
              const webhookURL = getWebhookURL(trigger);
              const secretReference = getSecretReference(trigger);
              const clipboardButton = getClipboardButton(trigger);
              return (
                <tr key={i}>
                  <td className={tableColumnClasses[0]}>{trigger.type}</td>
                  <td className={tableColumnClasses[1]}>{webhookURL || '-'}</td>
                  <td className={tableColumnClasses[2]}>{secretReference}</td>
                  <td className={tableColumnClasses[3]}>{clipboardButton}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export type WebhookTriggersProps = {
  resource: K8sResourceKind;
};

export type WebhookTrigger = {
  type: string;
  [key: string]: any;
};

WebhookTriggers.displayName = 'WebhookTriggers';
