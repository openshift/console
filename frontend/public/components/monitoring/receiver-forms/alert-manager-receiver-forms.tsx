/* eslint-disable camelcase, tsdoc/syntax */
import * as _ from 'lodash-es';
import { FC, memo, useEffect, useReducer, useState, Ref } from 'react';
import { DocumentTitle } from '@console/shared/src/components/document-title/DocumentTitle';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom-v5-compat';
import {
  ActionGroup,
  Alert,
  Button,
  Form,
  FormGroup,
  FormHelperText,
  HelperText,
  HelperTextItem,
  MenuToggle,
  MenuToggleElement,
  Select,
  SelectOption,
  SelectProps,
  TextInput,
} from '@patternfly/react-core';
import { ExclamationCircleIcon } from '@patternfly/react-icons';
import { safeLoad } from 'js-yaml';

import { APIError } from '@console/shared/src/types/resource';
import PaneBody from '@console/shared/src/components/layout/PaneBody';
import { ButtonBar } from '../../utils/button-bar';
import { Firehose } from '../../utils/firehose';
import { StatusBox } from '../../utils/status-box';
import {
  getAlertmanagerConfig,
  patchAlertmanagerConfig,
  receiverTypes,
} from '../alertmanager/alertmanager-utils';
import { K8sResourceKind } from '../../../module/k8s';
import {
  AlertmanagerConfig,
  AlertmanagerReceiver,
  AlertmanagerRoute,
  InitialReceivers,
} from '../alertmanager/alertmanager-config';
import { RoutingLabelEditor } from './routing-labels-editor';
import * as PagerDutyForm from './pagerduty-receiver-form';
import * as WebhookForm from './webhook-receiver-form';
import * as EmailForm from './email-receiver-form';
import * as SlackForm from './slack-receiver-form';
import { coFetchJSON } from '../../../co-fetch';
import { PageHeading } from '@console/shared/src/components/heading/PageHeading';

/**
 * Converts deprecated route match and match_re:
 * {
 *   match: {
 *     severity: "warning",
 *     cluster: "myCluster"
 *   },
 *   match_re: {
 *    service: "$foobar"
 *  }
};
 * ...to array of matchers for Routing Labels Editor component
 * Ex: ["severity = warning", "cluster = myCluster", "service =~ $foobar"]
 */
const convertDeprecatedReceiverRoutesMatchesToMatchers = (
  receiverRoutes: AlertmanagerRoute,
): string[] => {
  const matches = _.map(receiverRoutes?.match || {}, (v, k) => {
    return `${k} = ${v}`;
  });
  const regexMatches = _.map(receiverRoutes?.match_re || {}, (v, k) => {
    return `${k} =~ ${v}`;
  });
  return [...matches, ...regexMatches];
};

/**
 * Returns new Route object
 * Ex:
 * {
 *   receiver: myNewReceiver,
 *   matchers: ["severity = warning"]
 * }
 */
const createRoute = (receiver: AlertmanagerReceiver, routeLabels: string[]): AlertmanagerRoute => {
  return {
    receiver: receiver.name,
    matchers: routeLabels,
  };
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
): string[] => {
  const receiverRoutes = _.find(
    allRoutes,
    (aRoute: AlertmanagerRoute) => aRoute.receiver === receiverToEdit?.name,
  );
  const convertedRouteLabels = convertDeprecatedReceiverRoutesMatchesToMatchers(receiverRoutes);
  const routeLabels = [...(convertedRouteLabels ?? []), ...(receiverRoutes?.matchers ?? [])];
  return !isDefaultReceiver && _.isEmpty(routeLabels) ? [''] : routeLabels;
};

