/* eslint-disable camelcase */
import * as React from 'react';
import * as _ from 'lodash-es';
import { Helmet } from 'react-helmet';
import { ActionGroup, Alert, Button, Tooltip } from '@patternfly/react-core';
import { safeLoad } from 'js-yaml';
import * as classNames from 'classnames';
import { BlueInfoCircleIcon } from '@console/shared/src';

import { ButtonBar, Dropdown, Firehose, history, StatusBox } from '../../utils';
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
    const receiverNames = config?.receivers
      .filter((receiver) => receiver.name !== editReceiverNamed)
      .map((receiver) => receiver.name);
    return receiverNames.includes(receiverName);
  };

  const { route, global } = config || {};

  // default globals to config.global props first, then alertmanagerGlobals
  const defaultGlobals = { ...alertmanagerGlobals, ...global };

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
  // if no default receiver defined or editing the default receiver
  const isDefaultReceiver = defaultReceiver === undefined || defaultReceiver === editReceiverNamed;

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

  return (
    <div className="co-m-pane__body co-m-pane__form">
      <Helmet>
        <title>{titleVerb} Receiver</title>
      </Helmet>
      <form className="co-m-pane__body-group" onSubmit={save}>
        <h1 className="co-m-pane__heading">
          {titleVerb} {receiverTypes[formValues.receiverType]} {isDefaultReceiver && 'Default'}{' '}
          Receiver
        </h1>
        {isDefaultReceiver && !formValues.receiverType && (
          <Alert
            isInline
            className="co-alert co-alert--scrollable"
            variant="info"
            title="Default Receiver"
          >
            <div className="co-pre-line">
              Because this is your first receiver, it will automatically receive all alerts from
              this cluster. You can route specific alerts to subsequent receivers that you create.
              You can also edit your default receiver at a later time.
            </div>
          </Alert>
        )}
        <div
          className={classNames('form-group', {
            'has-error': receiverNameAlreadyExist,
          })}
        >
          <label className="control-label co-required">Receiver Name</label>
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
                A receiver with that name already exists.
              </span>
            </span>
          )}
        </div>
        <div className="form-group co-m-pane__dropdown">
          <label className="control-label co-required">Receiver Type</label>
          <Dropdown
            title={'Select Receiver Type...'}
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
              Cancel
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
    <label className={saveAsDefaultLabelClass}>
      <input
        type="checkbox"
        name={formField}
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

const ReceiverWrapper: React.FC<ReceiverFormsWrapperProps> = React.memo(({ obj, ...props }) => {
  const { alertManagerBaseURL } = window.SERVER_FLAGS;
  const [alertmanagerGlobals, setAlertmanagerGlobals] = React.useState();
  const [loaded, setLoaded] = React.useState(false);
  const [loadError, setLoadError] = React.useState();

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
