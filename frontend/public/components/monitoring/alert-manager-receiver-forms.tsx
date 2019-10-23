import * as React from 'react';
import * as _ from 'lodash-es';

import {
  ButtonBar,
  Dropdown,
  ExternalLink,
  Firehose,
  history,
  SectionHeading,
  StatusBox,
} from '../utils';
import {
  getAlertManagerConfig,
  patchAlertManagerConfig,
  receiverTypes,
} from './alert-manager-utils';
import { K8sResourceKind } from '../../module/k8s';
import { ActionGroup, Button } from '@patternfly/react-core';
import { Helmet } from 'react-helmet';
import { RadioInput } from '../radio';
import { MinusCircleIcon, PlusCircleIcon } from '@patternfly/react-icons';
import { AlertManagerConfig, AlertManagerReceiver } from './alert-manager-config';

const PagerDutySubForm = ({ pagerDutyValues, setPagerDutyValues }) => {
  const updatePagerDutyValues = (key, value) => {
    _.set(pagerDutyValues, key, value);
    setPagerDutyValues(_.clone(pagerDutyValues));
  };

  return (
    <div className="co-m-pane__body--section-heading">
      <SectionHeading text="PagerDuty Configuration" />
      <div className="form-group">
        <label className="control-label">Integration Type</label>
        <div>
          <RadioInput
            title="Events API v2"
            name="integrationType_Events"
            id="integration-type-events"
            value="events"
            onChange={(e) => updatePagerDutyValues('integrationType', e.target.value)}
            checked={pagerDutyValues.integrationType === 'events'}
            inline
          />
          <RadioInput
            title="Prometheus"
            name="integrationType_Prometheus"
            id="integration-type-prometheus"
            value="prometheus"
            onChange={(e) => updatePagerDutyValues('integrationType', e.target.value)}
            checked={pagerDutyValues.integrationType === 'prometheus'}
            inline
          />
        </div>
      </div>
      <div className="form-group">
        <label className="control-label co-required">
          {pagerDutyValues.integrationType === 'events' ? 'Routing' : 'Service'} Key
        </label>
        <input
          className="pf-c-form-control"
          type="text"
          aria-describedby="integration-key-help"
          name="integrationKey"
          id="integration-key"
          value={pagerDutyValues.integrationKey}
          onChange={(e) => updatePagerDutyValues('integrationKey', e.target.value)}
        />
        <div className="help-block" id="integration-key-help">
          PagerDuty integration key
        </div>
      </div>
    </div>
  );
};

const WebhookSubForm = ({ webhookUrl, setWebhookUrl }) => (
  <div className="form-group">
    <label className="control-label co-required">URL</label>
    <input
      className="pf-c-form-control"
      type="text"
      aria-describedby="webhook-url-help"
      name="webhookUrl"
      id="webhook-url"
      value={webhookUrl}
      onChange={(e) => setWebhookUrl(e.target.value)}
    />
    <div className="help-block" id="webhook-url-help">
      The endpoint to send HTTP POST requests to
    </div>
  </div>
);