const AlertMsg: FC<AlertMsgProps> = ({ type }) => {
  const { t } = useTranslation();
  switch (type) {
    case InitialReceivers.Default:
      return t(
        'public~Your default receiver will automatically receive all alerts from this cluster that are not caught by other receivers first.',
      );
    case InitialReceivers.Critical:
      return t(
        'public~The routing labels for this receiver are configured to capture critical alerts. Finish setting up this receiver by selecting a "Receiver Type" to choose a destination for these alerts. If this receiver is deleted, critical alerts will go to the default receiver instead.',
      );
    case InitialReceivers.Watchdog:
      return t(
        'public~The Watchdog alert fires constantly to confirm that your alerting stack is functioning correctly. This receiver is configured to prevent it from creating unnecessary notifications. You can edit this receiver if you plan to use the information that Watchdog provides, otherwise this receiver should remain in its current state with no set receiver type.',
      );
    default:
      return t('public~unknown receiver type'); // should never get here
  }
};

const ReceiverInfoTip: FC<ReceiverInfoTipProps> = ({ type }) => {
  const { t } = useTranslation();
  return (
    <Alert isInline variant="info" title={`${type} ${t('public~Receiver')}`}>
      <div className="co-pre-line">
        <AlertMsg type={type} />
      </div>
    </Alert>
  );
};

