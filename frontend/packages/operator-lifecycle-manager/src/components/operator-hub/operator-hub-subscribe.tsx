import * as React from 'react';
import { ActionGroup, Alert, Button, Checkbox } from '@patternfly/react-core';
import * as _ from 'lodash';
import { Helmet } from 'react-helmet';
import { Trans, useTranslation } from 'react-i18next';
import { match } from 'react-router';
import { RadioGroup, RadioInput } from '@console/internal/components/radio';
import {
  Dropdown,
  ExternalLink,
  FieldLevelHelp,
  Firehose,
  history,
  isUpstream,
  NsDropdown,
  openshiftHelpBase,
  BreadCrumbs,
  MsgBox,
  StatusBox,
  ResourceIcon,
  ResourceName,
} from '@console/internal/components/utils';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { useAccessReview } from '@console/internal/components/utils/rbac';
import {
  ConsoleOperatorConfigModel,
  NamespaceModel,
  RoleBindingModel,
  RoleModel,
} from '@console/internal/models';
import {
  K8sResourceCommon,
  apiVersionForModel,
  apiVersionForReference,
  k8sCreate,
  k8sGet,
  k8sListPartialMetadata,
  k8sPatch,
  K8sResourceKind,
  kindForReference,
  referenceFor,
  referenceForModel,
} from '@console/internal/module/k8s';
import { fromRequirements } from '@console/internal/module/k8s/selector';
import { CONSOLE_OPERATOR_CONFIG_NAME } from '@console/shared/src/constants';
import { parseJSONAnnotation } from '@console/shared/src/utils/annotations';
import { SubscriptionModel, OperatorGroupModel, PackageManifestModel } from '../../models';
import {
  OperatorGroupKind,
  PackageManifestKind,
  SubscriptionKind,
  InstallPlanApproval,
  InstallModeType,
} from '../../types';
import { getClusterServiceVersionPlugins, isCatalogSourceTrusted } from '../../utils';
import { ConsolePluginFormGroup } from '../../utils/console-plugin-form-group';
import { CRDCard } from '../clusterserviceversion';
import {
  ClusterServiceVersionLogo,
  defaultChannelNameFor,
  getManualSubscriptionsInNamespace,
  iconFor,
  NamespaceIncludesManualApproval,
  providedAPIsForChannel,
  referenceForProvidedAPI,
  supportedInstallModesFor,
} from '../index';
import { installedFor, supports, providedAPIsForOperatorGroup, isGlobal } from '../operator-group';
import { OperatorInstallStatusPage } from '../operator-install-page';

