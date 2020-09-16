/* eslint-disable camelcase */
import * as React from 'react';
import * as _ from 'lodash-es';
import { Helmet } from 'react-helmet';
import { useTranslation } from 'react-i18next';
import { ActionGroup, Alert, Button, Tooltip } from '@patternfly/react-core';
import { safeLoad } from 'js-yaml';
import * as classNames from 'classnames';

import { BlueInfoCircleIcon, APIError } from '@console/shared';
import { ButtonBar } from '../../utils/button-bar';
import { Dropdown } from '../../utils/dropdown';
import { Firehose } from '../../utils/firehose';
import { history } from '../../utils/router';
import { StatusBox } from '../../utils/status-box';
import {
  getAlertmanagerConfig,
  patchAlertmanagerConfig,
  receiverTypes,
} from '../alert-manager-utils';
import { K8sResourceKind } from '../../../module/k8s';
import {
  AlertmanagerConfig,
  AlertmanagerReceiver,
  AlertmanagerRoute,
  InitialReceivers,
} from '../alert-manager-config';
import { RoutingLabelEditor } from './routing-labels-editor';
import * as PagerDutyForm from './pagerduty-receiver-form';
import * as WebhookForm from './webhook-receiver-form';
import * as EmailForm from './email-receiver-form';
import * as SlackForm from './slack-receiver-form';
import { coFetchJSON } from '../../../co-fetch';

