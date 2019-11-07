import * as React from 'react';
import * as _ from 'lodash-es';
import { Helmet } from 'react-helmet';
import { ActionGroup, Button } from '@patternfly/react-core';
import { MinusCircleIcon, PlusCircleIcon } from '@patternfly/react-icons';

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
  getRouteLabelsForForm,
  createReceiver,
  createRoute,
  isDefaultReceiverLabel,
  addDefaultReceiverLabel,
  removeDefaultReceiverLabel,
} from './alert-manager-utils';
import { K8sResourceKind } from '../../module/k8s';
import { RadioInput } from '../radio';
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

// Label editor to edit, add or remove Routing Labels
const RoutingLabels = ({ routeLabels, setRouteLabels, showAddLabel }) => {
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
        <div className="col-xs-5">Name</div>
        <div className="col-xs-6">Value</div>
      </div>
      {_.map(routeLabels, (routeLabel, i) => {
        const isDefaultReceiverRouteLabel = isDefaultReceiverLabel(routeLabel);
        return (
          <div className="row form-group" key={i}>
            <div className="col-xs-10">
              <div className="row">
                <div className="col-xs-6 pairs-list__name-field">
                  <div className="form-group">
                    <input
                      type="text"
                      className="pf-c-form-control"
                      onChange={onRoutingLabelChange(`${i}, name`)}
                      placeholder="Name"
                      value={routeLabel.name}
                      disabled={isDefaultReceiverRouteLabel}
                      required
                    />
                  </div>
                </div>
                <div className="col-xs-6 pairs-list__value-field">
                  <div className="form-group">
                    <input
                      type="text"
                      className="pf-c-form-control"
                      onChange={onRoutingLabelChange(`${i}, value`)}
                      placeholder="Value"
                      value={routeLabel.value}
                      disabled={isDefaultReceiverRouteLabel}
                      required
                    />
                  </div>
                </div>
              </div>
              {!isDefaultReceiverRouteLabel && (
                <>
                  <div className="row">
                    <div className="col-xs-12 col-sm-12">
                      <div className="form-group">
                        <label className="co-no-bold">
                          <input
                            type="checkbox"
                            onChange={(e) => onRoutingLabelRegexChange(e, _.toNumber(i))}
                            checked={routeLabel.isRegex}
                          />
                          &nbsp; Regular Expression
                        </label>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
            {!isDefaultReceiverRouteLabel && (
              <>
                <div className="col-xs-2 pairs-list__action">
                  <Button
                    type="button"
                    onClick={() => removeRoutingLabel(_.toNumber(i))}
                    aria-label="Remove Route Label"
                    disabled={routeLabels.length <= 1}
                    variant="plain"
                  >
                    <MinusCircleIcon />
                  </Button>
                </div>
              </>
            )}
          </div>
        );
      })}
      {showAddLabel && (
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

const ReceiverBaseForm: React.FC<ReceiverBaseFormProps> = ({
  obj,
  titleVerb,
  saveButtonText,
  editReceiverNamed,
}) => {
  const secret: K8sResourceKind = obj; // Secret "alertmanager-main" which contains alertmanager.yaml config
  const [errorMsg, setErrorMsg] = React.useState('');
  const [inProgress, setInProgress] = React.useState(false);
  let config: AlertManagerConfig;
  if (!errorMsg) {
    config = getAlertManagerConfig(secret, setErrorMsg);
  }

  let initialReceiverName = '';
  let initialReceiverType = '';
  let initialPagerDutyValues = {
    integrationType: 'events', // 'Events API v2'
    integrationKey: '',
  };
  let initialWebhookUrl = '';

  let receiverToEdit: AlertManagerReceiver;
  if (editReceiverNamed) {
    receiverToEdit = _.find(_.get(config, 'receivers'), { name: editReceiverNamed });
    initialReceiverName = receiverToEdit ? receiverToEdit.name : '';
    initialReceiverType = _.find(_.keys(receiverToEdit), (key) => _.includes(key, '_configs'));
    if (initialReceiverType) {
      const receiverConfig = _.get(receiverToEdit, `${initialReceiverType}[0]`);
      switch (initialReceiverType) {
        case 'pagerduty_configs':
          initialPagerDutyValues = {
            integrationType: _.get(receiverConfig, 'routing_key') ? 'events' : 'prometheus',
            integrationKey:
              _.get(receiverConfig, 'routing_key') || _.get(receiverConfig, 'service_key'),
          };
          break;
        case 'webhook_configs':
          initialWebhookUrl = _.get(receiverConfig, 'url');
          break;
        default:
      }
    }
  }

  const [receiverName, setReceiverName] = React.useState(initialReceiverName);
  const [receiverType, setReceiverType] = React.useState(initialReceiverType);
  const [webhookUrl, setWebhookUrl] = React.useState(initialWebhookUrl);
  const [pagerDutyValues, setPagerDutyValues] = React.useState(initialPagerDutyValues);

  const { route } = config || {};
  const { receiver: defaultReceiver } = route || {}; // top level route.receiver is the default receiver for all alarms
  // if no default receiver defined or editing the default receiver
  const isDefaultReceiver = defaultReceiver === undefined || defaultReceiver === editReceiverNamed;

  let initialRouteLabels = [];

  if (isDefaultReceiver) {
    // add 'All (default receiver)' label
    initialRouteLabels = initialRouteLabels.concat(addDefaultReceiverLabel());
  }

  let showAddLabel = true;
  if (receiverToEdit) {
    const receiverRouteLabels = getRouteLabelsForForm(receiverToEdit, route.routes);
    if (!_.isEmpty(receiverRouteLabels)) {
      initialRouteLabels = initialRouteLabels.concat(receiverRouteLabels);
    } else if (isDefaultReceiver) {
      showAddLabel = false; // if default receiver doesn't have any routing labels, keep it that way per best practices
    }
  } else if (isDefaultReceiver) {
    showAddLabel = false; // creating a new default receiver
  }

  if (!isDefaultReceiver && _.isEmpty(initialRouteLabels)) {
    // add blank labels for (non-default) receiver with no prior routing labels
    initialRouteLabels = initialRouteLabels.concat([{ name: '', value: '', isRegex: false }]);
  }
  const [routeLabels, setRouteLabels] = React.useState(initialRouteLabels);

  const save = (e) => {
    e.preventDefault();

    // Update Receivers
    const newReceiver = createReceiver(receiverName, receiverType, pagerDutyValues, webhookUrl);
    _.update(config, 'receivers', (receivers = []) => {
      if (editReceiverNamed) {
        const index = _.findIndex(receivers, { name: editReceiverNamed });
        receivers.splice(index, 1, newReceiver);
      } else {
        receivers.push(newReceiver);
      }
      return receivers;
    });

    // Update Route & RouteLabels
    if (isDefaultReceiver) {
      _.set(route, 'receiver', newReceiver.name);
    }
    removeDefaultReceiverLabel(routeLabels);
    const newRoute = _.isEmpty(routeLabels) ? undefined : createRoute(newReceiver, routeLabels);
    _.update(route, 'routes', (routes = []) => {
      if (editReceiverNamed) {
        const index = _.findIndex(routes, { receiver: editReceiverNamed });
        if (index !== -1) {
          if (!newRoute) {
            // no routing labels for receiver, remove old route
            routes.splice(index, 1);
          } else {
            // update receiver's route with new route/labels
            routes.splice(index, 1, newRoute);
          }
        } else if (newRoute) {
          // receiver didn't have a prior route, so add new route
          routes.push(newRoute);
        }
      } else if (newRoute) {
        // add route for new receiver
        routes.push(newRoute);
      }
      return routes;
    });

    // Update 'alertmanager-main' Secret with new alertmanager.yaml configuration
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
    (receiverType === 'pagerduty_configs' && _.isEmpty(pagerDutyValues.integrationKey)) ||
    (receiverType === 'webhook_configs' && _.isEmpty(webhookUrl));

  return (
    <div className="co-m-pane__body co-m-pane__form">
      <Helmet>
        <title>{titleVerb} Receiver</title>
      </Helmet>
      <form className="co-m-pane__body-group" onSubmit={save}>
        <h1 className="co-m-pane__heading">
          {titleVerb} {isDefaultReceiver && 'Default'} Receiver
        </h1>
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

        {receiverType === 'pagerduty_configs' && (
          <PagerDutySubForm
            pagerDutyValues={pagerDutyValues}
            setPagerDutyValues={setPagerDutyValues}
          />
        )}
        {receiverType === 'webhook_configs' && (
          <WebhookSubForm webhookUrl={webhookUrl} setWebhookUrl={setWebhookUrl} />
        )}

        {receiverType && (
          <RoutingLabels
            routeLabels={routeLabels}
            setRouteLabels={setRouteLabels}
            showAddLabel={showAddLabel}
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

const resources = [
  {
    kind: 'Secret',
    name: 'alertmanager-main',
    namespace: 'openshift-monitoring',
    isList: false,
    prop: 'obj',
  },
];

export const CreateReceiver = () => (
  <Firehose resources={resources}>
    <ReceiverWrapper titleVerb="Create" saveButtonText="Create" />
  </Firehose>
);

export const EditReceiver = ({ match: { params } }) => (
  <Firehose resources={resources}>
    <ReceiverWrapper titleVerb="Edit" saveButtonText="Save" editReceiverNamed={params.name} />
  </Firehose>
);

type ReceiverFormsWrapperProps = {
  titleVerb: string;
  saveButtonText: string;
  obj?: {
    data?: K8sResourceKind;
    [key: string]: any;
  };
  editReceiverNamed?: string;
};

type ReceiverBaseFormProps = {
  obj?: K8sResourceKind;
  titleVerb: string;
  saveButtonText: string;
  editReceiverNamed?: string;
};