export const OperatorHubSubscribeForm: React.FC<OperatorHubSubscribeFormProps> = (props) => {
  const [inProgress, setInProgress] = React.useState(false);
  const [targetNamespace, setTargetNamespace] = React.useState(null);
  const [installMode, setInstallMode] = React.useState(null);
  const [showInstallStatusPage, setShowInstallStatusPage] = React.useState(false);
  const [updateChannel, setUpdateChannel] = React.useState(null);
  const [approval, setApproval] = React.useState(InstallPlanApproval.Automatic);
  const [cannotResolve, setCannotResolve] = React.useState(false);
  const [suggestedNamespaceExists, setSuggestedNamespaceExists] = React.useState(false);
  const [
    useSuggestedNSForSingleInstallMode,
    setUseSuggestedNSForSingleInstallMode,
  ] = React.useState(true);
  const [enableMonitoring, setEnableMonitoring] = React.useState(false);
  const [error, setError] = React.useState('');
  const [consoleOperatorConfig] = useK8sWatchResource<K8sResourceKind>({
    kind: referenceForModel(ConsoleOperatorConfigModel),
    isList: false,
    name: CONSOLE_OPERATOR_CONFIG_NAME,
  });
  const [enabledPlugins, setEnabledPlugins] = React.useState<string[]>([]);
  const { t } = useTranslation();

  const setPluginEnabled = (plugin: string, enabled: boolean) => {
    if (enabled) {
      setEnabledPlugins([...enabledPlugins, plugin]);
    } else {
      setEnabledPlugins(enabledPlugins.filter((p: string) => p !== plugin));
    }
  };

  const { name: pkgName } = props.packageManifest.data[0].metadata;
  const {
    provider,
    channels = [],
    packageName,
    catalogSource,
    catalogSourceNamespace,
  } = props.packageManifest.data[0].status;

  const search = new URLSearchParams({
    'details-item': `${new URLSearchParams(window.location.search).get(
      'pkg',
    )}-${new URLSearchParams(window.location.search).get('catalogNamespace')}`,
  });

  const selectedUpdateChannel =
    updateChannel || defaultChannelNameFor(props.packageManifest.data[0]);
  const selectedInstallMode =
    installMode ||
    supportedInstallModesFor(props.packageManifest.data[0])(selectedUpdateChannel).reduce(
      (preferredInstallMode, mode) =>
        mode.type === InstallModeType.InstallModeTypeAllNamespaces
          ? InstallModeType.InstallModeTypeAllNamespaces
          : preferredInstallMode,
      InstallModeType.InstallModeTypeOwnNamespace,
    );

  const { currentCSVDesc } = channels.find((ch) => ch.name === selectedUpdateChannel);
  const { installModes = [] } = currentCSVDesc;
  const suggestedNamespace =
    currentCSVDesc.annotations?.['operatorframework.io/suggested-namespace'];
  const operatorRequestsMonitoring =
    currentCSVDesc.annotations?.['operatorframework.io/cluster-monitoring'] === 'true';
  const initializationResource = parseJSONAnnotation(
    currentCSVDesc.annotations,
    'operatorframework.io/initialization-resource',
    // eslint-disable-next-line no-console
    () => console.error('Operator Hub Subscribe: Could not get initialization resource.'),
  );
  const canPatchConsoleOperatorConfig = useAccessReview({
    group: ConsoleOperatorConfigModel.apiGroup,
    resource: ConsoleOperatorConfigModel.plural,
    verb: 'patch',
    name: CONSOLE_OPERATOR_CONFIG_NAME,
  });
  const csvPlugins = getClusterServiceVersionPlugins(currentCSVDesc?.annotations);

  const initializationResourceReference = React.useMemo(
    () => (initializationResource ? referenceFor(initializationResource) : null),
    [initializationResource],
  );

  const globalNS =
    (props.operatorGroup?.data || ([] as OperatorGroupKind[])).find(
      (og) => og.metadata.name === 'global-operators',
    )?.metadata?.namespace || 'openshift-operators';
  const items = {
    [globalNS]: <ResourceName kind="Project" name={globalNS} />,
  };

  let selectedTargetNamespace = targetNamespace || props.targetNamespace;
  if (selectedInstallMode === InstallModeType.InstallModeTypeAllNamespaces) {
    if (suggestedNamespace) {
      items[suggestedNamespace] = (
        <ResourceName kind="Project" name={`${suggestedNamespace} (Operator recommended)`} />
      );
      selectedTargetNamespace = targetNamespace || suggestedNamespace;
    } else {
      selectedTargetNamespace = globalNS;
    }
  }
  if (
    selectedInstallMode === InstallModeType.InstallModeTypeOwnNamespace &&
    props.targetNamespace === globalNS
  ) {
    selectedTargetNamespace = targetNamespace || '';
  }

  const isSuggestedNamespaceSelected =
    suggestedNamespace && suggestedNamespace === selectedTargetNamespace;
  const selectedApproval = approval || InstallPlanApproval.Automatic;

  React.useEffect(() => {
    if (!suggestedNamespace) {
      return;
    }
    setTargetNamespace(suggestedNamespace);
    k8sGet(NamespaceModel, suggestedNamespace)
      .then(() => setSuggestedNamespaceExists(true))
      .catch(() => setSuggestedNamespaceExists(false));
  }, [suggestedNamespace]);

  React.useEffect(() => {
    k8sListPartialMetadata(PackageManifestModel, {
      ns: selectedTargetNamespace,
      fieldSelector: `metadata.name=${pkgName}`,
      labelSelector: fromRequirements([
        { key: 'catalog', operator: 'Equals', values: [catalogSource] },
        { key: 'catalog-namespace', operator: 'Equals', values: [catalogSourceNamespace] },
      ]),
    })
      .then((list) => setCannotResolve(_.isEmpty(list)))
      .catch(() => setCannotResolve(true));
  }, [
    catalogSource,
    catalogSourceNamespace,
    pkgName,
    props.packageManifest.data,
    selectedTargetNamespace,
  ]);

  React.useEffect(() => {
    setEnabledPlugins(isCatalogSourceTrusted(catalogSource) ? csvPlugins : []);
    // Use the JSON string directly from the annotation so the dependency is compared using string comparison
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [catalogSource, currentCSVDesc?.annotations?.['console.openshift.io/plugins']]);

  const singleInstallMode = installModes.find(
    (m) => m.type === InstallModeType.InstallModeTypeOwnNamespace,
  );
  const supportsSingle = singleInstallMode && singleInstallMode.supported;
  const globalInstallMode = installModes.find(
    (m) => m.type === InstallModeType.InstallModeTypeAllNamespaces,
  );
  const supportsGlobal = globalInstallMode && globalInstallMode.supported;

  if (!supportsSingle && !supportsGlobal) {
    return (
      <MsgBox
        title={t("olm~{{item}} can't be installed", {
          item: channels?.[0]?.currentCSVDesc?.displayName,
        })}
        detail={t(
          'olm~The operator does not support single namespace or global installation modes.',
        )}
      />
    );
  }

  const descFor = (mode: InstallModeType) => {
    if (mode === InstallModeType.InstallModeTypeAllNamespaces && supportsGlobal) {
      return t('olm~Operator will be available in all Namespaces.');
    }
    if (mode === InstallModeType.InstallModeTypeOwnNamespace && supportsSingle) {
      return t('olm~Operator will be available in a single Namespace only.');
    }
    return t('olm~This mode is not supported by this Operator');
  };
  const subscriptionExists = (ns: string) =>
    installedFor(props.subscription.data)(props.operatorGroup.data)(props.packageManifest.data[0])(
      ns,
    );
  const namespaceSupports = (ns: string) => (mode: InstallModeType) => {
    const operatorGroup = props.operatorGroup.data.find((og) => og.metadata.namespace === ns);
    if (!operatorGroup || !ns) {
      return true;
    }
    return supports([{ type: mode, supported: true }])(operatorGroup);
  };
  const conflictingProvidedAPIs = (ns: string) => {
    const operatorGroups = props.operatorGroup.data.filter(
      (og) => og.status?.namespaces?.includes(ns) || isGlobal(og),
    );
    if (_.isEmpty(operatorGroups)) {
      return [];
    }
    const existingAPIs = _.flatMap(operatorGroups, providedAPIsForOperatorGroup);
    const providedAPIs = providedAPIsForChannel(props.packageManifest.data[0])(
      selectedUpdateChannel,
    ).map((desc) => referenceForProvidedAPI(desc));

    return _.intersection(existingAPIs, providedAPIs);
  };

  const submit = async () => {
    // Clear any previous errors.
    setError('');
    setInProgress(true);

    const ns: K8sResourceCommon = {
      metadata: {
        name: selectedTargetNamespace,
        labels:
          operatorRequestsMonitoring && enableMonitoring
            ? {
                'openshift.io/cluster-monitoring': 'true',
              }
            : {},
      },
    };

    const rbacName = `${selectedTargetNamespace}-prometheus`;
    const prometheusRole = {
      kind: RoleModel.kind,
      apiVersion: `${RoleModel.apiGroup}/${RoleModel.apiVersion}`,
      metadata: {
        name: rbacName,
        namespace: selectedTargetNamespace,
      },
      rules: [
        {
          apiGroups: [''],
          resources: ['services', 'endpoints', 'pods'],
          verbs: ['get', 'list', 'watch'],
        },
      ],
    };

    const prometheusRoleBinding = {
      kind: RoleBindingModel.kind,
      apiVersion: `${RoleBindingModel.apiGroup}/${RoleBindingModel.apiVersion}`,
      metadata: {
        name: rbacName,
        namespace: selectedTargetNamespace,
      },
      roleRef: {
        kind: 'Role',
        name: rbacName,
        apiGroup: RoleBindingModel.apiGroup,
      },
      subjects: [
        {
          kind: 'ServiceAccount',
          name: 'prometheus-k8s',
          namespace: 'openshift-monitoring',
        },
      ],
    };

    const operatorGroup: OperatorGroupKind = {
      apiVersion: apiVersionForModel(OperatorGroupModel) as OperatorGroupKind['apiVersion'],
      kind: 'OperatorGroup',
      metadata: {
        generateName: `${selectedTargetNamespace}-`,
        namespace: selectedTargetNamespace,
      },
      ...(selectedInstallMode === InstallModeType.InstallModeTypeAllNamespaces
        ? {}
        : {
            spec: {
              targetNamespaces: [selectedTargetNamespace],
            },
          }),
    };

    const subscription: SubscriptionKind = {
      apiVersion: apiVersionForModel(SubscriptionModel) as SubscriptionKind['apiVersion'],
      kind: 'Subscription',
      metadata: {
        name: packageName,
        namespace: selectedTargetNamespace,
      },
      spec: {
        source: catalogSource,
        sourceNamespace: catalogSourceNamespace,
        name: packageName,
        startingCSV: channels.find((ch) => ch.name === selectedUpdateChannel).currentCSV,
        channel: selectedUpdateChannel,
        installPlanApproval: selectedApproval,
      },
    };

    try {
      if (isSuggestedNamespaceSelected && !suggestedNamespaceExists) {
        await k8sCreate(NamespaceModel, ns);
        if (operatorRequestsMonitoring && enableMonitoring) {
          await k8sCreate(RoleModel, prometheusRole);
          await k8sCreate(RoleBindingModel, prometheusRoleBinding);
        }
      }
      if (
        !props.operatorGroup.data.some(
          (group) => group.metadata.namespace === selectedTargetNamespace,
        )
      ) {
        await k8sCreate(OperatorGroupModel, operatorGroup);
      }
      await k8sCreate(SubscriptionModel, subscription);
      const previousPlugins: string[] = consoleOperatorConfig?.spec?.plugins || [];
      const updatedPlugins: string[] = [
        ...previousPlugins.filter((plugin: string) => !csvPlugins.includes(plugin)),
        ...enabledPlugins,
      ];
      if (!_.isEqual(previousPlugins.sort(), updatedPlugins.sort())) {
        await k8sPatch(ConsoleOperatorConfigModel, consoleOperatorConfig, [
          {
            path: '/spec/plugins',
            value: updatedPlugins,
            op: 'add',
          },
        ]);
      }
      setInProgress(false);
      setShowInstallStatusPage(true);
    } catch (err) {
      setError(err.message || t('olm~Could not create Operator Subscription.'));
      setInProgress(false);
    }
  };

  const formValid = () =>
    inProgress ||
    [selectedUpdateChannel, selectedInstallMode, selectedTargetNamespace, selectedApproval].some(
      (v) => _.isNil(v) || _.isEmpty(v),
    ) ||
    subscriptionExists(selectedTargetNamespace) ||
    !namespaceSupports(selectedTargetNamespace)(selectedInstallMode) ||
    (selectedTargetNamespace && cannotResolve) ||
    !_.isEmpty(conflictingProvidedAPIs(selectedTargetNamespace));

  const formError = () => {
    if (inProgress) {
      return null;
    }
    return (
      (error && (
        <Alert
          isInline
          className="co-alert co-alert--scrollable"
          variant="danger"
          title={t('olm~An error occurred')}
        >
          <div className="co-pre-line">{error}</div>
        </Alert>
      )) ||
      (!namespaceSupports(selectedTargetNamespace)(selectedInstallMode) && (
        <Alert
          isInline
          className="co-alert"
          variant="danger"
          title={t('olm~Namespace does not support installation mode')}
        >
          {selectedInstallMode === InstallModeType.InstallModeTypeOwnNamespace &&
          selectedTargetNamespace === globalNS ? (
            <>
              {t(
                'olm~The {{namespace}} Namespace is reserved for global Operators that watch all Namespaces. To install an Operator in a single Namespace, select a different Namespace where the operand should run.',
                { namespace: selectedTargetNamespace },
              )}
            </>
          ) : (
            <>
              {t(
                'olm~The OperatorGroup in the {{namespace}} Namespace does not support the {{mode}} installation mode. Select a different installation Namespace that supports this mode.',
                {
                  namespace: selectedTargetNamespace,
                  mode:
                    selectedInstallMode === InstallModeType.InstallModeTypeAllNamespaces
                      ? ' global '
                      : ' single-Namespace ',
                },
              )}
            </>
          )}
        </Alert>
      )) ||
      (subscriptionExists(selectedTargetNamespace) && (
        <Alert
          isInline
          className="co-alert"
          variant="danger"
          title={t(
            'olm~A Subscription for this Operator already exists in Namespace "{{namespace}}"',
            {
              namespace: selectedTargetNamespace,
            },
          )}
        />
      )) ||
      (!_.isEmpty(conflictingProvidedAPIs(selectedTargetNamespace)) && (
        <Alert
          isInline
          className="co-alert"
          variant="danger"
          title={t('olm~Operator conflicts exist')}
        >
          {t(
            'olm~Installing this Operator in the selected Namespace would cause conflicts with another Operator providing these APIs:',
          )}
          <ul>
            {conflictingProvidedAPIs(selectedTargetNamespace).map((gvk) => (
              <li key={gvk}>
                <strong>{kindForReference(gvk)}</strong> <i>({apiVersionForReference(gvk)})</i>
              </li>
            ))}
          </ul>
        </Alert>
      )) ||
      (selectedTargetNamespace && cannotResolve && (
        <Alert
          isInline
          className="co-alert"
          variant="danger"
          title={t('olm~Operator not available for selected Namespaces')}
        />
      ))
    );
  };

  const showMonitoringCheckbox =
    operatorRequestsMonitoring && _.startsWith(selectedTargetNamespace, 'openshift-');

  const monitoringLink = isUpstream()
    ? `${openshiftHelpBase}monitoring/configuring-the-monitoring-stack.html#maintenance-and-support_configuring-monitoring`
    : `${openshiftHelpBase}html/monitoring/configuring-the-monitoring-stack#maintenance-and-support_configuring-the-monitoring-stack`;

  const suggestedNamespaceDetails = isSuggestedNamespaceSelected && (
    <>
      <Alert
        isInline
        className="co-alert co-alert--scrollable"
        variant={suggestedNamespaceExists ? 'warning' : 'info'}
        title={
          suggestedNamespaceExists ? t('olm~Namespace already exists') : t('olm~Namespace creation')
        }
      >
        {suggestedNamespaceExists ? (
          <Trans ns="olm">
            Namespace <b>{{ suggestedNamespace }}</b> already exists and will be used. Other users
            can already have access to this namespace.
          </Trans>
        ) : (
          <Trans ns="olm">
            Namespace <b>{{ suggestedNamespace }}</b> does not exist and will be created.
          </Trans>
        )}
      </Alert>
      {showMonitoringCheckbox && !suggestedNamespaceExists && (
        <div className="co-form-subsection">
          <Checkbox
            id="enable-monitoring-checkbox"
            data-test="enable-monitoring"
            label={t('olm~Enable Operator recommended cluster monitoring on this Namespace')}
            onChange={setEnableMonitoring}
            isChecked={enableMonitoring}
          />
          {props.packageManifest.data[0].metadata.labels['opsrc-provider'] !== 'redhat' && (
            <Alert
              isInline
              className="co-alert pf-c-alert--top-margin"
              variant="warning"
              title={t('olm~Namespace monitoring')}
            >
              <Trans ns="olm">
                Please note that installing non-Red Hat operators into OpenShift namespaces and
                enabling monitoring voids user support. Enabling cluster monitoring for non-Red Hat
                operators can lead to malicious metrics data overriding existing cluster metrics.
                For more information, see the{' '}
                <ExternalLink href={monitoringLink}>cluster monitoring documentation</ExternalLink>.
              </Trans>
            </Alert>
          )}
        </div>
      )}
    </>
  );

  const globalNamespaceInstallMode = (
    <>
      <div className="form-group">
        <Dropdown
          id="dropdown-selectbox"
          dataTest="dropdown-selectbox"
          dropDownClassName="dropdown--full-width"
          menuClassName="dropdown-menu--text-wrap"
          items={items}
          title={
            <ResourceName
              kind="Project"
              name={
                isSuggestedNamespaceSelected
                  ? `${selectedTargetNamespace} (Operator recommended)`
                  : selectedTargetNamespace
              }
            />
          }
          disabled={_.size(items) === 1}
          selectedKey={selectedTargetNamespace}
          onChange={(ns: string) => {
            setTargetNamespace(ns);
            setCannotResolve(false);
          }}
        />
      </div>
      {suggestedNamespaceDetails}
    </>
  );

  const singleNamespaceInstallMode = !suggestedNamespace ? (
    <NsDropdown
      id="dropdown-selectbox"
      selectedKey={selectedTargetNamespace}
      onChange={(ns) => setTargetNamespace(ns)}
      dataTest="dropdown-selectbox"
    />
  ) : (
    <div className="form-group">
      <RadioInput
        onChange={() => {
          setUseSuggestedNSForSingleInstallMode(true);
          setTargetNamespace(suggestedNamespace);
        }}
        value={suggestedNamespace}
        checked={useSuggestedNSForSingleInstallMode}
        title={t('olm~Operator recommended Namespace:')}
      >
        {' '}
        <ResourceIcon kind="Project" />
        <b>{suggestedNamespace}</b>
      </RadioInput>
      {useSuggestedNSForSingleInstallMode && suggestedNamespaceDetails}
      <RadioInput
        onChange={() => {
          setUseSuggestedNSForSingleInstallMode(false);
          setTargetNamespace(null);
        }}
        value={suggestedNamespace}
        checked={!useSuggestedNSForSingleInstallMode}
        title={t('olm~Select a Namespace')}
      />
      {!useSuggestedNSForSingleInstallMode && (
        <NsDropdown
          id="dropdown-selectbox"
          selectedKey={selectedTargetNamespace}
          onChange={(ns) => setTargetNamespace(ns)}
          dataTest="dropdown-selectbox"
        />
      )}
    </div>
  );

  const providedAPIs = providedAPIsForChannel(props.packageManifest.data[0])(selectedUpdateChannel);

  if (showInstallStatusPage) {
    return (
      <OperatorInstallStatusPage
        targetNamespace={selectedTargetNamespace}
        pkgNameWithVersion={channels.find((ch) => ch.name === selectedUpdateChannel).currentCSV}
      />
    );
  }

  const manualSubscriptionsInNamespace = getManualSubscriptionsInNamespace(
    props.subscription.data,
    selectedTargetNamespace,
  );

  return (
    <>
      <Helmet>
        <title>Operator Installation</title>
      </Helmet>
      <div className="co-m-nav-title co-m-nav-title--breadcrumbs">
        <BreadCrumbs
          breadcrumbs={[
            { name: t('olm~OperatorHub'), path: `/operatorhub?${search.toString()}` },
            { name: t('olm~Operator Installation'), path: props.match.url },
          ]}
        />
        <h1 className="co-m-pane__heading">{t('olm~Install Operator')}</h1>
        <p className="co-help-text">
          {t(
            'olm~Install your Operator by subscribing to one of the update channels to keep the Operator up to date. The strategy determines either manual or automatic updates.',
          )}
        </p>
      </div>
      <div className="co-m-pane__body">
        <div className="row">
          <div className="col-xs-6">
            <>
              <div className="form-group">
                <fieldset>
                  <label className="co-required">{t('olm~Update channel')}</label>
                  <FieldLevelHelp>
                    {t('olm~The channel to track and receive the updates from.')}
                  </FieldLevelHelp>
                  <RadioGroup
                    currentValue={selectedUpdateChannel}
                    items={channels.map((ch) => ({ value: ch.name, title: ch.name }))}
                    onChange={(e) => {
                      setUpdateChannel(e.currentTarget.value);
                      setInstallMode(null);
                    }}
                  />
                </fieldset>
              </div>
              <div className="form-group">
                <fieldset>
                  <label className="co-required">{t('olm~Installation mode')}</label>
                  <RadioInput
                    onChange={(e) => {
                      setInstallMode(e.target.value);
                      setTargetNamespace(null);
                      setCannotResolve(false);
                    }}
                    value={InstallModeType.InstallModeTypeAllNamespaces}
                    checked={selectedInstallMode === InstallModeType.InstallModeTypeAllNamespaces}
                    disabled={!supportsGlobal}
                    title={t('olm~All namespaces on the cluster')}
                    subTitle={t('olm~(default)')}
                  >
                    <div className="co-m-radio-desc">
                      <p className="text-muted">
                        {descFor(InstallModeType.InstallModeTypeAllNamespaces)}
                      </p>
                    </div>
                  </RadioInput>
                  <RadioInput
                    onChange={(e) => {
                      setInstallMode(e.target.value);
                      setTargetNamespace(
                        useSuggestedNSForSingleInstallMode ? suggestedNamespace : null,
                      );
                      setCannotResolve(false);
                    }}
                    value={InstallModeType.InstallModeTypeOwnNamespace}
                    checked={selectedInstallMode === InstallModeType.InstallModeTypeOwnNamespace}
                    disabled={!supportsSingle}
                    title={t('olm~A specific namespace on the cluster')}
                  >
                    <div className="co-m-radio-desc">
                      <p className="text-muted">
                        {descFor(InstallModeType.InstallModeTypeOwnNamespace)}
                      </p>
                    </div>
                  </RadioInput>
                </fieldset>
              </div>
              <div className="form-group form-group--doubled-bottom-margin">
                <label className="co-required" htmlFor="dropdown-selectbox">
                  {t('olm~Installed Namespace')}
                </label>
                {selectedInstallMode === InstallModeType.InstallModeTypeAllNamespaces &&
                  globalNamespaceInstallMode}
                {selectedInstallMode === InstallModeType.InstallModeTypeOwnNamespace &&
                  singleNamespaceInstallMode}
              </div>
              <div className="form-group">
                <fieldset>
                  <label className="co-required">{t('olm~Update approval')}</label>
                  <FieldLevelHelp>
                    {t('olm~The strategy to determine either manual or automatic updates.')}
                  </FieldLevelHelp>
                  <RadioGroup
                    currentValue={selectedApproval}
                    items={[
                      { value: InstallPlanApproval.Automatic, title: t('olm~Automatic') },
                      { value: InstallPlanApproval.Manual, title: t('olm~Manual') },
                    ]}
                    onChange={(e) => setApproval(e.currentTarget.value)}
                  />
                  {approval === InstallPlanApproval.Automatic &&
                    manualSubscriptionsInNamespace?.length > 0 && (
                      <Alert
                        isInline
                        className="co-alert co-alert--margin-top"
                        variant="info"
                        title={t('olm~Will function as manual approval strategy')}
                      >
                        <NamespaceIncludesManualApproval
                          subscriptions={manualSubscriptionsInNamespace}
                          namespace={selectedTargetNamespace}
                        />
                      </Alert>
                    )}
                  {approval === InstallPlanApproval.Manual && (
                    <Alert
                      isInline
                      className="co-alert co-alert--margin-top"
                      variant="info"
                      title={t('olm~Manual approval applies to all operators in a namespace')}
                    >
                      <Trans ns="olm">
                        Installing an operator with manual approval causes all operators installed
                        in namespace <strong>{{ selectedTargetNamespace }}</strong> to function as
                        manual approval strategy. To allow automatic approval, all operators
                        installed in the namespace must use automatic approval strategy.
                      </Trans>
                    </Alert>
                  )}
                </fieldset>
              </div>
              {csvPlugins.length > 0 && consoleOperatorConfig && canPatchConsoleOperatorConfig && (
                <ConsolePluginFormGroup
                  catalogSource={catalogSource}
                  csvPlugins={csvPlugins}
                  enabledPlugins={enabledPlugins}
                  setPluginEnabled={setPluginEnabled}
                />
              )}
            </>
            <div className="co-form-section__separator" />
            {formError()}
            <ActionGroup className="pf-c-form">
              <Button
                data-test="install-operator"
                onClick={() => submit()}
                isDisabled={formValid()}
                variant="primary"
              >
                {t('olm~Install')}
              </Button>
              <Button variant="secondary" onClick={() => history.push('/operatorhub')}>
                {t('public~Cancel')}
              </Button>
            </ActionGroup>
          </div>
          <div className="col-xs-6">
            <ClusterServiceVersionLogo
              displayName={
                currentCSVDesc?.displayName || channels?.[0]?.currentCSVDesc?.displayName
              }
              icon={iconFor(props.packageManifest.data[0])}
              provider={provider}
            />
            <h4>{t('olm~Provided APIs')}</h4>
            <div className="co-crd-card-row">
              {!providedAPIs.length ? (
                <span className="text-muted">
                  {t('olm~No Kubernetes APIs are provided by this Operator.')}
                </span>
              ) : (
                providedAPIs.map((api) => (
                  <CRDCard
                    key={referenceForProvidedAPI(api)}
                    canCreate={false}
                    crd={api}
                    csv={null}
                    required={referenceForProvidedAPI(api) === initializationResourceReference}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

const OperatorHubSubscribe: React.FC<OperatorHubSubscribeFormProps> = (props) => (
  <StatusBox data={props.packageManifest.data[0]} loaded={props.loaded} loadError={props.loadError}>
    <OperatorHubSubscribeForm {...props} />
  </StatusBox>
);

export const OperatorHubSubscribePage: React.SFC<OperatorHubSubscribePageProps> = (props) => {
  return (
    <Firehose
      resources={[
        {
          isList: true,
          kind: referenceForModel(OperatorGroupModel),
          prop: 'operatorGroup',
        },
        {
          isList: true,
          kind: referenceForModel(PackageManifestModel),
          namespace: new URLSearchParams(window.location.search).get('catalogNamespace'),
          fieldSelector: `metadata.name=${new URLSearchParams(window.location.search).get('pkg')}`,
          selector: {
            matchLabels: {
              catalog: new URLSearchParams(window.location.search).get('catalog'),
            },
          },
          prop: 'packageManifest',
        },
        {
          isList: true,
          kind: referenceForModel(SubscriptionModel),
          prop: 'subscription',
        },
      ]}
    >
      {/* FIXME(alecmerdler): Hack because `Firehose` injects props without TypeScript knowing about it */}
      <OperatorHubSubscribe
        {...(props as any)}
        targetNamespace={new URLSearchParams(window.location.search).get('targetNamespace') || null}
      />
    </Firehose>
  );
};

export type OperatorHubSubscribeFormProps = {
  loaded: boolean;
  loadError?: any;
  namespace: string;
  targetNamespace?: string;
  operatorGroup: { loaded: boolean; data: OperatorGroupKind[] };
  packageManifest: { loaded: boolean; data: PackageManifestKind[] };
  match: match;
  subscription: { loaded: boolean; data: SubscriptionKind[] };
};

export type OperatorHubSubscribePageProps = {
  match: match;
};

OperatorHubSubscribe.displayName = 'OperatorHubSubscribe';
OperatorHubSubscribeForm.displayName = 'OperatorHubSubscribeForm';
OperatorHubSubscribePage.displayName = 'OperatorHubSubscribePage';