/**
 * Converts routes of a specific Receiver:
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
 * ...to array of labels for Routing Labels Editor component
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
const convertReceiverRoutesToEditorLabels = (
  receiver: AlertmanagerReceiver,
  routes: AlertmanagerRoute[],
): RouteEditorLabel[] => {
  if (!receiver) {
    return [];
  }

  const routesOfReceiver = _.find(
    routes,
    (aRoute: AlertmanagerRoute) => aRoute.receiver === receiver.name,
  );
  const matches = _.map(routesOfReceiver?.match || {}, (v, k) => {
    return { name: k, value: v, isRegex: false };
  });
  const regexMatches = _.map(routesOfReceiver?.match_re || {}, (v, k) => {
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
const createRoute = (
  receiver: AlertmanagerReceiver,
  routeLabels: RouteEditorLabel[],
): AlertmanagerRoute => {
  return _.reduce(
    routeLabels,
    (acc, label) => {
      _.set(acc, [label.isRegex ? 'match_re' : 'match', label.name], label.value);
      return acc;
    },
    { receiver: receiver.name },
  );
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
const createReceiver = (
  globals,
  formValues,
  createReceiverConfig: Function,
  receiverToEdit: AlertmanagerReceiver,
): AlertmanagerReceiver => {
  const receiverConfig = createReceiverConfig(
    globals,
    formValues,
    receiverToEdit && receiverToEdit[formValues.receiverType]
      ? receiverToEdit[formValues.receiverType][0] // pass in receiver config if editing existing receiver
      : {},
  );
  return {
    name: formValues.receiverName,
    [formValues.receiverType]: [{ ...receiverConfig }],
  };
};

const subformFactory = (receiverType: string) => {
  switch (receiverType) {
    case 'pagerduty_configs':
      return PagerDutyForm;
    case 'webhook_configs':
      return WebhookForm;
    case 'email_configs':
      return EmailForm;
    case 'slack_configs':
      return SlackForm;
    default:
      return null;
  }
};

const formReducer = (formValues: FormState, action: FormAction): FormState => {
  if (action.type === 'setFormValues') {
    return {
      ...formValues,
      ...action.payload,
    };
  }
  // eslint-disable-next-line no-console
  console.error('Unrecognized Alertmanager form reducer action', action);
  return formValues;
};

const getRouteLabelsForEditor = (
  isDefaultReceiver: boolean,
  receiverToEdit: AlertmanagerReceiver,
  allRoutes: AlertmanagerRoute[],
): RouteEditorLabel[] => {
  const routeLabels = convertReceiverRoutesToEditorLabels(receiverToEdit, allRoutes);
  return !isDefaultReceiver && _.isEmpty(routeLabels)
    ? [{ name: '', value: '', isRegex: false }]
    : routeLabels;
};

const AlertMsg: React.FC<AlertMsgProps> = ({ type }) => {
  const { t } = useTranslation();
  switch (type) {
    case InitialReceivers.Default:
      return t(
        'alert-manager-receiver-forms~Your default receiver will automatically receive all alerts from this cluster that are not caught by other receivers first.',
      );
    case InitialReceivers.Critical:
      return t(
        'alert-manager-receiver-forms~The routing labels for this receiver are configured to capture critical alerts.  Finish setting up this receiver by selecting a "Receiver Type" to choose a destination for these alerts.  If this receiver is deleted, critical alerts will go to the default receiver instead.',
      );
    case InitialReceivers.Watchdog:
      return t(
        'alert-manager-receiver-forms~The Watchdog alert fires constantly to confirm that your alerting stack is functioning correctly. This receiver is configured to prevent it from creating unnecessary notifications. You can edit this receiver if you plan to use the information that Watchdog provides, otherwise this receiver should remain in its current state with no set receiver type.',
      );
    default:
      return t('alert-manager-receiver-forms~unknown receiver type'); // should never get here
  }
};

const ReceiverInfoTip: React.FC<ReceiverInfoTipProps> = ({ type }) => {
  const { t } = useTranslation();
  return (
    <Alert
      isInline
      className="co-alert co-alert--scrollable"
      variant="info"
      title={`${type} ${t('alert-manager-receiver-forms~Receiver')}`}
    >
      <div className="co-pre-line">
        <AlertMsg type={type} />
      </div>
    </Alert>
  );
};

const ReceiverBaseForm: React.FC<ReceiverBaseFormProps> = ({
  obj: secret, // Secret "alertmanager-main" which contains alertmanager.yaml config
  titleVerb,
  saveButtonText,
  editReceiverNamed,
  alertmanagerGlobals, // contains default props not in alertmanager.yaml's config.global
}) => {
  const [errorMsg, setErrorMsg] = React.useState<string>();
  const [inProgress, setInProgress] = React.useState<boolean>(false);
  let config: AlertmanagerConfig;
  if (!errorMsg) {
    config = getAlertmanagerConfig(secret, setErrorMsg);
  }

  const doesReceiverNameAlreadyExist = (receiverName: string): boolean => {
    if (!config?.receivers) {
      return false;
    }
    const receiverNames = config.receivers
      .filter((receiver) => receiver.name !== editReceiverNamed)
      .map((receiver) => receiver.name);
    return receiverNames.includes(receiverName);
  };

  const { route, global } = config || {};

  // there is no api to get default values for these adv. config props
  const advancedConfigGlobals = {
    ['pagerduty_send_resolved']: true,
    ['pagerduty_client']: '{{ template "pagerduty.default.client" . }}',
    ['pagerduty_client_url']: '{{ template "pagerduty.default.clientURL" . }}',
    ['pagerduty_description']: '{{ template "pagerduty.default.description" .}}',
    ['pagerduty_severity']: 'error',
    ['email_send_resolved']: false,
    ['email_html']: '{{ template "email.default.html" . }}',
    ['slack_send_resolved']: false,
    ['slack_username']: '{{ template "slack.default.username" . }}',
    ['slack_icon_emoji']: '{{ template "slack.default.iconemoji" .}}',
    ['slack_icon_url']: '{{ template "slack.default.iconurl" .}}',
    ['slack_link_names']: false,
    ['webhook_send_resolved']: true,
  };

  // default globals to config.global props first, then alertmanagerGlobals
  const defaultGlobals = { ...alertmanagerGlobals, ...global, ...advancedConfigGlobals };

  const INITIAL_STATE = {
    receiverName: '',
    receiverType: '',
    routeLabels: [],
    ...PagerDutyForm.getInitialValues(defaultGlobals, null),
    ...WebhookForm.getInitialValues(defaultGlobals, null),
    ...EmailForm.getInitialValues(defaultGlobals, null),
    ...SlackForm.getInitialValues(defaultGlobals, null),
  };

  let receiverToEdit: AlertmanagerReceiver;
  if (editReceiverNamed) {
    receiverToEdit = _.find(_.get(config, 'receivers'), { name: editReceiverNamed });
    INITIAL_STATE.receiverName = receiverToEdit ? receiverToEdit.name : '';
    INITIAL_STATE.receiverType = _.find(_.keys(receiverToEdit), (key) =>
      _.endsWith(key, '_configs'),
    );
    if (!_.isEmpty(INITIAL_STATE.receiverType)) {
      const receiverConfig = receiverToEdit?.[INITIAL_STATE.receiverType]?.[0];
      _.assign(
        INITIAL_STATE,
        subformFactory(INITIAL_STATE.receiverType).getInitialValues(defaultGlobals, receiverConfig),
      );
    }
  }

  const { receiver: defaultReceiver } = route || {}; // top level route.receiver is the default receiver for all alarms
  // if default receiver name defined but no receiver exists with that name, or editing the default receiver,
  const isDefaultReceiver = defaultReceiver
    ? _.isEmpty(config?.receivers?.filter((receiver) => receiver.name === defaultReceiver)) ||
      defaultReceiver === editReceiverNamed
    : true; // defaultReceiver (the name stored in config.routes.receiver) is not defined, so this should be the default receiver

  INITIAL_STATE.routeLabels = getRouteLabelsForEditor(
    isDefaultReceiver,
    receiverToEdit,
    route.routes,
  );

  const [formValues, dispatchFormChange] = React.useReducer(formReducer, INITIAL_STATE);
  const SubForm = subformFactory(formValues.receiverType);

  const receiverNameAlreadyExist = doesReceiverNameAlreadyExist(formValues.receiverName);
  const isFormInvalid: boolean =
    !formValues.receiverName ||
    receiverNameAlreadyExist ||
    !formValues.receiverType ||
    SubForm.isFormInvalid(formValues) ||
    !_.isEmpty(formValues.routeLabelFieldErrors) ||
    formValues.routeLabelDuplicateNamesError ||
    (!isDefaultReceiver &&
      formValues.routeLabels.length === 1 &&
      (formValues.routeLabels[0].name === '' || formValues.routeLabels[0].value === ''));

  const save = (e) => {
    e.preventDefault();

    // Update Global params
    _.assign(config.global, SubForm.updateGlobals(defaultGlobals, formValues));

    // Update Receivers
    const newReceiver = createReceiver(
      defaultGlobals,
      formValues,
      SubForm.createReceiverConfig,
      receiverToEdit,
    );
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

    const newRoute = _.isEmpty(formValues.routeLabels)
      ? undefined
      : createRoute(newReceiver, formValues.routeLabels);
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
    patchAlertmanagerConfig(secret, config).then(
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
  const { t } = useTranslation();
  const receiverTypeLabel = formValues.receiverType
    ? t('alert-manager-receiver-forms~{{receiverTypeLabel}}', {
        receiverTypeLabel: receiverTypes[formValues.receiverType],
      })
    : null;
  const defaultString = isDefaultReceiver ? t('alert-manager-receiver-forms~Default') : null;

  return (
    <div className="co-m-pane__body co-m-pane__form">
      <Helmet>
        <title>{t('alert-manager-receiver-forms~{{titleVerb}} Receiver', { titleVerb })}</title>
      </Helmet>
      <form className="co-m-pane__body-group" onSubmit={save}>
        <h1 className="co-m-pane__heading">
          {t(
            'alert-manager-receiver-forms~{{titleVerb}} {{receiverTypeLabel}} {{defaultString}} Receiver',
            {
              titleVerb,
              receiverTypeLabel,
              defaultString,
            },
          )}
        </h1>
        {isDefaultReceiver && <ReceiverInfoTip type={InitialReceivers.Default} />}
        {formValues.receiverName === 'Critical' && !formValues.receiverType && (
          <ReceiverInfoTip type={InitialReceivers.Critical} />
        )}
        {formValues.receiverName === 'Watchdog' && !formValues.receiverType && (
          <ReceiverInfoTip type={InitialReceivers.Watchdog} />
        )}
        <div
          className={classNames('form-group', {
            'has-error': receiverNameAlreadyExist,
          })}
        >
          <label className="control-label co-required">
            {t('alert-manager-receiver-forms~Receiver name')}
          </label>
          <input
            className="pf-c-form-control"
            type="text"
            value={formValues.receiverName}
            onChange={(e) =>
              dispatchFormChange({
                type: 'setFormValues',
                payload: { receiverName: e.target.value },
              })
            }
            aria-describedby="receiver-name-help"
            name="receiverName"
            data-test-id="receiver-name"
            required
          />
          {receiverNameAlreadyExist && (
            <span className="help-block">
              <span data-test-id="receiver-name-already-exists-error">
                {t('alert-manager-receiver-forms~A receiver with that name already exists.')}
              </span>
            </span>
          )}
        </div>
        <div className="form-group co-m-pane__dropdown">
          <label className="control-label co-required">
            {t('alert-manager-receiver-forms~Receiver type')}
          </label>
          <Dropdown
            title="Select receiver type..."
            name="receiverType"
            items={receiverTypes}
            dropDownClassName="dropdown--full-width"
            data-test-id="receiver-type"
            selectedKey={formValues.receiverType}
            onChange={(receiverType) =>
              dispatchFormChange({
                type: 'setFormValues',
                payload: {
                  receiverType,
                },
              })
            }
          />
        </div>

        {formValues.receiverType && (
          <>
            <SubForm.Form
              globals={defaultGlobals}
              formValues={formValues}
              dispatchFormChange={dispatchFormChange}
            />
            <RoutingLabelEditor
              formValues={formValues}
              dispatchFormChange={dispatchFormChange}
              isDefaultReceiver={isDefaultReceiver}
            />
          </>
        )}

        <ButtonBar errorMessage={errorMsg} inProgress={inProgress}>
          <ActionGroup className="pf-c-form">
            <Button
              type="submit"
              variant="primary"
              data-test-id="save-changes"
              isDisabled={isFormInvalid}
            >
              {saveButtonText}
            </Button>
            <Button
              type="button"
              variant="secondary"
              data-test-id="cancel"
              onClick={history.goBack}
            >
              {t('public~Cancel')}
            </Button>
          </ActionGroup>
        </ButtonBar>
      </form>
    </div>
  );
};

export const SaveAsDefaultCheckbox: React.FC<SaveAsDefaultCheckboxProps> = ({
  formField,
  disabled,
  label,
  formValues,
  dispatchFormChange,
  tooltip,
}) => {
  const saveAsDefaultLabelClass = classNames('checkbox', { 'co-no-bold': disabled });
  return (
    <label className={saveAsDefaultLabelClass} htmlFor={formField}>
      <input
        type="checkbox"
        id={formField}
        data-test-id="save-as-default"
        onChange={(e) =>
          dispatchFormChange({
            type: 'setFormValues',
            payload: { [formField]: e.target.checked },
          })
        }
        checked={formValues[formField]}
        aria-checked={formValues[formField]}
        disabled={disabled}
        aria-disabled={disabled}
      />
      <span className="co-alert-manager-config__save-as-default-label">{label}</span>
      <Tooltip content={<p>{tooltip}</p>}>
        <BlueInfoCircleIcon />
      </Tooltip>
    </label>
  );
};

export const SendResolvedAlertsCheckbox = ({ formField, formValues, dispatchFormChange }) => {
  const { t } = useTranslation();
  return (
    <div className="checkbox">
      <label className="control-label" htmlFor={formField}>
        <input
          type="checkbox"
          id={formField}
          data-test-id="send-resolved-alerts"
          onChange={(e) =>
            dispatchFormChange({
              type: 'setFormValues',
              payload: { [formField]: e.target.checked },
            })
          }
          checked={formValues[formField]}
          aria-checked={formValues[formField]}
        />
        {t('alert-manager-receiver-forms~Send resolved alerts to this receiver?')}
      </label>
    </div>
  );
};

const ReceiverWrapper: React.FC<ReceiverFormsWrapperProps> = React.memo(({ obj, ...props }) => {
  const { alertManagerBaseURL } = window.SERVER_FLAGS;
  const [alertmanagerGlobals, setAlertmanagerGlobals] = React.useState();
  const [loaded, setLoaded] = React.useState(false);
  const [loadError, setLoadError] = React.useState<APIError>();

  React.useEffect(() => {
    if (!alertManagerBaseURL) {
      setLoadError({ message: `Error alertManagerBaseURL not set` });
      return;
    }
    coFetchJSON(`${alertManagerBaseURL}/api/v2/status/`)
      .then((data) => {
        const originalAlertmanagerConfigJSON = data?.config?.original;
        if (_.isEmpty(originalAlertmanagerConfigJSON)) {
          setLoadError({ message: 'alertmanager.v2.status.config.original not found.' });
        } else {
          try {
            const { global } = safeLoad(originalAlertmanagerConfigJSON);
            setAlertmanagerGlobals(global);
            setLoaded(true);
          } catch (error) {
            setLoadError({
              message: `Error parsing Alertmanager config.original: ${error.message ||
                'invalid YAML'}`,
            });
          }
        }
      })
      .catch((e) =>
        setLoadError({
          message: `Error loading ${alertManagerBaseURL}/api/v2/status/: ${e.message}`,
        }),
      );
  }, [alertManagerBaseURL]);

  return (
    <StatusBox {...obj} label="Alertmanager Globals" loaded={loaded} loadError={loadError}>
      <ReceiverBaseForm {...props} obj={obj.data} alertmanagerGlobals={alertmanagerGlobals} />
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

export const CreateReceiver = () => {
  const { t } = useTranslation();
  return (
    <Firehose resources={resources}>
      <ReceiverWrapper titleVerb={t('public~Create')} saveButtonText={t('public~Create')} />
    </Firehose>
  );
};

export const EditReceiver = ({ match: { params } }) => {
  const { t } = useTranslation();
  return (
    <Firehose resources={resources}>
      <ReceiverWrapper
        titleVerb={t('public~Edit')}
        saveButtonText={t('public~Save')}
        editReceiverNamed={params.name}
      />
    </Firehose>
  );
};

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
  alertmanagerGlobals?: { [key: string]: any };
};

export type RouteEditorLabel = {
  name: string;
  value: string;
  isRegex: boolean;
};

type FormAction = {
  type: 'setFormValues';
  payload: {
    [key: string]: string;
  };
};

type FormState = {
  receiverType: string;
  routeLabels: any[];
  [key: string]: string | any[] | any;
};

export type FormProps = {
  globals: { [key: string]: any };
  formValues: { [key: string]: any };
  dispatchFormChange: Function;
};

type SaveAsDefaultCheckboxProps = {
  formField: string;
  disabled: boolean;
  label: string;
  formValues: { [key: string]: any };
  dispatchFormChange: Function;
  tooltip: string;
};

type ReceiverInfoTipProps = {
  type: InitialReceivers;
};

type AlertMsgProps = {
  type: string;
};