const RoutingLabels = ({ routeLabels, setRouteLabels, saveAsDefaultReceiver }) => {
  const setRouteLabel = (path: string, v: any): void => {
    const labels = _.clone(routeLabels);
    _.set(labels, path.split(', '), v);
    setRouteLabels(labels);
  };

  const onRoutingLabelChange = (path: string): ((e) => void) => {
    return (e) => setRouteLabel(path, e.target.value);
  };

  const onRoutingLabelRegexChange = (e, i: number): void => {
    setRouteLabel(`${i}, isRegex`, e.target.checked);
  };

  const addRoutingLabel = (): void => {
    setRouteLabel(`${routeLabels.length}`, {
      name: '',
      value: '',
      isRegex: false,
    });
  };

  const removeRoutingLabel = (i: number): void => {
    const labels = _.clone(routeLabels);
    labels.splice(i, 1);
    setRouteLabels(labels);
  };

  return (
    <div className="form-group">
      <label>Routing Labels</label>
      <p className="co-help-text">
        Firing alerts with labels that match all of these selectors will be sent to this receiver.
        Label values can be matched exactly or with a &nbsp;
        <ExternalLink href="https://github.com/google/re2/wiki/Syntax" text="regular expression" />.
      </p>
      <div className="row monitoring-grid-head text-secondary text-uppercase">
        <div className="col-xs-4">Label Name</div>
        <div className="col-xs-4">Label Value</div>
      </div>
      {_.map(routeLabels, (routeLabel, i) => (
        <div className="row form-group" key={i}>
          <div className="col-xs-4">
            <input
              type="text"
              className="pf-c-form-control"
              onChange={onRoutingLabelChange(`${i}, name`)}
              placeholder="Name"
              value={routeLabel.name}
              disabled={saveAsDefaultReceiver}
              required
            />
          </div>
          <div className="col-xs-4">
            <input
              type="text"
              className="pf-c-form-control"
              onChange={onRoutingLabelChange(`${i}, value`)}
              placeholder="Value"
              value={routeLabel.value}
              disabled={saveAsDefaultReceiver}
              required
            />
          </div>
          {!saveAsDefaultReceiver && (
            <React.Fragment>
              <div className="col-xs-3">
                <label className="co-no-bold">
                  <input
                    type="checkbox"
                    onChange={(e) => onRoutingLabelRegexChange(e, _.toNumber(i))}
                    checked={routeLabel.isRegex}
                  />
                  &nbsp; Regular Expression
                </label>
              </div>
              <div className="col-xs-1">
                <button
                  type="button"
                  className="btn btn-link btn-link--inherit-color"
                  onClick={() => removeRoutingLabel(_.toNumber(i))}
                  aria-label="Remove Route Label"
                  disabled={routeLabels.length <= 1}
                >
                  <MinusCircleIcon />
                </button>
              </div>
            </React.Fragment>
          )}
        </div>
      ))}
      {!saveAsDefaultReceiver && (
        <Button
          className="pf-m-link--align-left"
          onClick={addRoutingLabel}
          type="button"
          variant="link"
        >
          <PlusCircleIcon className="co-icon-space-r" />
          Add Label
        </Button>
      )}
    </div>
  );
};

