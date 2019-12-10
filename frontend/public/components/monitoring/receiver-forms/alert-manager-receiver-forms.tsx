import * as React from 'react';
import * as _ from 'lodash-es';
import { Helmet } from 'react-helmet';
import { ActionGroup, Button } from '@patternfly/react-core';
import { safeLoad } from 'js-yaml';
import * as classNames from 'classnames';

import {
  ButtonBar,
  Dropdown,
  Firehose,
  history,
  LoadError,
  LoadingBox,
  StatusBox,
} from '../../utils';
import {
  getAlertManagerConfig,
  patchAlertManagerConfig,
  receiverTypes,
} from '../alert-manager-utils';
import { K8sResourceKind } from '../../../module/k8s';
import {
  AlertManagerConfig,
  AlertManagerReceiver,
  AlertManagerRoute,
} from '../alert-manager-config';
import { RoutingLabelEditor } from './routing-labels-editor';
import * as PagerDutyForm from './pagerduty-receiver-form';
import * as WebhookForm from './webhook-receiver-form';
import * as EmailForm from './email-receiver-form';
import * as SlackForm from './slack-receiver-form';
import { coFetchJSON } from '../../../co-fetch';

export const equalOrEmpty = (formValue, globalValue) =>
  formValue === globalValue || _.isEmpty(formValue);
