import * as React from 'react';
import {
  ActionGroup,
  Alert,
  AlertActionCloseButton,
  Button,
  Checkbox,
  TextInput,
} from '@patternfly/react-core';
import * as _ from 'lodash';
import { Helmet } from 'react-helmet';
import { Trans, useTranslation } from 'react-i18next';
import { match } from 'react-router';
import { Link } from 'react-router-dom';
import { RadioGroup, RadioInput } from '@console/internal/components/radio';
import {
  documentationURLs,
  ExternalLink,
  FieldLevelHelp,
  Firehose,
  getDocumentationURL,
  getURLSearchParams,
  history,
  MsgBox,
  NsDropdown,
  PageHeading,
  ResourceIcon,
  resourcePathFromModel,
  StatusBox,
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
import { isClusterExternallyManaged } from '@console/shared';
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
import { OperatorChannelSelect, OperatorVersionSelect } from './operator-channel-version-select';

export const OperatorHubSubscribeForm: React.FC<OperatorHubSubscribeFormProps> = (props) => {
  const packageManifest = props.packageManifest?.data?.[0];
  const { name: pkgName } = packageManifest?.metadata ?? {};
  const { provider, channels = [], packageName, catalogSource, catalogSourceNamespace } =
    packageManifest?.status ?? {};

  const [roleARNText, setRoleARNText] = React.useState(null);
  const { catalogNamespace, channel, pkg, tokenizedAuth, version } = getURLSearchParams();
  const [targetNamespace, setTargetNamespace] = React.useState(null);
  const [installMode, setInstallMode] = React.useState(null);

  const defaultChannel = defaultChannelNameFor(packageManifest);
  const [updateChannelName, setUpdateChannelName] = React.useState(channel || defaultChannel);
  const { currentCSVDesc } = channels.find((ch) => ch.name === updateChannelName) ?? {};
  const { installModes = [], version: currentLatestVersion } = currentCSVDesc ?? {};

  const [updateVersion, setUpdateVersion] = React.useState(version || currentLatestVersion);

  const [showSTSWarn, setShowSTSWarn] = React.useState(true);

  const [approval, setApproval] = React.useState(
    updateVersion !== currentLatestVersion
      ? InstallPlanApproval.Manual
      : InstallPlanApproval.Automatic,
  );

  const [cannotResolve, setCannotResolve] = React.useState(false);
  const [suggestedNamespaceExists, setSuggestedNamespaceExists] = React.useState(false);
  const [suggestedNamespaceExistsInFlight, setSuggestedNamespaceExistsInFlight] = React.useState(
    true,
  );
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

  const search = new URLSearchParams({
    'details-item': `${new URLSearchParams(window.location.search).get(
      'pkg',
    )}-${new URLSearchParams(window.location.search).get('catalogNamespace')}`,
  });

  const selectedInstallMode =
    installMode ||
    supportedInstallModesFor(props.packageManifest.data[0])(updateChannelName).reduce(
      (preferredInstallMode, mode) =>
        mode.type === InstallModeType.InstallModeTypeAllNamespaces
          ? InstallModeType.InstallModeTypeAllNamespaces
          : preferredInstallMode,
      InstallModeType.InstallModeTypeOwnNamespace,
    );

  const suggestedNamespace =
    currentCSVDesc.annotations?.['operatorframework.io/suggested-namespace'];
  const suggestedNamespaceTemplate = parseJSONAnnotation(
    currentCSVDesc.annotations,
    'operatorframework.io/suggested-namespace-template',
    // eslint-disable-next-line no-console
    () => console.error('Could not parse JSON annotation.'),
    {},
  );
  const suggestedNamespaceTemplateName = suggestedNamespaceTemplate?.metadata?.name;
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

  let selectedTargetNamespace = targetNamespace || props.targetNamespace;
  const operatorSuggestedNamespace = suggestedNamespaceTemplateName || suggestedNamespace;

  if (selectedInstallMode === InstallModeType.InstallModeTypeAllNamespaces) {
    if (operatorSuggestedNamespace) {
      selectedTargetNamespace = targetNamespace || operatorSuggestedNamespace;
    } else {
      selectedTargetNamespace = targetNamespace || globalNS;
    }
  }
  if (
    selectedInstallMode === InstallModeType.InstallModeTypeOwnNamespace &&
    props.targetNamespace === globalNS
  ) {
    selectedTargetNamespace = targetNamespace || '';
  }

  const isSuggestedNamespaceSelected =
    operatorSuggestedNamespace && operatorSuggestedNamespace === selectedTargetNamespace;
  const showSuggestedNamespaceDetails =
    !suggestedNamespaceExistsInFlight && isSuggestedNamespaceSelected;
  React.useEffect(() => {
    if (!operatorSuggestedNamespace) {
      setSuggestedNamespaceExistsInFlight(false);
      return;
    }
    setTargetNamespace(operatorSuggestedNamespace);
    k8sGet(NamespaceModel, operatorSuggestedNamespace)
      .then(() => {
        setSuggestedNamespaceExists(true);
        setSuggestedNamespaceExistsInFlight(false);
      })
      .catch(() => {
        setSuggestedNamespaceExists(false);
        setSuggestedNamespaceExistsInFlight(false);
      });
  }, [operatorSuggestedNamespace]);

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

  const manualSubscriptionsInNamespace = getManualSubscriptionsInNamespace(
    props.subscription.data,
    selectedTargetNamespace,
  );

  React.useEffect(() => {
    if (
      version !== currentLatestVersion ||
      manualSubscriptionsInNamespace?.length > 0 ||
      tokenizedAuth === 'AWS'
    ) {
      setApproval(InstallPlanApproval.Manual);
    } else setApproval(InstallPlanApproval.Automatic);
  }, [version, currentLatestVersion, manualSubscriptionsInNamespace?.length, tokenizedAuth]);

  const singleInstallMode = installModes.find(
    (m) => m.type === InstallModeType.InstallModeTypeOwnNamespace,
  );
  const supportsSingle = singleInstallMode && singleInstallMode.supported;
  const globalInstallMode = installModes.find(
    (m) => m.type === InstallModeType.InstallModeTypeAllNamespaces,
  );
  const supportsGlobal = globalInstallMode && globalInstallMode.supported;

  const navigateToInstallPage = React.useCallback(
    (csvName: string) => {
      history.push(
        `/operatorhub/install/${catalogNamespace}/${pkg}/${csvName}/to/${selectedTargetNamespace}`,
      );
    },
    [catalogNamespace, pkg, selectedTargetNamespace],
  );

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
      updateChannelName,
    ).map((desc) => referenceForProvidedAPI(desc));

    return _.intersection(existingAPIs, providedAPIs);
  };

  const submit = async () => {
    // Clear any previous errors.
    setError('');
    const defaultNS: K8sResourceCommon = {
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

    const ns = _.defaultsDeep({}, defaultNS, suggestedNamespaceTemplate);
    const rbacName = `${selectedTargetNamespace}-prometheus`;
    const currentChannel = packageManifest?.status?.channels?.find(
      (ch) => ch.name === updateChannelName,
    );
    const currentCSVName = currentChannel?.entries?.find((e) => e.version === updateVersion)?.name;
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
        startingCSV: currentCSVName,
        channel: updateChannelName,
        installPlanApproval: approval,
      },
    };

    if (tokenizedAuth === 'AWS') {
      subscription.spec.config = {
        env: [
          {
            name: 'ROLEARN',
            value: roleARNText,
          },
        ],
      };
    }

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
      if (
        !_.isEqual(previousPlugins.sort(), updatedPlugins.sort()) &&
        canPatchConsoleOperatorConfig
      ) {
        await k8sPatch(ConsoleOperatorConfigModel, consoleOperatorConfig, [
          {
            path: '/spec/plugins',
            value: updatedPlugins,
            op: 'add',
          },
        ]);
      }
      navigateToInstallPage(currentCSVName);
    } catch (err) {
      setError(err.message || t('olm~Could not create Operator Subscription.'));
    }
  };

  const formValid = () =>
    [updateChannelName, selectedInstallMode, selectedTargetNamespace, approval].some(
      (v) => _.isNil(v) || _.isEmpty(v),
    ) ||
    subscriptionExists(selectedTargetNamespace) ||
    !namespaceSupports(selectedTargetNamespace)(selectedInstallMode) ||
    (selectedTargetNamespace && cannotResolve) ||
    !_.isEmpty(conflictingProvidedAPIs(selectedTargetNamespace)) ||
    (tokenizedAuth === 'AWS' && _.isNull(roleARNText));

  const formError = () => {
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
        >
          <p>
            <Trans t={t} ns="olm">
              Remove the{' '}
              <Link
                to={resourcePathFromModel(SubscriptionModel, packageName, selectedTargetNamespace)}
              >
                existing Subscription
              </Link>{' '}
              in order to install this Operator in Namespace {'"'}
              {{ selectedTargetNamespace }}
              {'"'}
            </Trans>
          </p>
        </Alert>
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

  const monitoringURL = getDocumentationURL(documentationURLs.configuringMonitoring);

  const suggestedNamespaceDetails = showSuggestedNamespaceDetails && (
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
            Namespace <b>{{ operatorSuggestedNamespace }}</b> already exists and will be used. Other
            users can already have access to this namespace.
          </Trans>
        ) : (
          <Trans ns="olm">
            Namespace <b>{{ operatorSuggestedNamespace }}</b> does not exist and will be created.
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
            data-checked-state={enableMonitoring}
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
                <ExternalLink href={monitoringURL}>cluster monitoring documentation</ExternalLink>.
              </Trans>
            </Alert>
          )}
        </div>
      )}
    </>
  );

  const installedNamespaceOptions = (
    <div className="form-group">
      <RadioInput
        onChange={() => {
          setUseSuggestedNSForSingleInstallMode(true);
          setTargetNamespace(operatorSuggestedNamespace);
        }}
        value={operatorSuggestedNamespace}
        checked={useSuggestedNSForSingleInstallMode}
        title={t('olm~Operator recommended Namespace:')}
      >
        {' '}
        <ResourceIcon kind="Project" />
        <b>{operatorSuggestedNamespace}</b>
      </RadioInput>
      <RadioInput
        onChange={() => {
          setUseSuggestedNSForSingleInstallMode(false);
          setTargetNamespace(null);
        }}
        value={operatorSuggestedNamespace}
        checked={!useSuggestedNSForSingleInstallMode}
        title={t('olm~Select a Namespace')}
      />
      {!useSuggestedNSForSingleInstallMode && (
        <>
          <NsDropdown
            id="dropdown-selectbox"
            selectedKey={selectedTargetNamespace}
            onChange={(ns) => setTargetNamespace(ns)}
            dataTest="dropdown-selectbox"
          />
          <Alert
            isInline
            className="co-alert pf-c-alert--top-margin"
            variant="warning"
            title={t(
              'olm~Not installing the Operator into the recommended namespace can cause unexpected behavior.',
            )}
          />
        </>
      )}
    </div>
  );

  const installedNamespaceSelect = (
    <div className="form-group">
      <NsDropdown
        id="dropdown-selectbox"
        selectedKey={selectedTargetNamespace}
        onChange={(ns) => setTargetNamespace(ns)}
        dataTest="dropdown-selectbox"
      />
    </div>
  );

  const globalNamespaceInstallMode = (
    <>
      {operatorSuggestedNamespace ? (
        <>{installedNamespaceOptions}</>
      ) : (
        <>{installedNamespaceSelect}</>
      )}
      {useSuggestedNSForSingleInstallMode && suggestedNamespaceDetails}
    </>
  );

  const singleNamespaceInstallMode = !suggestedNamespace ? (
    <>{installedNamespaceSelect}</>
  ) : (
    <>
      {installedNamespaceOptions}
      {useSuggestedNSForSingleInstallMode && suggestedNamespaceDetails}
    </>
  );

  const providedAPIs = providedAPIsForChannel(props.packageManifest.data[0])(updateChannelName);

  const isApprovalItemDisabled =
    version !== currentLatestVersion || manualSubscriptionsInNamespace?.length > 0;

  return (
    <>
      <Helmet>
        <title>Operator Installation</title>
      </Helmet>
      <PageHeading
        title={t('olm~Install Operator')}
        breadcrumbs={[
          { name: t('olm~OperatorHub'), path: `/operatorhub?${search.toString()}` },
          { name: t('olm~Operator Installation'), path: props.match.url },
        ]}
        helpText={t(
          'olm~Install your Operator by subscribing to one of the update channels to keep the Operator up to date. The strategy determines either manual or automatic updates.',
        )}
      />
      <div className="co-m-pane__body">
        {tokenizedAuth === 'AWS' && !isClusterExternallyManaged() && showSTSWarn && (
          <Alert
            isInline
            variant="warning"
            title={t('olm~Cluster in STS Mode')}
            actionClose={<AlertActionCloseButton onClose={() => setShowSTSWarn(false)} />}
            className="pf-u-mb-lg"
          >
            <p>
              {t(
                'olm~This cluster is using AWS Security Token Service to reach the cloud API. In order for this operator to take the actions it requires directly with the cloud API, you will need to provide a role ARN (with an attached policy) during installation. Manual subscriptions are highly recommended as steps should be taken prior to upgrade to ensure that the permissions required by the next version are properly accounted for in the role. Please see the operator description for more details.',
              )}
            </p>
          </Alert>
        )}
        <div className="row">
          <div className="col-xs-6">
            <>
              {tokenizedAuth === 'AWS' && !isClusterExternallyManaged() && (
                <div className="form-group">
                  <fieldset>
                    <label className="co-required">{t('olm~role ARN')}</label>
                    <FieldLevelHelp>
                      {t('olm~The role ARN required for the operator to access the cloud API.')}
                    </FieldLevelHelp>
                    <div className="co-toolbar__item">
                      <TextInput
                        autoFocus
                        placeholder={'role ARN'}
                        aria-label={'role ARN'}
                        type="text"
                        value={roleARNText}
                        onChange={(value) => {
                          setRoleARNText(value);
                        }}
                      />
                    </div>
                  </fieldset>
                </div>
              )}
              <div className="form-group">
                <fieldset>
                  <label className="co-required">{t('olm~Update channel')}</label>
                  <FieldLevelHelp>
                    {t('olm~The channel to track and receive the updates from.')}
                  </FieldLevelHelp>
                  <OperatorChannelSelect
                    packageManifest={props.packageManifest.data[0]}
                    selectedUpdateChannel={updateChannelName}
                    setUpdateChannel={setUpdateChannelName}
                    setUpdateVersion={setUpdateVersion}
                  />
                </fieldset>
              </div>
              <div className="form-group form-group--doubled-bottom-margin">
                <fieldset>
                  <label className="co-required">{t('olm~Version')}</label>
                  <OperatorVersionSelect
                    packageManifest={props.packageManifest.data[0]}
                    selectedUpdateChannel={updateChannelName}
                    updateVersion={updateVersion}
                    setUpdateVersion={setUpdateVersion}
                    showVersionAlert
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
                        useSuggestedNSForSingleInstallMode ? operatorSuggestedNamespace : null,
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
                    currentValue={approval}
                    items={[
                      {
                        value: InstallPlanApproval.Automatic,
                        title: t('olm~Automatic'),
                        disabled: isApprovalItemDisabled,
                      },
                      {
                        value: InstallPlanApproval.Manual,
                        title: t('olm~Manual'),
                      },
                    ]}
                    onChange={(e) => {
                      const { value } = e.currentTarget;
                      setApproval(value);
                      if (value === InstallPlanApproval.Automatic) {
                        setUpdateVersion(currentLatestVersion);
                      }
                    }}
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
                        manual approval strategy and will be updated altogether. Install operators
                        into separate namespaces for handling their updates independently. To allow
                        automatic approval, all operators installed in the namespace must use
                        automatic approval strategy.
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