const ReceiverBaseForm: React.FC<ReceiverBaseFormProps> = ({ obj, titleVerb, saveButtonText }) => {
  const secret: K8sResourceKind = obj; // Secret "alertmanager-main" which contains alertmanager.yaml config
  const [errorMsg, setErrorMsg] = React.useState('');
  const [inProgress, setInProgress] = React.useState(false);
  let config: AlertManagerConfig;
  if (!errorMsg) {
    config = getAlertManagerConfig(secret, setErrorMsg);
  }
  const [receiverName, setReceiverName] = React.useState('');
  const [receiverType, setReceiverType] = React.useState('');
  const [webhookUrl, setWebhookUrl] = React.useState('');
  const defaultPagerDutyValues = {
    integrationType: 'events',
    integrationKey: '',
  };
  const [pagerDutyValues, setPagerDutyValues] = React.useState(defaultPagerDutyValues);

  const { route } = config || {};
  const { receiver: defaultReceiver } = route || {};
  const saveAsDefaultReceiver = _.isUndefined(defaultReceiver);
  const defaultRouteLabels = saveAsDefaultReceiver
    ? [{ name: 'All (default receiver)', value: 'All (default receiver)', isRegex: false }]
    : [{ name: '', value: '', isRegex: false }];
  const [routeLabels, setRouteLabels] = React.useState(defaultRouteLabels);

  /**
   * Converts array of labels:
   * [
   *   {
   *     "name": "severity",
   *     "value": "warning",
   *     "isRegex": false
   *   },
   *   {
   *    "name": "cluster",
   *     "value": "myCluster",
   *     "isRegex": false
   *   }
   * ]
   * ...to single label object:
   * {
   *   "severity": "warning",
   *   "cluster": "myCluster"
   * }
   */
  const normalizeRouteLabels = (returnRegexMatches = false) => {
    const matches = _.filter(routeLabels, (routeLabel) =>
      returnRegexMatches ? routeLabel.isRegex : !routeLabel.isRegex,
    );
    const matchObj = _.map(matches, (label) => {
      return { [label.name]: label.value };
    });
    return _.assign({}, ...matchObj);
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
  const createRoute = (receiver: AlertManagerReceiver) => {
    const matchLabels = normalizeRouteLabels();
    const matchReLabels = normalizeRouteLabels(true);

    // construct new route object
    const newRoute = { receiver: receiver.name };
    if (!_.isEmpty(matchLabels)) {
      _.set(newRoute, 'match', matchLabels);
    }
    if (!_.isEmpty(matchReLabels)) {
      _.set(newRoute, 'match_re', matchReLabels);
    }
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
  const createReceiver = () => {
    const receiverConfigKey = `${receiverType}_configs`;
    let receiverConfig;
    switch (receiverType) {
      case 'pagerduty':
        // eslint-disable-next-line no-case-declarations
        const pagerDutyIntegrationKeyName = `${
          pagerDutyValues.integrationType === 'events' ? 'routing' : 'service'
        }_key`;
        receiverConfig = {
          [pagerDutyIntegrationKeyName]: pagerDutyValues.integrationKey,
        };
        break;
      case 'webhook':
        receiverConfig = { url: webhookUrl };
        break;
      default:
    }
    return {
      name: receiverName,
      [receiverConfigKey]: [{ ...receiverConfig }],
    };
  };

  const save = (e) => {
    e.preventDefault();

    // add new receiver to alert manager receivers
    const newReceiver = createReceiver();
    const receivers = _.get(config, 'receivers', []);
    receivers.push(newReceiver);
    _.set(config, 'receivers', receivers);

    // set as default or create new route
    if (saveAsDefaultReceiver) {
      _.set(route, 'receiver', newReceiver.name);
    } else if (!_.isEmpty(routeLabels)) {
      const routes = _.get(route, 'routes', []);
      const newRoute = createRoute(newReceiver);
      routes.push(newRoute);
      _.set(route, 'routes', routes);
    }

    setInProgress(true);
    patchAlertManagerConfig(secret, config).then(
      () => {
        setErrorMsg('');
        setInProgress(false);
        history.push('/monitoring/alertmanagerconfig');
      },
      (err) => {
        setErrorMsg(err.message);
        setInProgress(false);
      },
    );
  };

  const isFormInvalid =
    _.isEmpty(receiverName) ||
    _.isEmpty(receiverType) ||
    (receiverType === 'pagerduty' && _.isEmpty(pagerDutyValues.integrationKey)) ||
    (receiverType === 'webhook' && _.isEmpty(webhookUrl));

  return (
    <div className="co-m-pane__body">
      <Helmet>
        <title>{titleVerb} Receiver</title>
      </Helmet>
      <form className="co-m-pane__body-group co-m-pane__form" onSubmit={save}>
        <h1 className="co-m-pane__heading">Create {saveAsDefaultReceiver && 'Default'} Receiver</h1>
        <div className="form-group">
          <label className="control-label co-required">Receiver Name</label>
          <input
            className="pf-c-form-control"
            type="text"
            value={receiverName}
            onChange={(e) => setReceiverName(e.target.value)}
            aria-describedby="receiver-name-help"
            name="receiverName"
            id="receiver-name"
            required
          />
        </div>
        <div className="form-group co-m-pane__dropdown">
          <label className="control-label co-required">Receiver Type</label>
          <Dropdown
            title={'Select Receiver Type...'}
            items={receiverTypes}
            dropDownClassName="dropdown--full-width"
            id="receiver-type"
            selectedKey={receiverType}
            onChange={setReceiverType}
          />
        </div>

        {receiverType === 'pagerduty' && (
          <PagerDutySubForm
            pagerDutyValues={pagerDutyValues}
            setPagerDutyValues={setPagerDutyValues}
          />
        )}
        {receiverType === 'webhook' && (
          <WebhookSubForm webhookUrl={webhookUrl} setWebhookUrl={setWebhookUrl} />
        )}

        {receiverType && (
          <RoutingLabels
            routeLabels={routeLabels}
            setRouteLabels={setRouteLabels}
            saveAsDefaultReceiver={saveAsDefaultReceiver}
          />
        )}

        <ButtonBar errorMessage={errorMsg} inProgress={inProgress}>
          <ActionGroup className="pf-c-form">
            <Button type="submit" variant="primary" id="save-changes" isDisabled={isFormInvalid}>
              {saveButtonText}
            </Button>
            <Button type="button" variant="secondary" id="cancel" onClick={history.goBack}>
              Cancel
            </Button>
          </ActionGroup>
        </ButtonBar>
      </form>
    </div>
  );
};

const ReceiverWrapper: React.FC<ReceiverFormsWrapperProps> = React.memo(({ obj, ...props }) => {
  return (
    <StatusBox {...obj}>
      <ReceiverBaseForm {...props} obj={obj.data} />
    </StatusBox>
  );
});

export const CreateReceiver = () => (
  <Firehose
    resources={[
      {
        kind: 'Secret',
        name: 'alertmanager-main',
        namespace: 'openshift-monitoring',
        isList: false,
        prop: 'obj',
      },
    ]}
  >
    <ReceiverWrapper titleVerb="Create" saveButtonText="Create" />
  </Firehose>
);

type ReceiverFormsWrapperProps = {
  titleVerb: string;
  saveButtonText: string;
  obj?: {
    data?: K8sResourceKind;
    [key: string]: any;
  };
};

type ReceiverBaseFormProps = {
  obj?: K8sResourceKind;
  titleVerb: string;
  saveButtonText: string;
};
