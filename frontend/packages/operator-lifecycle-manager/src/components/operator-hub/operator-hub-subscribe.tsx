import type { FC } from 'react';
import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ActionGroup,
  Alert,
  AlertVariant,
  Button,
  Checkbox,
  Flex,
  FormGroup,
  Grid,
  GridItem,
  Radio,
  TextInput,
  Title,
} from '@patternfly/react-core';
import * as _ from 'lodash';
import { Trans, useTranslation } from 'react-i18next';
import { useLocation, Link, useNavigate } from 'react-router';
import { useActiveNamespace } from '@console/dynamic-plugin-sdk/src/lib-core';
import { RadioGroup } from '@console/internal/components/radio';
import {
  documentationURLs,
  FieldLevelHelp,
  getDocumentationURL,
  getURLSearchParams,
  isManaged,
  ConsoleEmptyState,
  NsDropdown,
  ResourceIcon,
  resourcePathFromModel,
  StatusBox,
} from '@console/internal/components/utils';
import {
  useK8sWatchResource,
  useK8sWatchResources,
} from '@console/internal/components/utils/k8s-watch-hook';
import { useAccessReview } from '@console/internal/components/utils/rbac';
import {
  ConsoleOperatorConfigModel,
  NamespaceModel,
  RoleBindingModel,
  RoleModel,
} from '@console/internal/models';
import type { K8sResourceCommon, K8sResourceKind } from '@console/internal/module/k8s';
import {
  apiVersionForModel,
  apiVersionForReference,
  k8sCreate,
  k8sGet,
  k8sListPartialMetadata,
  k8sPatch,
  kindForReference,
  referenceFor,
  referenceForModel,
} from '@console/internal/module/k8s';
import { fromRequirements } from '@console/internal/module/k8s/selector';
import { DismissableAlert } from '@console/shared/src/components/alerts/DismissableAlert';
import { DocumentTitle } from '@console/shared/src/components/document-title/DocumentTitle';
import { PageHeading } from '@console/shared/src/components/heading/PageHeading';
import PaneBody from '@console/shared/src/components/layout/PaneBody';
import { ExternalLink } from '@console/shared/src/components/links/ExternalLink';
import { CONSOLE_OPERATOR_CONFIG_NAME } from '@console/shared/src/constants/resource';
import { SubscriptionModel, OperatorGroupModel, PackageManifestModel } from '../../models';
import type { OperatorGroupKind, PackageManifestKind, SubscriptionKind } from '../../types';
import { InstallPlanApproval, InstallModeType } from '../../types';
import { isCatalogSourceTrusted } from '../../utils';
import { ConsolePluginFormGroup } from '../../utils/console-plugin-form-group';
import { ClusterServiceVersionLogo } from '../cluster-service-version-logo';
import { CRDCard } from '../clusterserviceversion';
import { DeprecatedOperatorWarningAlert } from '../deprecated-operator-warnings/deprecated-operator-warnings';
import { useDeprecatedOperatorWarnings } from '../deprecated-operator-warnings/use-deprecated-operator-warnings';
import {
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
import {
  getSuggestedNamespaceTemplate,
  getInitializationResource,
  getClusterServiceVersionPlugins,
} from './operator-hub-utils';

const InputField: FC<InputFieldProps> = ({
  label,
  helpText,
  placeholder,
  ariaLabel,
  value,
  setValue,
}) => {
  return (
    <div className="form-group">
      <fieldset>
        <label className="co-required">{label}</label>
        <FieldLevelHelp>{helpText}</FieldLevelHelp>
        <div>
          <TextInput
            autoFocus
            placeholder={placeholder}
            aria-label={ariaLabel}
            type="text"
            value={value}
            onChange={(_event, val) => {
              setValue(val);
            }}
            required
          />
        </div>
      </fieldset>
    </div>
  );
};

const OperatorHubSubscribeForm: FC<OperatorHubSubscribeFormProps> = (props) => {
  const packageManifest = props.packageManifest?.data?.[0];
  const navigate = useNavigate();
  const handleCancel = useCallback(() => navigate(-1), [navigate]);
  const [activeNamespace] = useActiveNamespace();
  const { name: pkgName } = packageManifest?.metadata ?? {};
  const { provider, channels = [], packageName, catalogSource, catalogSourceNamespace } =
    packageManifest?.status ?? {};

  const { pathname: url } = useLocation();
  const [roleARNText, setRoleARNText] = useState('');
  const [azureTenantId, setAzureTenantId] = useState('');
  const [azureClientId, setAzureClientId] = useState('');
  const [azureSubscriptionId, setAzureSubscriptionId] = useState('');
  const [azureResourceGroup, setAzureResourceGroup] = useState('');
  const [gcpProjectNumber, setGcpProjectNumber] = useState('');
  const [gcpPoolId, setGcpPoolId] = useState('');
  const [gcpProviderId, setGcpProviderId] = useState('');
  const [gcpServiceAcctEmail, setGcpServiceAcctEmail] = useState('');
  const [targetNamespace, setTargetNamespace] = useState(null);
  const [installMode, setInstallMode] = useState(null);
  const { catalog, catalogNamespace, channel, pkg, tokenizedAuth, version } = getURLSearchParams();

  const defaultChannel = defaultChannelNameFor(packageManifest);
  const [updateChannelName, setUpdateChannelName] = useState(channel || defaultChannel);
  const { currentCSVDesc } = channels.find((ch) => ch.name === updateChannelName) ?? {};
  const { installModes = [], version: currentLatestVersion } = currentCSVDesc ?? {};

  const [updateVersion, setUpdateVersion] = useState(version || currentLatestVersion);

  const [approval, setApproval] = useState(
    updateVersion !== currentLatestVersion
      ? InstallPlanApproval.Manual
      : InstallPlanApproval.Automatic,
  );

  const [cannotResolve, setCannotResolve] = useState(false);
  const [suggestedNamespaceExists, setSuggestedNamespaceExists] = useState(false);
  const [suggestedNamespaceExistsInFlight, setSuggestedNamespaceExistsInFlight] = useState(true);
  const [useSuggestedNSForSingleInstallMode, setUseSuggestedNSForSingleInstallMode] = useState(
    true,
  );

  const defaultEnableMonitoring =
    packageManifest?.metadata?.labels?.provider?.includes('Red Hat') &&
    currentCSVDesc.annotations?.['console.openshift.io/operator-monitoring-default'] === 'true';
  const [enableMonitoring, setEnableMonitoring] = useState(defaultEnableMonitoring);

  const [error, setError] = useState('');
  const [consoleOperatorConfig] = useK8sWatchResource<K8sResourceKind>({
    kind: referenceForModel(ConsoleOperatorConfigModel),
    isList: false,
    name: CONSOLE_OPERATOR_CONFIG_NAME,
  });
  const [enabledPlugins, setEnabledPlugins] = useState<string[]>([]);
  const { t } = useTranslation('olm');

  const {
    deprecatedPackage,
    deprecatedChannel,
    deprecatedVersion,
    setDeprecatedPackage,
  } = useDeprecatedOperatorWarnings();
  const deprecatedWarning =
    deprecatedPackage?.deprecation ||
    deprecatedChannel?.deprecation ||
    deprecatedVersion?.deprecation;

  useEffect(() => {
    setDeprecatedPackage(_.pick(packageManifest?.status, 'deprecation'));
  }, [packageManifest?.status, setDeprecatedPackage]);

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
  const suggestedNamespaceTemplate =
    getSuggestedNamespaceTemplate(currentCSVDesc.annotations, {
      // eslint-disable-next-line no-console
      onError: () => console.error('Could not parse JSON annotation.'),
    }) ?? {};
  const suggestedNamespaceTemplateName = suggestedNamespaceTemplate?.metadata?.name;
  const operatorRequestsMonitoring =
    currentCSVDesc.annotations?.['operatorframework.io/cluster-monitoring'] === 'true';
  const initializationResource = getInitializationResource(currentCSVDesc.annotations, {
    // eslint-disable-next-line no-console
    onError: () => console.error('Operator Hub Subscribe: Could not get initialization resource.'),
  });
  const canPatchConsoleOperatorConfig = useAccessReview({
    group: ConsoleOperatorConfigModel.apiGroup,
    resource: ConsoleOperatorConfigModel.plural,
    verb: 'patch',
    name: CONSOLE_OPERATOR_CONFIG_NAME,
  });
  const csvPlugins = getClusterServiceVersionPlugins(currentCSVDesc?.annotations);

  const initializationResourceReference = useMemo(
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
  const canCreateSubscription = useAccessReview({
    group: SubscriptionModel.apiGroup,
    resource: SubscriptionModel.plural,
    verb: 'create',
    namespace: selectedTargetNamespace,
  });

  const isSuggestedNamespaceSelected =
    operatorSuggestedNamespace && operatorSuggestedNamespace === selectedTargetNamespace;
  const showSuggestedNamespaceDetails =
    !suggestedNamespaceExistsInFlight && isSuggestedNamespaceSelected;
  useEffect(() => {
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

  useEffect(() => {
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

  useEffect(() => {
    setEnabledPlugins(isCatalogSourceTrusted(catalogSource) ? csvPlugins : []);
    // Use the JSON string directly from the annotation so the dependency is compared using string comparison
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [catalogSource, currentCSVDesc?.annotations?.['console.openshift.io/plugins']]);

  const manualSubscriptionsInNamespace = getManualSubscriptionsInNamespace(
    props.subscription.data,
    selectedTargetNamespace,
  );

  useEffect(() => {
    if (
      version !== currentLatestVersion ||
      manualSubscriptionsInNamespace?.length > 0 ||
      tokenizedAuth === 'AWS' ||
      tokenizedAuth === 'Azure' ||
      tokenizedAuth === 'GCP'
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

  const navigateToInstallPage = useCallback(
    (csvName: string) => {
      navigate(
        `/operatorhub/install/${catalogNamespace}/${catalog}/${pkg}/${csvName}/to/${selectedTargetNamespace}`,
      );
    },
    [catalog, catalogNamespace, navigate, pkg, selectedTargetNamespace],
  );

  if (!supportsSingle && !supportsGlobal) {
    return (
      <ConsoleEmptyState
        title={t("{{item}} can't be installed", {
          item: channels?.[0]?.currentCSVDesc?.displayName,
        })}
      >
        {t(
          'The Operator does not support to be made available in a single namespace (OwnNamespace installMode) or global installation (AllNamespaces installMode).  Use the CLI to install this Operator instead.',
        )}
      </ConsoleEmptyState>
    );
  }

  const descFor = (mode: InstallModeType) => {
    if (mode === InstallModeType.InstallModeTypeAllNamespaces && supportsGlobal) {
      return t('Operator will be available in all Namespaces.');
    }
    if (mode === InstallModeType.InstallModeTypeOwnNamespace && supportsSingle) {
      return t('Operator will be available in a single Namespace only.');
    }
    return t('This mode is not supported by this Operator');
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

    switch (tokenizedAuth) {
      case 'AWS':
        subscription.spec.config = {
          env: [
            {
              name: 'ROLEARN',
              value: roleARNText,
            },
          ],
        };
        break;
      case 'Azure':
        subscription.spec.config = {
          env: [
            {
              name: 'CLIENTID',
              value: azureClientId,
            },
            {
              name: 'TENANTID',
              value: azureTenantId,
            },
            {
              name: 'SUBSCRIPTIONID',
              value: azureSubscriptionId,
            },
            {
              name: 'RESOURCEGROUP',
              value: azureResourceGroup,
            },
          ],
        };
        break;
      case 'GCP':
        subscription.spec.config = {
          env: [
            {
              name: 'PROJECT_NUMBER',
              value: gcpProjectNumber,
            },
            {
              name: 'POOL_ID',
              value: gcpPoolId,
            },
            {
              name: 'PROVIDER_ID',
              value: gcpProviderId,
            },
            {
              name: 'SERVICE_ACCOUNT_EMAIL',
              value: gcpServiceAcctEmail,
            },
          ],
        };
        break;
      default:
        break;
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
      setError(err.message || t('Could not create Operator Subscription.'));
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
    (tokenizedAuth === 'AWS' && _.isEmpty(roleARNText)) ||
    (tokenizedAuth === 'Azure' &&
      [azureClientId, azureTenantId, azureSubscriptionId, azureResourceGroup].some((v) =>
        _.isEmpty(v),
      )) ||
    (tokenizedAuth === 'GCP' &&
      [gcpProjectNumber, gcpPoolId, gcpProviderId, gcpServiceAcctEmail].some((v) => _.isEmpty(v)));

  const formError = () => {
    return (
      (error && (
        <Alert
          isInline
          className="co-alert co-alert--scrollable"
          variant="danger"
          title={t('An error occurred')}
        >
          <div className="co-pre-line">{error}</div>
        </Alert>
      )) ||
      (!namespaceSupports(selectedTargetNamespace)(selectedInstallMode) && (
        <Alert
          isInline
          className="co-alert"
          variant="danger"
          title={t('Namespace does not support installation mode')}
        >
          {selectedInstallMode === InstallModeType.InstallModeTypeOwnNamespace &&
          selectedTargetNamespace === globalNS ? (
            <>
              {t(
                'The {{namespace}} Namespace is reserved for global Operators that watch all Namespaces. To install an Operator in a single Namespace, select a different Namespace where the operand should run.',
                { namespace: selectedTargetNamespace },
              )}
            </>
          ) : (
            <>
              {t(
                'The OperatorGroup in the {{namespace}} Namespace does not support the {{mode}} installation mode. Select a different installation Namespace that supports this mode.',
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
          title={t('A Subscription for this Operator already exists in Namespace "{{namespace}}"', {
            namespace: selectedTargetNamespace,
          })}
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
        <Alert isInline className="co-alert" variant="danger" title={t('Operator conflicts exist')}>
          {t(
            'Installing this Operator in the selected Namespace would cause conflicts with another Operator providing these APIs:',
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
          title={t('Operator not available for selected Namespaces')}
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
        title={suggestedNamespaceExists ? t('Namespace already exists') : t('Namespace creation')}
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
            label={t('Enable Operator recommended cluster monitoring on this Namespace')}
            onChange={(_event, value) => setEnableMonitoring(value)}
            isChecked={enableMonitoring}
            data-checked-state={enableMonitoring}
          />
          {!props.packageManifest.data[0].metadata.labels.provider?.includes('Red Hat') && (
            <Alert
              isInline
              className="co-alert pf-v6-c-alert--top-margin"
              variant="warning"
              title={t('Namespace monitoring')}
            >
              <>
                {t(
                  'Please note that installing non-Red Hat operators into OpenShift namespaces and enabling monitoring voids user support. Enabling cluster monitoring for non-Red Hat operators can lead to malicious metrics data overriding existing cluster metrics.',
                )}
                {!isManaged() && (
                  <Trans ns="olm">
                    {' '}
                    For more information, see the{' '}
                    <ExternalLink href={monitoringURL}>
                      cluster monitoring documentation
                    </ExternalLink>
                    .
                  </Trans>
                )}
              </>
            </Alert>
          )}
        </div>
      )}
    </>
  );

  const installedNamespaceOptions = (
    <div className="pf-v6-c-form">
      <FormGroup role="radiogroup" fieldId="operator-namespace" isStack className="form-group">
        <Radio
          id="operator-namespace-recommended"
          name="operator-namespace"
          value={operatorSuggestedNamespace}
          label={
            <>
              {t('Operator recommended Namespace:')} <ResourceIcon kind="Project" />
              <b>{operatorSuggestedNamespace}</b>
            </>
          }
          onChange={() => {
            setUseSuggestedNSForSingleInstallMode(true);
            setTargetNamespace(operatorSuggestedNamespace);
          }}
          isChecked={useSuggestedNSForSingleInstallMode}
          data-checked-state={useSuggestedNSForSingleInstallMode}
        />
        <Radio
          id="operator-namespace-select"
          name="operator-namespace"
          value={operatorSuggestedNamespace}
          label={t('Select a Namespace')}
          onChange={() => {
            setUseSuggestedNSForSingleInstallMode(false);
            setTargetNamespace(null);
          }}
          isChecked={!useSuggestedNSForSingleInstallMode}
          data-checked-state={!useSuggestedNSForSingleInstallMode}
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
              variant="warning"
              title={t(
                'Not installing the Operator into the recommended namespace can cause unexpected behavior.',
              )}
            />
          </>
        )}
      </FormGroup>
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
      <DocumentTitle>Operator Installation</DocumentTitle>
      <PageHeading
        title={t('Install Operator')}
        breadcrumbs={[
          {
            name: t('Software Catalog'),
            path: `/catalog/ns/${activeNamespace}?catalogType=operator&${search.toString()}`,
          },
          { name: t('Operator Installation'), path: url },
        ]}
        helpText={t(
          'Install your Operator by subscribing to one of the update channels to keep the Operator up to date. The strategy determines either manual or automatic updates.',
        )}
      />
      <PaneBody>
        {tokenizedAuth === 'AWS' && (
          <DismissableAlert
            className="pf-v6-u-mb-md"
            title={t('Cluster in STS Mode')}
            variant={AlertVariant.warning}
          >
            {t(
              'This cluster is using AWS Security Token Service to reach the cloud API. In order for this operator to take the actions it requires directly with the cloud API, you will need to provide a role ARN (with an attached policy) during installation. Manual subscriptions are highly recommended as steps should be taken prior to upgrade to ensure that the permissions required by the next version are properly accounted for in the role. Please see the operator description for more details.',
            )}
          </DismissableAlert>
        )}
        {tokenizedAuth === 'Azure' && (
          <DismissableAlert
            className="pf-v6-u-mb-md"
            title={t('Cluster in Azure Workload Identity / Federated Identity Mode')}
            variant={AlertVariant.warning}
          >
            {t(
              'This cluster is using Azure Workload Identity / Federated Identity to reach the cloud API. In order for this operator to take the actions it requires directly with the cloud API, provide the Client ID, Tenant ID, and Subscription ID during installation. Manual subscriptions are highly recommended as steps should be taken before upgrade to ensure that the permissions required by the next version are properly accounted for in the role. See the operator description for more details.',
            )}
          </DismissableAlert>
        )}
        {tokenizedAuth === 'GCP' && (
          <DismissableAlert
            title={t('Cluster in GCP Workload Identity / Federated Identity Mode')}
            variant={AlertVariant.warning}
            className="pf-v6-u-mb-md"
          >
            {t(
              'This cluster is using GCP Workload Identity / Federated Identity to reach the cloud API. In order for this operator to take the actions it requires directly with the cloud API, provide the Pool ID, Provider ID, and Service Account Email during installation. Manual subscriptions are highly recommended as steps should be taken before upgrade to ensure that the permissions required by the next version are properly accounted for in the role. See the operator description for more details.',
            )}
          </DismissableAlert>
        )}
        <Grid hasGutter>
          <GridItem span={6}>
            <>
              {tokenizedAuth === 'AWS' && (
                <div className="form-group">
                  <InputField
                    label={t('role ARN')}
                    helpText={t('The role ARN required for the operator to access the cloud API.')}
                    placeholder={t('role ARN')}
                    ariaLabel={t('role ARN')}
                    value={roleARNText}
                    setValue={setRoleARNText}
                  />
                </div>
              )}
              {tokenizedAuth === 'Azure' && (
                <div className="form-group">
                  <InputField
                    label={t('Azure Client ID')}
                    helpText={t(
                      'The Azure Client ID required for the operator to access the cloud API.',
                    )}
                    placeholder={t('Azure Client ID')}
                    ariaLabel={t('Azure Client ID')}
                    value={azureClientId}
                    setValue={setAzureClientId}
                  />
                  <InputField
                    label={t('Azure Tenant ID')}
                    helpText={t(
                      'The Azure Tenant ID required for the operator to access the cloud API.',
                    )}
                    placeholder={t('Azure Tenant ID')}
                    ariaLabel={t('Azure Tenant ID')}
                    value={azureTenantId}
                    setValue={setAzureTenantId}
                  />

                  <InputField
                    label={t('Azure Subscription ID')}
                    helpText={t(
                      'The Azure Subscription ID required for the operator to access the cloud API.',
                    )}
                    placeholder={t('Azure Subscription ID')}
                    ariaLabel={t('Azure Subscription ID')}
                    value={azureSubscriptionId}
                    setValue={setAzureSubscriptionId}
                  />
                  <InputField
                    label={t('Azure Resource Group')}
                    helpText={t(
                      'The Azure Resource Group required for the operator to access cloud resources.',
                    )}
                    placeholder={t('Azure Resource Group')}
                    ariaLabel={t('Azure Resource Group')}
                    value={azureResourceGroup}
                    setValue={setAzureResourceGroup}
                  />
                </div>
              )}
              {tokenizedAuth === 'GCP' && (
                <div className="form-group">
                  <InputField
                    label={t('GCP Project Number')}
                    helpText={t(
                      'The GCP Project Number required for the operator to access the cloud API.',
                    )}
                    placeholder={t('GCP Project Number')}
                    ariaLabel={t('GCP Project Number')}
                    value={gcpProjectNumber}
                    setValue={setGcpProjectNumber}
                  />
                  <InputField
                    label={t('GCP Pool ID')}
                    helpText={t(
                      'The GCP Pool ID required for the operator to access the cloud API.',
                    )}
                    placeholder={t('GCP Pool ID')}
                    ariaLabel={t('GCP Pool ID')}
                    value={gcpPoolId}
                    setValue={setGcpPoolId}
                  />
                  <InputField
                    label={t('GCP Provider ID')}
                    helpText={t(
                      'The GCP Provider ID required for the operator to access the cloud API.',
                    )}
                    placeholder={t('GCP Provider ID')}
                    ariaLabel={t('GCP Provider ID')}
                    value={gcpProviderId}
                    setValue={setGcpProviderId}
                  />
                  <InputField
                    label={t('Service Account Email')}
                    helpText={t(
                      'The GCP Service Account Email required for the operator to access the cloud API.',
                    )}
                    placeholder={t('GCP Service Account Email')}
                    ariaLabel={t('GCP Service Account Email')}
                    value={gcpServiceAcctEmail}
                    setValue={setGcpServiceAcctEmail}
                  />
                </div>
              )}
              <div className="form-group">
                <fieldset>
                  <label className="co-required">{t('Update channel')}</label>
                  <FieldLevelHelp>
                    {t('The channel to track and receive the updates from.')}
                  </FieldLevelHelp>
                  <OperatorChannelSelect
                    packageManifest={props.packageManifest.data[0]}
                    selectedUpdateChannel={updateChannelName}
                    setUpdateChannel={setUpdateChannelName}
                    setUpdateVersion={setUpdateVersion}
                  />
                </fieldset>
              </div>
              <div className="form-group">
                <fieldset>
                  <label className="co-required">{t('Version')}</label>
                  <OperatorVersionSelect
                    packageManifest={props.packageManifest.data[0]}
                    selectedUpdateChannel={updateChannelName}
                    updateVersion={updateVersion}
                    setUpdateVersion={setUpdateVersion}
                    showVersionAlert
                  />
                </fieldset>
              </div>
              <div className="pf-v6-c-form">
                <fieldset>
                  <label className="co-required">{t('Installation mode')}</label>
                  <FormGroup
                    role="radiogroup"
                    fieldId="operator-install-mode"
                    isStack
                    className="form-group"
                  >
                    <Radio
                      id="operator-install-mode-all-namespaces"
                      name="operator-install-mode"
                      value={InstallModeType.InstallModeTypeAllNamespaces}
                      label={`${t('All namespaces on the cluster')} ${t('(default)')}`}
                      description={descFor(InstallModeType.InstallModeTypeAllNamespaces)}
                      onChange={(e) => {
                        setInstallMode((e.target as HTMLInputElement).value);
                        setTargetNamespace(null);
                        setCannotResolve(false);
                      }}
                      isChecked={
                        selectedInstallMode === InstallModeType.InstallModeTypeAllNamespaces
                      }
                      data-checked-state={
                        selectedInstallMode === InstallModeType.InstallModeTypeAllNamespaces
                      }
                      isDisabled={!supportsGlobal}
                      data-test="All namespaces on the cluster-radio-input"
                    />
                    <Radio
                      id="operator-install-mode-own-namespace"
                      name="operator-install-mode"
                      value={InstallModeType.InstallModeTypeOwnNamespace}
                      label={t('A specific namespace on the cluster')}
                      description={descFor(InstallModeType.InstallModeTypeOwnNamespace)}
                      onChange={(e) => {
                        setInstallMode((e.target as HTMLInputElement).value);
                        setTargetNamespace(
                          useSuggestedNSForSingleInstallMode ? operatorSuggestedNamespace : null,
                        );
                        setCannotResolve(false);
                      }}
                      isChecked={
                        selectedInstallMode === InstallModeType.InstallModeTypeOwnNamespace
                      }
                      data-checked-state={
                        selectedInstallMode === InstallModeType.InstallModeTypeOwnNamespace
                      }
                      isDisabled={!supportsSingle}
                      data-test="A specific namespace on the cluster-radio-input"
                    />
                  </FormGroup>
                </fieldset>
              </div>
              <div className="form-group">
                <label className="co-required" htmlFor="dropdown-selectbox">
                  {t('Installed Namespace')}
                </label>
                {selectedInstallMode === InstallModeType.InstallModeTypeAllNamespaces &&
                  globalNamespaceInstallMode}
                {selectedInstallMode === InstallModeType.InstallModeTypeOwnNamespace &&
                  singleNamespaceInstallMode}
              </div>
              <FormGroup
                role="radiogroup"
                fieldId="operator-approval"
                isStack
                className="form-group"
              >
                <fieldset>
                  <label className="co-required">{t('Update approval')}</label>
                  <FieldLevelHelp>
                    {t('The strategy to determine either manual or automatic updates.')}
                  </FieldLevelHelp>
                  <RadioGroup
                    currentValue={approval}
                    items={[
                      {
                        name: 'operator-approval-strategy',
                        value: InstallPlanApproval.Automatic,
                        label: t('Automatic'),
                        disabled: isApprovalItemDisabled,
                      },
                      {
                        name: 'operator-approval-strategy',
                        value: InstallPlanApproval.Manual,
                        label: t('Manual'),
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
                        title={t('Will function as manual approval strategy')}
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
                      title={t('Manual approval applies to all operators in a namespace')}
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
              </FormGroup>
              {csvPlugins.length > 0 && consoleOperatorConfig && canPatchConsoleOperatorConfig && (
                <div className="pf-v6-c-form">
                  <ConsolePluginFormGroup
                    catalogSource={catalogSource}
                    csvPlugins={csvPlugins}
                    enabledPlugins={enabledPlugins}
                    setPluginEnabled={setPluginEnabled}
                  />
                </div>
              )}
            </>
            {deprecatedWarning && (
              <DeprecatedOperatorWarningAlert
                deprecatedPackage={deprecatedPackage}
                deprecatedChannel={deprecatedChannel}
                deprecatedVersion={deprecatedVersion}
              />
            )}
            <div className="co-form-section__separator" />
            {formError()}
            <ActionGroup className="pf-v6-c-form">
              <Button
                data-test="install-operator"
                onClick={() => submit()}
                isDisabled={formValid() || !canCreateSubscription}
                variant="primary"
              >
                {t('Install')}
              </Button>
              <Button variant="secondary" onClick={handleCancel}>
                {t('Cancel')}
              </Button>
            </ActionGroup>
          </GridItem>
          <GridItem span={6}>
            <ClusterServiceVersionLogo
              displayName={
                currentCSVDesc?.displayName || channels?.[0]?.currentCSVDesc?.displayName
              }
              icon={iconFor(props.packageManifest.data[0])}
              provider={provider}
              deprecation={packageManifest?.status?.deprecation}
            />
            <Title headingLevel="h4" className="pf-v6-u-mb-sm">
              {t('Provided APIs')}
            </Title>
            <Flex className="pf-v6-u-mb-md" gap={{ default: 'gapXl' }}>
              {!providedAPIs.length ? (
                <span className="pf-v6-u-text-color-subtle">
                  {t('No Kubernetes APIs are provided by this Operator.')}
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
            </Flex>
          </GridItem>
        </Grid>
      </PaneBody>
    </>
  );
};

const OperatorHubSubscribe: FC<OperatorHubSubscribeFormProps> = (props) => (
  <StatusBox
    data={props.packageManifest?.data?.[0]}
    loaded={props.loaded}
    loadError={props.loadError}
  >
    <OperatorHubSubscribeForm {...props} />
  </StatusBox>
);

export const OperatorHubSubscribePage: FC = () => {
  const [activeNamespace] = useActiveNamespace();
  const resources = useK8sWatchResources<{
    operatorGroup: OperatorGroupKind[];
    packageManifest: PackageManifestKind[];
    subscription: SubscriptionKind[];
  }>({
    operatorGroup: {
      isList: true,
      kind: referenceForModel(OperatorGroupModel),
    },
    packageManifest: {
      isList: true,
      kind: referenceForModel(PackageManifestModel),
      namespace: new URLSearchParams(window.location.search).get('catalogNamespace'),
      fieldSelector: `metadata.name=${new URLSearchParams(window.location.search).get('pkg')}`,
      selector: {
        matchLabels: {
          catalog: new URLSearchParams(window.location.search).get('catalog'),
        },
      },
    },
    subscription: {
      isList: true,
      kind: referenceForModel(SubscriptionModel),
    },
  });

  const resourceValues = Object.values(resources);
  const loaded =
    resourceValues.length === 0 || resourceValues.every((r) => r.loaded || r.loadError);
  const loadError = resourceValues.find((r) => r.loadError)?.loadError;

  return (
    <OperatorHubSubscribe
      {...resources}
      namespace={activeNamespace}
      loaded={loaded}
      loadError={loadError}
      targetNamespace={new URLSearchParams(window.location.search).get('targetNamespace') || null}
    />
  );
};

type OperatorHubSubscribeFormProps = {
  loaded: boolean;
  loadError?: any;
  namespace: string;
  targetNamespace?: string;
  operatorGroup: { loaded: boolean; data: OperatorGroupKind[] };
  packageManifest: { loaded: boolean; data: PackageManifestKind[] };
  subscription: { loaded: boolean; data: SubscriptionKind[] };
};

type InputFieldProps = {
  label: string;
  helpText: string;
  placeholder: string;
  ariaLabel: string;
  value: string;
  setValue: (value: string) => void;
};

OperatorHubSubscribe.displayName = 'OperatorHubSubscribe';
OperatorHubSubscribeForm.displayName = 'OperatorHubSubscribeForm';
OperatorHubSubscribePage.displayName = 'OperatorHubSubscribePage';