export const notEqualAndNotEmpty = (formValue, globalValue) =>
  formValue !== globalValue && !_.isEmpty(formValue);

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
const getReceiverRouteLabels = (receiver: AlertManagerReceiver, routes: AlertManagerRoute[]) => {
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
const createRoute = (receiver: AlertManagerReceiver, routeLabels) => {
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
const createReceiver = (globals, formValues, createReceiverConfig, receiverToEdit) => {
  const receiverConfig = createReceiverConfig(
    globals,
    formValues,
    receiverToEdit && receiverToEdit[formValues.receiverType]
      ? receiverToEdit[formValues.receiverType][0]
      : {},
  );
  return {
    name: formValues.receiverName,
    [formValues.receiverType]: [{ ...receiverConfig }],
  };
};

const subFormFactory = (receiverType) => {
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
      return WebhookForm;
  }
};

const useFormStore = (initialState) => {
  const [formValues, setFormValues] = React.useState(initialState);

  const handleChange = (event) => {
    setFormValues({
      ...formValues,
      [event.target.name]: event.target.value,
    });
  };

  return {
    formValues,
    setFormValues,
    handleChange,
  };
};

const getRouteLabelsForEditor = (isDefaultReceiver, receiverToEdit, allRoutes) => {
  let routeLabels = [];

  if (receiverToEdit) {
    const receiverRouteLabels = getReceiverRouteLabels(receiverToEdit, allRoutes);
    routeLabels = !_.isEmpty(receiverRouteLabels)
      ? routeLabels.concat(receiverRouteLabels)
      : routeLabels;
  }

  return !isDefaultReceiver && _.isEmpty(routeLabels)
    ? [{ name: '', value: '', isRegex: false }]
    : routeLabels;
};

const ReceiverBaseForm: React.FC<ReceiverBaseFormProps> = ({
  obj,
  titleVerb,
  saveButtonText,
  editReceiverNamed,
  alertManagerGlobals,
}) => {
  const secret: K8sResourceKind = obj; // Secret "alertmanager-main" which contains alertmanager.yaml config
  const [errorMsg, setErrorMsg] = React.useState();
  const [inProgress, setInProgress] = React.useState(false);
  let config: AlertManagerConfig;
  if (!errorMsg) {
    config = getAlertManagerConfig(secret, setErrorMsg);
  }
  if (!alertManagerGlobals || _.isEmpty(alertManagerGlobals)) {
    setErrorMsg('Could not find Alertmanager global parameters.');
  }
  const { route, global } = config || {};

  // alertManagerGlobals contains props not in global from alertmanager yaml config
  // default allGlobals to global props first, then alertManagerGlobals props
  const allGlobals = _.defaults({}, global, alertManagerGlobals);

  const INITIAL_STATE = {
    receiverName: '',
    receiverType: '',
    routeLabels: [],
  };
  _.assign(
    INITIAL_STATE,
    PagerDutyForm.getInitialValues(allGlobals, null),
    WebhookForm.getInitialValues(allGlobals, null),
    EmailForm.getInitialValues(allGlobals, null),
    SlackForm.getInitialValues(allGlobals, null),
  );

  let receiverToEdit: AlertManagerReceiver;
  if (editReceiverNamed) {
    receiverToEdit = _.find(_.get(config, 'receivers'), { name: editReceiverNamed });
    INITIAL_STATE.receiverName = receiverToEdit ? receiverToEdit.name : '';
    INITIAL_STATE.receiverType = _.find(_.keys(receiverToEdit), (key) =>
      _.includes(key, '_configs'),
    );
    if (!_.isEmpty(INITIAL_STATE.receiverType)) {
      const receiverConfig = _.get(receiverToEdit, `${INITIAL_STATE.receiverType}[0]`);
      _.assign(
        INITIAL_STATE,
        subFormFactory(INITIAL_STATE.receiverType).getInitialValues(allGlobals, receiverConfig),
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

  const { formValues, setFormValues, handleChange } = useFormStore(INITIAL_STATE);
  const SubForm = subFormFactory(formValues.receiverType);

  const isFormInvalid =
    _.isEmpty(formValues.receiverName) ||
    _.isEmpty(formValues.receiverType) ||
    SubForm.isFormInvalid(formValues);

  const save = (e) => {
    e.preventDefault();

    _.assign(config.global, SubForm.updateGlobals(allGlobals, formValues));

    // Update Receivers
    const newReceiver = createReceiver(
      allGlobals,
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

  return (
    <div className="co-m-pane__body co-m-pane__form">
      <Helmet>
        <title>{titleVerb} Receiver</title>
      </Helmet>
      <form className="co-m-pane__body-group" onSubmit={save}>
        <h1 className="co-m-pane__heading">
          {titleVerb} {receiverTypes[`${formValues.receiverType}`]} {isDefaultReceiver && 'Default'}{' '}
          Receiver
        </h1>
        <div className="form-group">
          <label className="control-label co-required">Receiver Name</label>
          <input
            className="pf-c-form-control"
            type="text"
            value={formValues.receiverName}
            onChange={handleChange}
            aria-describedby="receiver-name-help"
            name="receiverName"
            data-test-id="receiver-name"
            required
          />
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
            onChange={(e) => handleChange({ target: { name: 'receiverType', value: e } })}
          />
        </div>

        {formValues.receiverType && (
          <>
            <SubForm.Form
              globals={allGlobals}
              formValues={formValues}
              handleChange={handleChange}
            />
            <RoutingLabelEditor
              formValues={formValues}
              setFormValues={setFormValues}
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
              isDisabled={isFormInvalid as boolean}
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

export const SaveAsDefaultCheckbox = ({ formField, disabled, label, formValues, handleChange }) => {
  const saveAsDefaultLabelClass = classNames({ 'co-no-bold': disabled });
  return (
    <label className={saveAsDefaultLabelClass}>
      <input
        type="checkbox"
        name={formField}
        data-test-id="save-as-default"
        onChange={(e) =>
          handleChange({
            target: { name: `${formField}`, value: e.target.checked },
          })
        }
        checked={formValues[`${formField}`]}
        disabled={disabled}
      />
      &nbsp; {label}
    </label>
  );
};

const ReceiverWrapper: React.FC<ReceiverFormsWrapperProps> = React.memo(({ obj, ...props }) => {
  const { alertManagerBaseURL } = window.SERVER_FLAGS;
  const [alertManagerGlobals, setAlertManagerGlobals] = React.useState();
  const [errorMsg, setErrorMsg] = React.useState();

  React.useEffect(() => {
    if (!alertManagerBaseURL) {
      setErrorMsg(`Error alertManagerBaseURL not set`);
      return;
    }
    coFetchJSON(`${alertManagerBaseURL}/api/v2/status/`).then((data) => {
      const origAlertMngrConfigStr = _.get(data, 'config.original', {});
      if (_.isEmpty(origAlertMngrConfigStr)) {
        setErrorMsg('alertmanager.v2.status.config.original not found.');
      } else {
        let origAlertMngrConfig;
        try {
          origAlertMngrConfig = safeLoad(origAlertMngrConfigStr);
        } catch (e) {
          setErrorMsg(`could not convert alertmanager config.original yaml: ${e}`);
        }
        setAlertManagerGlobals(origAlertMngrConfig.global);
        setErrorMsg('');
      }
    });
  }, [alertManagerBaseURL]);

  if (errorMsg) {
    return (
      <LoadError
        message={errorMsg}
        label="Alertmanager Globals"
        className="loading-box loading-box__errored"
        canRetry={false}
      />
    );
  }

  return !alertManagerGlobals ? (
    <LoadingBox className="loading-box loading-box__loading" />
  ) : (
    <StatusBox {...obj}>
      <ReceiverBaseForm {...props} obj={obj.data} alertManagerGlobals={alertManagerGlobals} />
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
  alertManagerGlobals?: object;
};