const ReceiverBaseForm: FC<ReceiverBaseFormProps> = ({
  obj: secret, // Secret "alertmanager-main" which contains alertmanager.yaml config
  titleVerb,
  saveButtonText,
  editReceiverNamed,
  alertmanagerGlobals, // contains default props not in alertmanager.yaml's config.global
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [saveErrorMsg, setSaveErrorMsg] = useState<string>();
  const [inProgress, setInProgress] = useState<boolean>(false);
  const { config, errorMessage: loadErrorMsg } = getAlertmanagerConfig(secret);

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
    ['slack_title']: '{{ template "slack.default.title" .}}',
    ['slack_text']: '{{ template "slack.default.text" .}}',
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
    : true; // defaultReceiver (the name stored in config.route.receiver) is not defined, so this should be the default receiver

  INITIAL_STATE.routeLabels = getRouteLabelsForEditor(
    isDefaultReceiver,
    receiverToEdit,
    route?.routes ?? [],
  );

  const [formValues, dispatchFormChange] = useReducer(formReducer, INITIAL_STATE);
  const [isTypeOpen, setIsTypeOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<string>(
    receiverTypes[formValues.receiverType] ?? t('public~Select receiver type...'),
  );

  const onTypeToggleClick = () => {
    setIsTypeOpen(!isTypeOpen);
  };

  const onTypeSelect: SelectProps['onSelect'] = (_e, value: string) => {
    setSelectedType(value);
    setIsTypeOpen(false);
    dispatchFormChange({
      type: 'setFormValues',
      payload: {
        receiverType: Object.keys(receiverTypes).find((key) => receiverTypes[key] === value),
      },
    });
  };

  const typeToggle = (toggleRef: Ref<MenuToggleElement>) => (
    <MenuToggle
      ref={toggleRef}
      onClick={onTypeToggleClick}
      isExpanded={isTypeOpen}
      isFullWidth
      data-test="receiver-type"
    >
      {selectedType}
    </MenuToggle>
  );
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
    const updateConfig: AlertmanagerConfig = _.isObject(config)
      ? _.cloneDeep(config)
      : {
          global: {},
          route: {},
          receivers: [],
        };

    // Update Global params
    _.assign(updateConfig.global, SubForm.updateGlobals(defaultGlobals, formValues));

    // Update Receivers
    const newReceiver = createReceiver(
      defaultGlobals,
      formValues,
      SubForm.createReceiverConfig,
      receiverToEdit,
    );
    _.update(updateConfig, 'receivers', (receivers = []) => {
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
      _.set(updateConfig, 'route.receiver', newReceiver.name);
    }

    const newRoute = _.isEmpty(formValues.routeLabels)
      ? undefined
      : createRoute(newReceiver, formValues.routeLabels);
    _.update(updateConfig, 'route.routes', (routes = []) => {
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
    patchAlertmanagerConfig(secret, updateConfig).then(
      () => {
        setSaveErrorMsg('');
        setInProgress(false);
        navigate('/settings/cluster/alertmanagerconfig');
      },
      (err) => {
        setSaveErrorMsg(err.message);
        setInProgress(false);
      },
    );
  };
  const receiverTypeLabel = formValues.receiverType
    ? t('public~{{receiverTypeLabel}}', {
        receiverTypeLabel: receiverTypes[formValues.receiverType],
      })
    : null;
  const defaultString = isDefaultReceiver ? t('public~Default') : null;

  return (
    <>
      <DocumentTitle>{t('public~{{titleVerb}} Receiver', { titleVerb })}</DocumentTitle>
      <PageHeading
        title={t('public~{{titleVerb}} {{receiverTypeLabel}} {{defaultString}} Receiver', {
          titleVerb,
          receiverTypeLabel,
          defaultString,
        })}
      />
      <PaneBody>
        <Form onSubmit={save} isWidthLimited>
          {isDefaultReceiver && <ReceiverInfoTip type={InitialReceivers.Default} />}
          {formValues.receiverName === 'Critical' && !formValues.receiverType && (
            <ReceiverInfoTip type={InitialReceivers.Critical} />
          )}
          {formValues.receiverName === 'Watchdog' && !formValues.receiverType && (
            <ReceiverInfoTip type={InitialReceivers.Watchdog} />
          )}
          <FormGroup label={t('public~Receiver name')} fieldId="receiver-name" isRequired>
            <TextInput
              value={formValues.receiverName ?? ''}
              onChange={(_e, value: string) =>
                dispatchFormChange({
                  type: 'setFormValues',
                  payload: { receiverName: value },
                })
              }
              isRequired
              validated={receiverNameAlreadyExist ? 'error' : 'default'}
              aria-invalid={receiverNameAlreadyExist}
              id="receiver-name"
              data-test="receiver-name"
              aria-describedby="receiver-name-help"
            />
            {receiverNameAlreadyExist && (
              <FormHelperText>
                <HelperText>
                  <HelperTextItem
                    icon={<ExclamationCircleIcon />}
                    variant="error"
                    id="receiver-name-help"
                    aria-live="polite"
                  >
                    {t('public~A receiver with that name already exists.')}
                  </HelperTextItem>
                </HelperText>
              </FormHelperText>
            )}
          </FormGroup>
          <FormGroup label={t('public~Receiver type')} fieldId="receiver-type" isRequired>
            <Select
              id="receiver-type"
              isOpen={isTypeOpen}
              selected={selectedType}
              onSelect={onTypeSelect}
              onOpenChange={(isOpen) => setIsTypeOpen(isOpen)}
              toggle={typeToggle}
              shouldFocusToggleOnSelect
              aria-label={t('public~Select receiver type...')}
            >
              {Object.entries(receiverTypes).map(([key, value]) => (
                <SelectOption key={key} value={value} data-test={`receiver-type-${key}`}>
                  {value}
                </SelectOption>
              ))}
            </Select>
          </FormGroup>

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

          <ButtonBar errorMessage={saveErrorMsg || loadErrorMsg} inProgress={inProgress}>
            <ActionGroup>
              <Button
                type="submit"
                variant="primary"
                data-test="save-changes"
                isDisabled={isFormInvalid}
              >
                {saveButtonText}
              </Button>
              <Button
                type="button"
                variant="secondary"
                data-test="cancel"
                onClick={() => navigate(-1)}
              >
                {t('public~Cancel')}
              </Button>
            </ActionGroup>
          </ButtonBar>
        </Form>
      </PaneBody>
    </>
  );
};

const ReceiverWrapper: FC<ReceiverFormsWrapperProps> = memo(({ obj, ...props }) => {
  const { alertManagerBaseURL } = window.SERVER_FLAGS;
  const [alertmanagerGlobals, setAlertmanagerGlobals] = useState();
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState<APIError>();

  useEffect(() => {
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
              message: `Error parsing Alertmanager config.original: ${
                error.message || 'invalid YAML'
              }`,
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

  const { t } = useTranslation();
  return (
    <StatusBox
      {...obj}
      label={t('public~Alertmanager globals')}
      loaded={loaded}
      loadError={loadError}
    >
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

export const EditReceiver = () => {
  const { t } = useTranslation();
  const params = useParams();
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

type ReceiverInfoTipProps = {
  type: InitialReceivers;
};

type AlertMsgProps = {
  type: string;
};
