import type { FC } from 'react';
import { useMemo, useCallback } from 'react';
import {
  Alert,
  Button,
  Card,
  CardBody,
  CardFooter,
  Popover,
  CardTitle,
  DescriptionList,
  DescriptionListGroup,
  DescriptionListTerm,
  DescriptionListDescription,
  Flex,
  Grid,
  GridItem,
} from '@patternfly/react-core';
import { AddCircleOIcon } from '@patternfly/react-icons/dist/esm/icons/add-circle-o-icon';
import { PencilAltIcon } from '@patternfly/react-icons/dist/esm/icons/pencil-alt-icon';
import { css } from '@patternfly/react-styles';
import { sortable, wrappable } from '@patternfly/react-table';
import * as _ from 'lodash';
import { Trans, useTranslation } from 'react-i18next';
import { useParams, useLocation, Link } from 'react-router-dom-v5-compat';
import type { WatchK8sResource } from '@console/dynamic-plugin-sdk';
import {
  ResourceStatus,
  StatusIconAndText,
  useAccessReviewAllowed,
  useAccessReview,
} from '@console/dynamic-plugin-sdk';
import { useOverlay } from '@console/dynamic-plugin-sdk/src/app/modal-support/useOverlay';
import { getGroupVersionKindForModel } from '@console/dynamic-plugin-sdk/src/lib-core';
import { Conditions, ConditionTypes } from '@console/internal/components/conditions';
import { ResourceEventStream } from '@console/internal/components/events';
import type { RowFunctionArgs, Flatten } from '@console/internal/components/factory';
import { DetailsPage, Table, TableData, MultiListPage } from '@console/internal/components/factory';
import type { FirehoseResult, Page } from '@console/internal/components/utils';
import {
  AsyncComponent,
  DOC_URL_OPERATORFRAMEWORK_SDK,
  documentationURLs,
  getDocumentationURL,
  isManaged,
  ConsoleEmptyState,
  navFactory,
  RequireCreatePermission,
  ResourceLink,
  resourceObjPath,
  ResourceSummary,
  ScrollToTopOnMount,
  SectionHeading,
  StatusBox,
} from '@console/internal/components/utils';
import { getBreadcrumbPath } from '@console/internal/components/utils/breadcrumbs';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { ConsoleOperatorConfigModel } from '@console/internal/models';
import type { K8sResourceCommon, K8sResourceKind } from '@console/internal/module/k8s';
import { referenceForModel, referenceFor } from '@console/internal/module/k8s';
import { ALL_NAMESPACES_KEY, Status, getNamespace } from '@console/shared';
import { LazyActionMenu, ActionMenuVariant } from '@console/shared/src/components/actions';
import { KEBAB_COLUMN_CLASS } from '@console/shared/src/components/actions/LazyActionMenu';
import { Timestamp } from '@console/shared/src/components/datetime/Timestamp';
import { DescriptionListTermHelp } from '@console/shared/src/components/description-list/DescriptionListTermHelp';
import { DocumentTitle } from '@console/shared/src/components/document-title/DocumentTitle';
import { withFallback } from '@console/shared/src/components/error';
import PaneBody from '@console/shared/src/components/layout/PaneBody';
import { ExternalLink } from '@console/shared/src/components/links/ExternalLink';
import ConsolePluginModalProvider from '@console/shared/src/components/modals/ConsolePluginModal';
import { RedExclamationCircleIcon } from '@console/shared/src/components/status/icons';
import { CONSOLE_OPERATOR_CONFIG_NAME } from '@console/shared/src/constants';
import { useActiveNamespace } from '@console/shared/src/hooks/redux-selectors';
import { useK8sModel } from '@console/shared/src/hooks/useK8sModel';
import { isPluginEnabled } from '@console/shared/src/utils';
import { GLOBAL_OPERATOR_NAMESPACES, GLOBAL_COPIED_CSV_NAMESPACE } from '../const';
import {
  ClusterServiceVersionModel,
  SubscriptionModel,
  PackageManifestModel,
  CatalogSourceModel,
  InstallPlanModel,
  OperatorGroupModel,
} from '../models';
import { subscriptionForCSV, getSubscriptionStatus } from '../status/csv-status';
import type {
  APIServiceDefinition,
  CatalogSourceKind,
  ClusterServiceVersionKind,
  CRDDescription,
  SubscriptionKind,
} from '../types';
import { ClusterServiceVersionPhase, CSVConditionReason } from '../types';
import { isCatalogSourceTrusted, upgradeRequiresApproval } from '../utils';
import { isCopiedCSV, isStandaloneCSV } from '../utils/clusterserviceversions';
import { useClusterServiceVersion } from '../utils/useClusterServiceVersion';
import { useClusterServiceVersionPath } from '../utils/useClusterServiceVersionPath';
import {
  ClusterServiceVersionHeaderIcon,
  ClusterServiceVersionHeaderTitle,
  ClusterServiceVersionLogo,
} from './cluster-service-version-logo';
import {
  DeprecatedOperatorWarningBadge,
  DeprecatedOperatorWarningAlert,
  findDeprecatedOperator,
} from './deprecated-operator-warnings/deprecated-operator-warnings';
import type { ProvidedAPIPageProps } from './operand';
import { ProvidedAPIsPage, ProvidedAPIPage } from './operand';
import { operatorGroupFor, operatorNamespaceFor, targetNamespacesFor } from './operator-group';
import { OLMAnnotation } from './operator-hub';
import {
  getClusterServiceVersionPlugins,
  getInitializationLink,
  getInitializationResource,
} from './operator-hub/operator-hub-utils';
import { CreateInitializationResourceButton } from './operator-install-page';
import type { SubscriptionDetailsProps } from './subscription';
import {
  SourceMissingStatus,
  SubscriptionDetails,
  UpgradeApprovalLink,
  catalogSourceForSubscription,
} from './subscription';
import { referenceForProvidedAPI, providedAPIsForCSV } from './index';

import './clusterserviceversion.scss';

const isSubscription = (obj) => referenceFor(obj) === referenceForModel(SubscriptionModel);
const isCSV = (obj): obj is ClusterServiceVersionKind =>
  referenceFor(obj) === referenceForModel(ClusterServiceVersionModel);
const isPackageServer = (obj) =>
  obj.metadata.name === 'packageserver' &&
  obj.metadata.namespace === 'openshift-operator-lifecycle-manager';

const nameColumnClass = '';
const namespaceColumnClass = '';
const managedNamespacesColumnClass = css('pf-m-hidden', 'pf-m-visible-on-sm');
const statusColumnClass = css('pf-m-hidden', 'pf-m-visible-on-lg');
const lastUpdatedColumnClass = css('pf-m-hidden', 'pf-m-visible-on-2xl');
const providedAPIsColumnClass = css('pf-m-hidden', 'pf-m-visible-on-xl');

const SubscriptionStatus: FC<{ muted?: boolean; subscription: SubscriptionKind }> = ({
  muted = false,
  subscription,
}) => {
  const { t } = useTranslation();
  if (!subscription) {
    return null;
  }

  if (upgradeRequiresApproval(subscription)) {
    return <UpgradeApprovalLink subscription={subscription} />;
  }

  const subscriptionStatus = getSubscriptionStatus(subscription);
  return (
    <span className={muted ? 'pf-v6-u-text-color-subtle' : 'co-icon-and-text'}>
      {muted ? (
        subscriptionStatus.title
      ) : (
        <Status status={subscriptionStatus.status || t('olm~Unknown')} />
      )}
    </span>
  );
};

const ClusterServiceVersionStatus: FC<ClusterServiceVersionStatusProps> = ({
  obj,
  subscription,
}) => {
  const status = obj?.status?.phase;
  if (obj.metadata.deletionTimestamp) {
    return (
      <span className="co-icon-and-text">
        <Status status={ClusterServiceVersionPhase.CSVPhaseDeleting} />
      </span>
    );
  }
  return status ? (
    <>
      <span className="co-icon-and-text">
        <Status status={status} />
      </span>
      <SubscriptionStatus muted subscription={subscription} />
    </>
  ) : null;
};

const ManagedNamespaces: FC<ManagedNamespacesProps> = ({ obj }) => {
  const { t } = useTranslation();
  const managedNamespaces = targetNamespacesFor(obj)?.split(',') || [];
  if (isCopiedCSV(obj)) {
    return (
      <>
        <ResourceLink
          kind="Namespace"
          title={obj.metadata.namespace}
          name={obj.metadata.namespace}
        />
        <span className="pf-v6-u-text-color-subtle">{obj.status.message}</span>
      </>
    );
  }

  switch (managedNamespaces.length) {
    case 0:
      return <>{t('olm~All Namespaces')}</>;
    case 1:
      return managedNamespaces[0] ? (
        <ResourceLink kind="Namespace" title={managedNamespaces[0]} name={managedNamespaces[0]} />
      ) : (
        <>{t('olm~All Namespaces')}</>
      );
    default:
      return (
        <Popover
          headerContent={t('olm~Managed Namespaces')}
          bodyContent={managedNamespaces.map((namespace) => (
            <ResourceLink kind="Namespace" title={namespace} name={namespace} />
          ))}
        >
          <Button variant="link" isInline>
            {t('olm~{{count}} Namespaces', { count: managedNamespaces.length })}
          </Button>
        </Popover>
      );
  }
};

const ConsolePlugins: FC<ConsolePluginsProps> = ({ csvPlugins, trusted }) => {
  const launchOverlay = useOverlay();
  const console: WatchK8sResource = {
    kind: referenceForModel(ConsoleOperatorConfigModel),
    isList: false,
    name: CONSOLE_OPERATOR_CONFIG_NAME,
  };
  const [consoleOperatorConfig] = useK8sWatchResource<K8sResourceKind>(console);
  const { t } = useTranslation();
  const [canPatchConsoleOperatorConfig] = useAccessReview({
    group: ConsoleOperatorConfigModel.apiGroup,
    resource: ConsoleOperatorConfigModel.plural,
    verb: 'patch',
    name: CONSOLE_OPERATOR_CONFIG_NAME,
  });
  const csvPluginsCount = csvPlugins.length;

  return (
    <>
      {consoleOperatorConfig && canPatchConsoleOperatorConfig && (
        <DescriptionList className="co-clusterserviceversion-details__field">
          <DescriptionListGroup>
            <DescriptionListTerm>
              {t('olm~Console plugin', { count: csvPluginsCount })}
            </DescriptionListTerm>
            {csvPlugins.map((pluginName) => (
              <DescriptionListDescription
                key={pluginName}
                className="co-clusterserviceversion-details__field-description"
              >
                <strong className="pf-v6-u-text-color-subtle">{pluginName}: </strong>
                <Button
                  data-test="edit-console-plugin"
                  type="button"
                  isInline
                  onClick={() =>
                    launchOverlay(ConsolePluginModalProvider, {
                      consoleOperatorConfig,
                      pluginName,
                      trusted,
                    })
                  }
                  variant="link"
                  icon={<PencilAltIcon />}
                  iconPosition="end"
                >
                  <>
                    {isPluginEnabled(consoleOperatorConfig, pluginName)
                      ? t('olm~Enabled')
                      : t('olm~Disabled')}
                  </>
                </Button>
              </DescriptionListDescription>
            ))}
          </DescriptionListGroup>
        </DescriptionList>
      )}
    </>
  );
};

const ConsolePluginStatus: FC<ConsolePluginStatusProps> = ({ csv, csvPlugins }) => {
  const console: WatchK8sResource = {
    kind: referenceForModel(ConsoleOperatorConfigModel),
    isList: false,
    name: CONSOLE_OPERATOR_CONFIG_NAME,
  };
  const [consoleOperatorConfig] = useK8sWatchResource<K8sResourceKind>(console);
  const { t } = useTranslation();
  const [canPatchConsoleOperatorConfig] = useAccessReview({
    group: ConsoleOperatorConfigModel.apiGroup,
    resource: ConsoleOperatorConfigModel.plural,
    verb: 'patch',
    name: CONSOLE_OPERATOR_CONFIG_NAME,
  });

  return (
    consoleOperatorConfig &&
    canPatchConsoleOperatorConfig &&
    csvPlugins.length > 0 && (
      <Popover
        headerContent={<div>{t('olm~Console plugin available')}</div>}
        bodyContent={
          <div>
            <p>
              {t(
                'olm~To let this operator provide a custom interface and run its own code in your console, enable its console plugin in the operator details.',
              )}
            </p>
            <Link to={resourceObjPath(csv, referenceFor(csv))}>
              {t('olm~View operator details')}
            </Link>
          </div>
        }
        appendTo="inline"
      >
        <Button variant="link" isInline>
          {t('olm~Plugin available')}
        </Button>
      </Popover>
    )
  );
};

export const ClusterServiceVersionTableRow = withFallback<ClusterServiceVersionTableRowProps>(
  ({ activeNamespace, obj, subscription, catalogSourceMissing }) => {
    const { displayName, provider, version } = obj.spec ?? {};
    const { t } = useTranslation();
    const olmOperatorNamespace = operatorNamespaceFor(obj) ?? '';
    const [icon] = obj.spec.icon ?? [];
    const route = useClusterServiceVersionPath(obj);
    const providedAPIs = providedAPIsForCSV(obj);
    const csvPlugins = getClusterServiceVersionPlugins(obj?.metadata?.annotations);
    const { deprecatedPackage } = findDeprecatedOperator(subscription);

    return (
      <>
        {/* Name */}
        <TableData className={nameColumnClass}>
          <Link
            to={route}
            className="co-clusterserviceversion-link"
            data-test-operator-row={displayName}
          >
            <ClusterServiceVersionLogo
              icon={icon}
              displayName={displayName}
              version={version}
              provider={provider}
            />
          </Link>
        </TableData>

        {/* Operator Namespace */}
        {activeNamespace === ALL_NAMESPACES_KEY ? (
          <TableData className={namespaceColumnClass}>
            <ResourceLink
              kind="Namespace"
              title={olmOperatorNamespace}
              name={olmOperatorNamespace}
            />
          </TableData>
        ) : null}

        {/* Managed Namespaces */}
        <TableData className={managedNamespacesColumnClass}>
          <ManagedNamespaces obj={obj} />
        </TableData>

        {/* Status */}
        <TableData className={statusColumnClass}>
          <div className="co-clusterserviceversion-row__status">
            {catalogSourceMissing ? (
              <SourceMissingStatus />
            ) : (
              <ClusterServiceVersionStatus obj={obj} subscription={subscription} />
            )}
          </div>
          {csvPlugins.length > 0 && <ConsolePluginStatus csv={obj} csvPlugins={csvPlugins} />}
          {deprecatedPackage.deprecation && (
            <DeprecatedOperatorWarningBadge
              className="pf-v6-u-mt-xs"
              deprecation={deprecatedPackage.deprecation}
            />
          )}
        </TableData>

        {/* Last Updated */}
        <TableData className={lastUpdatedColumnClass}>
          {obj.status == null ? '-' : <Timestamp timestamp={obj.status.lastUpdateTime} />}
        </TableData>

        {/* Provided APIs */}
        <TableData className={providedAPIsColumnClass}>
          {!_.isEmpty(providedAPIs)
            ? _.take(providedAPIs, 4).map((desc) => (
                <div key={referenceForProvidedAPI(desc)}>
                  <Link to={`${route}/${referenceForProvidedAPI(desc)}`} title={desc.name}>
                    {desc.displayName || desc.kind}
                  </Link>
                </div>
              ))
            : '-'}
          {providedAPIs.length > 4 && (
            <Link
              to={route}
              title={t('olm~View {{numAPIs}} more...', { numAPIs: providedAPIs.length - 4 })}
            >
              {t('olm~View {{numAPIs}} more...', { numAPIs: providedAPIs.length - 4 })}
            </Link>
          )}
        </TableData>

        {/* Kebab */}
        <TableData className={KEBAB_COLUMN_CLASS}>
          <LazyActionMenu
            context={{ 'operator-actions': { resource: obj, subscription } }}
            variant={ActionMenuVariant.KEBAB}
          />
        </TableData>
      </>
    );
  },
);

export const SubscriptionTableRow: FC<SubscriptionTableRowProps> = ({
  activeNamespace,
  catalogSourceMissing,
  obj,
}) => {
  const { t } = useTranslation();
  const csvName = obj?.spec?.name;
  const namespace = getNamespace(obj);
  const route = resourceObjPath(obj, referenceForModel(SubscriptionModel));

  return (
    <>
      {/* Name */}
      <TableData className={nameColumnClass}>
        <Link to={route}>
          <ClusterServiceVersionLogo
            icon={null}
            displayName={csvName}
            version={null}
            provider={null}
          />
        </Link>
      </TableData>

      {/* Operator Namespace */}
      {activeNamespace === ALL_NAMESPACES_KEY ? (
        <TableData className={namespaceColumnClass}>
          <ResourceLink kind="Namespace" title={namespace} name={namespace} />
        </TableData>
      ) : null}

      {/* Managed Namespaces */}
      <TableData className={managedNamespacesColumnClass}>
        <span className="pf-v6-u-text-color-subtle">{t('olm~None')}</span>
      </TableData>

      {/* Status */}
      <TableData className={statusColumnClass}>
        {catalogSourceMissing ? <SourceMissingStatus /> : <SubscriptionStatus subscription={obj} />}
      </TableData>

      {/* Last Updated */}
      <TableData className={lastUpdatedColumnClass}>
        {obj.status == null ? '-' : <Timestamp timestamp={obj.status.lastUpdated} />}
      </TableData>

      {/* Provided APIs */}
      <TableData className={providedAPIsColumnClass}>
        <span className="pf-v6-u-text-color-subtle">{t('olm~None')}</span>
      </TableData>

      {/* Kebab */}
      <TableData className={KEBAB_COLUMN_CLASS}>
        <LazyActionMenu
          context={{ 'operator-actions': { resource: obj, subscription: obj } }}
          variant={ActionMenuVariant.KEBAB}
        />
      </TableData>
    </>
  );
};

const InstalledOperatorTableRow: FC<InstalledOperatorTableRowProps> = ({ obj, customData }) => {
  const { catalogSources, subscriptions, activeNamespace } = customData;
  const subscription = isCSV(obj)
    ? subscriptionForCSV(subscriptions, obj as ClusterServiceVersionKind)
    : (obj as SubscriptionKind);
  // Only warn about missing catalog sources if the user was able to list them
  // but exclude PackageServer as it does not have a subscription.
  const catalogSourceMissing =
    !_.isEmpty(catalogSources) &&
    !catalogSourceForSubscription(catalogSources, subscription) &&
    !isPackageServer(obj);

  return isCSV(obj) ? (
    <ClusterServiceVersionTableRow
      activeNamespace={activeNamespace}
      catalogSourceMissing={catalogSourceMissing}
      obj={obj as ClusterServiceVersionKind}
      subscription={subscription}
    />
  ) : (
    <SubscriptionTableRow
      activeNamespace={activeNamespace}
      catalogSourceMissing={catalogSourceMissing}
      obj={subscription as SubscriptionKind}
    />
  );
};

const CSVListEmptyMsg = () => {
  const { t } = useTranslation();
  return <ConsoleEmptyState title={t('olm~No Operators found')} />;
};

const CSVListNoDataEmptyMsg = () => {
  const { t } = useTranslation();
  const project = useActiveNamespace();
  const noOperatorsInSingleNamespaceMessage = t(
    'olm~No Operators are available for project {{project}}.',
    { project },
  );
  const noOperatorsInAllNamespacesMessage = t('olm~No Operators are available.');

  const [canListPackageManifests] = useAccessReview({
    group: PackageManifestModel.apiGroup,
    resource: PackageManifestModel.plural,
    verb: 'list',
  });

  const [canListOperatorGroups] = useAccessReview({
    group: OperatorGroupModel.apiGroup,
    resource: OperatorGroupModel.plural,
    verb: 'list',
  });

  const hasOperatorHubAccess = canListPackageManifests && canListOperatorGroups;

  const detail = (
    <>
      <div>
        {project === ALL_NAMESPACES_KEY
          ? noOperatorsInAllNamespacesMessage
          : noOperatorsInSingleNamespaceMessage}
      </div>
      {hasOperatorHubAccess && (
        <div>
          <Trans ns="olm">
            Discover and install Operators from the{' '}
            <Link to="/catalog?catalogType=operator">Software Catalog</Link>.
          </Trans>
        </div>
      )}
    </>
  );
  return <ConsoleEmptyState title={t('olm~No Operators found')}>{detail}</ConsoleEmptyState>;
};

export const ClusterServiceVersionList: FC<ClusterServiceVersionListProps> = ({
  subscriptions,
  catalogSources,
  data,
  ...rest
}) => {
  const { t } = useTranslation();
  const activeNamespace = useActiveNamespace();
  const nameHeader: Header = {
    title: t('olm~Name'),
    sortField: 'metadata.name',
    transforms: [sortable],
    props: { className: nameColumnClass },
  };

  const namespaceHeader: Header = {
    title: t('olm~Namespace'),
    sortFunc: 'getOperatorNamespace',
    transforms: [sortable],
    props: { className: namespaceColumnClass },
  };

  const managedNamespacesHeader: Header = {
    title: t('olm~Managed Namespaces'),
    sortFunc: 'formatTargetNamespaces',
    transforms: [sortable, wrappable],
    props: { className: managedNamespacesColumnClass },
  };

  const statusHeader: Header = {
    title: t('olm~Status'),
    props: { className: statusColumnClass },
  };

  const lastUpdatedHeader: Header = {
    title: t('olm~Last updated'),
    props: { className: lastUpdatedColumnClass },
  };

  const providedAPIsHeader: Header = {
    title: t('olm~Provided APIs'),
    props: { className: providedAPIsColumnClass },
  };

  const kebabHeader: Header = {
    title: '',
    props: { className: KEBAB_COLUMN_CLASS },
  };

  const AllProjectsTableHeader = (): Header[] => [
    nameHeader,
    namespaceHeader,
    managedNamespacesHeader,
    statusHeader,
    lastUpdatedHeader,
    providedAPIsHeader,
    kebabHeader,
  ];

  const SingleProjectTableHeader = (): Header[] => [
    nameHeader,
    managedNamespacesHeader,
    statusHeader,
    lastUpdatedHeader,
    providedAPIsHeader,
    kebabHeader,
  ];

  const filterOperators = (
    operators: (ClusterServiceVersionKind | SubscriptionKind)[],
    allNamespaceActive: boolean,
  ): (ClusterServiceVersionKind | SubscriptionKind)[] => {
    return operators.filter((operator) => {
      if (isSubscription(operator)) {
        return true;
      }
      if (allNamespaceActive) {
        return !isCopiedCSV(operator) && isStandaloneCSV(operator);
      }

      if (
        window.SERVER_FLAGS.copiedCSVsDisabled &&
        operator.metadata.namespace === GLOBAL_COPIED_CSV_NAMESPACE &&
        activeNamespace !== GLOBAL_COPIED_CSV_NAMESPACE
      ) {
        return isCopiedCSV(operator) && isStandaloneCSV(operator);
      }
      return isStandaloneCSV(operator);
    });
  };

  const formatTargetNamespaces = (obj: ClusterServiceVersionKind | SubscriptionKind): string => {
    if (obj.kind === 'Subscription') {
      return t('olm~None');
    }

    if (isCopiedCSV(obj)) {
      return obj.metadata.namespace;
    }

    const targetNamespaces = targetNamespacesFor(obj)?.split(',') ?? [];
    switch (targetNamespaces.length) {
      case 0:
        return t('olm~All Namespaces');
      case 1:
        return targetNamespaces[0];
      default:
        return t('olm~{{count}} Namespaces', { count: targetNamespaces.length });
    }
  };

  const getOperatorNamespace = (
    obj: ClusterServiceVersionKind | SubscriptionKind,
  ): string | null => {
    const olmOperatorNamespace = operatorNamespaceFor(obj);
    return olmOperatorNamespace ?? getNamespace(obj);
  };
  const allNamespaceActive = activeNamespace === ALL_NAMESPACES_KEY;

  const customData = useMemo(
    () => ({
      catalogoperators: catalogSources?.data ?? [],
      subscriptions: subscriptions?.data ?? [],
      activeNamespace,
    }),
    [activeNamespace, catalogSources, subscriptions],
  );

  return (
    <div className="co-installed-operators">
      <Table
        data={filterOperators(data, allNamespaceActive)}
        {...rest}
        aria-label={t('olm~Installed Operators')}
        Header={allNamespaceActive ? AllProjectsTableHeader : SingleProjectTableHeader}
        Row={InstalledOperatorTableRow}
        EmptyMsg={CSVListEmptyMsg}
        NoDataEmptyMsg={CSVListNoDataEmptyMsg}
        virtualize
        customData={customData}
        customSorts={{
          formatTargetNamespaces,
          getOperatorNamespace,
        }}
      />
    </div>
  );
};

export const ClusterServiceVersionsPage: FC<ClusterServiceVersionsPageProps> = (props) => {
  const { t } = useTranslation();
  const [canListAllSubscriptions] = useAccessReview({
    group: SubscriptionModel.apiGroup,
    resource: SubscriptionModel.plural,
    verb: 'list',
  });
  const title = t('olm~Installed Operators');
  const olmURL = getDocumentationURL(documentationURLs.operators);
  const helpText = (
    <>
      {t(
        'olm~Installed Operators are represented by ClusterServiceVersions within this Namespace.',
      )}
      {!isManaged() && (
        <Trans ns="olm">
          {' '}
          For more information, see the{' '}
          <ExternalLink href={olmURL}>Understanding Operators documentation</ExternalLink>. Or
          create an Operator and ClusterServiceVersion using the{' '}
          <ExternalLink href={DOC_URL_OPERATORFRAMEWORK_SDK}>Operator SDK</ExternalLink>.
        </Trans>
      )}
    </>
  );

  const flatten: Flatten<{
    globalClusterServiceVersions: ClusterServiceVersionKind[];
    clusterServiceVersions: ClusterServiceVersionKind[];
    subscriptions: SubscriptionKind[];
  }> = ({ globalClusterServiceVersions, clusterServiceVersions, subscriptions }) =>
    [
      ...(globalClusterServiceVersions?.data ?? []),
      ...(clusterServiceVersions?.data ?? []),
      ...(subscriptions?.data ?? []).filter(
        (sub) =>
          ['', sub.metadata.namespace].includes(props.namespace || '') &&
          _.isNil(_.get(sub, 'status.installedCSV')),
      ),
    ].filter(
      (obj, _i, all) =>
        isCSV(obj) ||
        _.isUndefined(
          all.find(({ metadata }) =>
            [obj?.status?.currentCSV, obj?.spec?.startingCSV].includes(metadata?.name),
          ),
        ),
    );

  return (
    <>
      <DocumentTitle>{title}</DocumentTitle>
      <MultiListPage
        {...props}
        resources={[
          ...(!GLOBAL_OPERATOR_NAMESPACES.includes(props.namespace) &&
          window.SERVER_FLAGS.copiedCSVsDisabled
            ? [
                {
                  kind: referenceForModel(ClusterServiceVersionModel),
                  namespace: GLOBAL_COPIED_CSV_NAMESPACE,
                  prop: 'globalClusterServiceVersions',
                  selector: {
                    matchExpressions: [
                      {
                        key: 'olm.copiedFrom',
                        operator: 'NotEquals',
                        values: [props.namespace],
                      },
                    ],
                  },
                },
              ]
            : []),
          {
            kind: referenceForModel(ClusterServiceVersionModel),
            namespace: props.namespace,
            prop: 'clusterServiceVersions',
          },
          {
            kind: referenceForModel(SubscriptionModel),
            prop: 'subscriptions',
            namespace: canListAllSubscriptions ? undefined : props.namespace,
            optional: true,
          },
          {
            kind: referenceForModel(CatalogSourceModel),
            prop: 'catalogSources',
            optional: true,
          },
        ]}
        title={title}
        flatten={flatten}
        namespace={props.namespace}
        ListComponent={ClusterServiceVersionList}
        helpText={helpText}
        textFilter="cluster-service-version"
      />
    </>
  );
};

export const MarkdownView = (props: {
  content: string;
  styles?: string;
  exactHeight?: boolean;
  truncateContent?: boolean;
}) => {
  return (
    <AsyncComponent
      loader={() =>
        import('@console/internal/components/markdown-view').then((c) => c.SyncMarkdownView)
      }
      {...props}
    />
  );
};

export const CRDCard: FC<CRDCardProps> = ({ csv, crd, required, ...rest }) => {
  const { t } = useTranslation();
  const reference = referenceForProvidedAPI(crd);
  const [model] = useK8sModel(reference);
  const canCreate = rest.canCreate ?? model?.verbs?.includes?.('create');
  const createRoute = useMemo(
    () =>
      csv
        ? `/k8s/ns/${csv.metadata.namespace}/${ClusterServiceVersionModel.plural}/${csv.metadata.name}/${reference}/~new`
        : null,
    [csv, reference],
  );

  return (
    <Card style={{ width: '300px' }}>
      <CardTitle>
        <span className="co-resource-item">
          <ResourceLink
            kind={referenceForProvidedAPI(crd)}
            title={crd.name}
            linkTo={false}
            displayName={crd.displayName || crd.kind}
          />
          {required && (
            <ResourceStatus badgeAlt>
              <StatusIconAndText icon={<RedExclamationCircleIcon />} title={t('olm~Required')} />
            </ResourceStatus>
          )}
        </span>
      </CardTitle>
      <CardBody>
        <MarkdownView content={crd.description} truncateContent />
      </CardBody>
      {canCreate && createRoute && (
        <RequireCreatePermission model={model} namespace={csv.metadata.namespace}>
          <CardFooter>
            <Link to={createRoute}>
              <AddCircleOIcon className="co-icon-space-r" />
              {t('olm~Create instance')}
            </Link>
          </CardFooter>
        </RequireCreatePermission>
      )}
    </Card>
  );
};

export const CRDCardRow = ({ csv, providedAPIs }: CRDCardRowProps) => {
  const { t } = useTranslation();
  return (
    <Flex className="pf-v6-u-mb-md" gap={{ default: 'gapXl' }}>
      {providedAPIs.length ? (
        providedAPIs.map((crd) => (
          <CRDCard key={referenceForProvidedAPI(crd)} crd={crd} csv={csv} />
        ))
      ) : (
        <span className="pf-v6-u-text-color-subtle">
          {t('olm~No Kubernetes APIs are being provided by this Operator.')}
        </span>
      )}
    </Flex>
  );
};

const InitializationResourceAlert: FC<InitializationResourceAlertProps> = (props) => {
  const { t } = useTranslation();
  const { initializationResource, csv } = props;

  const initializationResourceKind = initializationResource?.kind;
  const initializationResourceReference = referenceFor(initializationResource);
  const [model] = useK8sModel(initializationResourceReference);

  // Check if the CR is already present - only watches for the model in namespace
  const [customResource, customResourceLoaded] = useK8sWatchResource<K8sResourceCommon[]>({
    kind: initializationResourceReference,
    namespaced: true,
    isList: true,
  });

  const canCreateCustomResource = useAccessReviewAllowed({
    group: model?.apiGroup,
    resource: model?.plural,
    namespace: model?.namespaced
      ? initializationResource?.metadata.namespace || csv.metadata.namespace
      : null,
    verb: 'create',
  });

  if (customResourceLoaded && customResource.length === 0 && canCreateCustomResource) {
    return (
      <Alert
        isInline
        className="co-alert"
        variant="warning"
        title={t('olm~{{initializationResourceKind}} required', { initializationResourceKind })}
      >
        <p>
          {t('olm~Create a {{initializationResourceKind}} instance to use this Operator.', {
            initializationResourceKind,
          })}
        </p>
        <CreateInitializationResourceButton
          obj={props.csv}
          initializationResource={initializationResource}
        />
      </Alert>
    );
  }
  return null;
};

export const ClusterServiceVersionDetails: FC<ClusterServiceVersionDetailsProps> = (props) => {
  const { t } = useTranslation();
  const { spec, metadata, status } = props.obj ?? {};
  const { subscription } = props.customData;
  const providedAPIs = providedAPIsForCSV(props.obj);
  const marketplaceSupportWorkflow = metadata?.annotations?.[OLMAnnotation.SupportWorkflow] || '';
  const initializationLink = getInitializationLink(metadata?.annotations);
  const initializationResource = useMemo(
    () =>
      !initializationLink &&
      getInitializationResource(metadata?.annotations, {
        onError: (error) => {
          // eslint-disable-next-line no-console
          console.error('Error while parsing CSV initialization resource JSON,', error.message);
        },
      }),
    [metadata?.annotations, initializationLink],
  );

  const supportWorkflowUrl = useMemo(() => {
    if (marketplaceSupportWorkflow) {
      try {
        const url = new URL(marketplaceSupportWorkflow);
        url.searchParams.set('utm_source', 'openshift_console');
        return url.toString();
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error while setting utm_source to support workflow URL', error.message);
      }
    }
    return null;
  }, [marketplaceSupportWorkflow]);

  const csvPlugins = getClusterServiceVersionPlugins(metadata?.annotations);
  const permissions = _.uniqBy(spec?.install?.spec?.permissions, 'serviceAccountName');
  const { deprecatedPackage, deprecatedChannel, deprecatedVersion } = findDeprecatedOperator(
    subscription,
  );

  return (
    <>
      <ScrollToTopOnMount />

      <PaneBody>
        <Grid hasGutter>
          <GridItem sm={9}>
            {status && status.phase === ClusterServiceVersionPhase.CSVPhaseFailed && (
              <Alert
                isInline
                className="co-alert"
                variant="danger"
                title={t('olm~Operator failed')}
              >
                {status.reason === CSVConditionReason.CSVReasonCopied ? (
                  <>
                    <Trans t={t} ns="olm">
                      This Operator was copied from another namespace. For the reason it failed, see{' '}
                      <ResourceLink
                        name={metadata.name}
                        kind={referenceForModel(ClusterServiceVersionModel)}
                        namespace={operatorNamespaceFor(props.obj)}
                        hideIcon
                        inline
                      />
                    </Trans>
                  </>
                ) : (
                  status.message
                )}
              </Alert>
            )}
            {initializationResource && (
              <InitializationResourceAlert
                initializationResource={initializationResource}
                csv={props.obj}
              />
            )}
            {(deprecatedPackage.deprecation ||
              deprecatedChannel.deprecation ||
              deprecatedVersion.deprecation) && (
              <DeprecatedOperatorWarningAlert
                deprecatedPackage={deprecatedPackage}
                deprecatedChannel={deprecatedChannel}
                deprecatedVersion={deprecatedVersion}
                dismissible
              />
            )}
            <SectionHeading text={t('olm~Provided APIs')} />
            <CRDCardRow csv={props.obj} providedAPIs={providedAPIs} />
            <SectionHeading text={t('olm~Description')} />
            <MarkdownView content={spec.description || t('olm~Not available')} />
          </GridItem>
          <GridItem sm={3}>
            <DescriptionList className="co-clusterserviceversion-details__field">
              <DescriptionListGroup>
                <DescriptionListTerm>{t('olm~Provider')}</DescriptionListTerm>
                <DescriptionListDescription>
                  {spec.provider && spec.provider.name
                    ? spec.provider.name
                    : t('olm~Not available')}
                </DescriptionListDescription>
              </DescriptionListGroup>
              {supportWorkflowUrl && (
                <DescriptionListGroup>
                  <DescriptionListTerm>{t('olm~Support')}</DescriptionListTerm>
                  <DescriptionListDescription>
                    <ExternalLink href={supportWorkflowUrl} text={t('olm~Get support')} />
                  </DescriptionListDescription>
                </DescriptionListGroup>
              )}
              <DescriptionListGroup>
                <DescriptionListTerm>{t('olm~Created at')}</DescriptionListTerm>
                <DescriptionListDescription>
                  <Timestamp timestamp={metadata.creationTimestamp} />
                </DescriptionListDescription>
              </DescriptionListGroup>
            </DescriptionList>
            {csvPlugins.length > 0 && subscription && (
              <ConsolePlugins
                csvPlugins={csvPlugins}
                trusted={isCatalogSourceTrusted(subscription?.spec?.source)}
              />
            )}
            <DescriptionList className="co-clusterserviceversion-details__field">
              <DescriptionListGroup>
                <DescriptionListTerm>{t('olm~Links')}</DescriptionListTerm>
                {spec.links && spec.links.length > 0 ? (
                  spec.links.map((link) => (
                    <DescriptionListDescription key={link.url}>
                      <div className="pf-v6-u-display-flex pf-v6-u-flex-direction-column">
                        {link.name}
                        <ExternalLink
                          href={link.url}
                          text={link.url || '-'}
                          className="co-break-all"
                        />
                      </div>
                    </DescriptionListDescription>
                  ))
                ) : (
                  <DescriptionListDescription>{t('olm~Not available')}</DescriptionListDescription>
                )}
              </DescriptionListGroup>
            </DescriptionList>
            <DescriptionList className="co-clusterserviceversion-details__field">
              <DescriptionListGroup>
                <DescriptionListTerm>{t('olm~Maintainers')}</DescriptionListTerm>
                {spec.maintainers && spec.maintainers.length > 0 ? (
                  spec.maintainers.map((maintainer) => (
                    <DescriptionListDescription
                      key={maintainer.email}
                      style={{ display: 'flex', flexDirection: 'column' }}
                    >
                      {maintainer.name}{' '}
                      <a href={`mailto:${maintainer.email}`} className="co-break-all">
                        {maintainer.email || '-'}
                      </a>
                    </DescriptionListDescription>
                  ))
                ) : (
                  <DescriptionListDescription>{t('olm~Not available')}</DescriptionListDescription>
                )}
              </DescriptionListGroup>
            </DescriptionList>
          </GridItem>
        </Grid>
      </PaneBody>
      <PaneBody>
        <SectionHeading text={t('olm~ClusterServiceVersion details')} />
        <Grid hasGutter>
          <GridItem sm={6}>
            <ResourceSummary resource={props.obj}>
              <DescriptionListGroup>
                <DescriptionListTermHelp
                  text={t('olm~Managed Namespaces')}
                  textHelp={t('olm~Operands in this Namespace are managed by the Operator.')}
                  popoverProps={{
                    maxWidth: '30rem',
                  }}
                />
                <DescriptionListDescription>
                  <ManagedNamespaces obj={props.obj} />
                </DescriptionListDescription>
              </DescriptionListGroup>
            </ResourceSummary>
          </GridItem>
          <GridItem sm={6}>
            <DescriptionList>
              <DescriptionListGroup>
                <DescriptionListTerm>{t('olm~Status')}</DescriptionListTerm>
                <DescriptionListDescription>
                  <Status status={status ? status.phase : t('olm~Unknown')} />
                </DescriptionListDescription>
              </DescriptionListGroup>
              <DescriptionListGroup>
                <DescriptionListTerm>{t('olm~Status reason')}</DescriptionListTerm>
                <DescriptionListDescription>
                  {status ? status.message : t('olm~Unknown')}
                </DescriptionListDescription>
              </DescriptionListGroup>
              {!_.isEmpty(spec.install.spec?.deployments) && (
                <DescriptionListGroup>
                  <DescriptionListTerm>{t('olm~Operator Deployments')}</DescriptionListTerm>
                  {spec.install.spec.deployments.map(({ name }) => (
                    <DescriptionListDescription key={name}>
                      <ResourceLink
                        name={name}
                        kind="Deployment"
                        namespace={operatorNamespaceFor(props.obj)}
                      />
                    </DescriptionListDescription>
                  ))}
                </DescriptionListGroup>
              )}
              {!_.isEmpty(permissions) && (
                <DescriptionListGroup>
                  <DescriptionListTerm>{t('olm~Operator ServiceAccounts')}</DescriptionListTerm>
                  {permissions.map(({ serviceAccountName }) => (
                    <DescriptionListDescription
                      key={serviceAccountName}
                      data-service-account-name={serviceAccountName}
                    >
                      <ResourceLink
                        name={serviceAccountName}
                        kind="ServiceAccount"
                        namespace={operatorNamespaceFor(props.obj)}
                      />
                    </DescriptionListDescription>
                  ))}
                </DescriptionListGroup>
              )}
              <DescriptionListGroup>
                <DescriptionListTerm>{t('olm~OperatorGroup')}</DescriptionListTerm>
                <DescriptionListDescription>
                  {operatorGroupFor(props.obj) ? (
                    <ResourceLink
                      name={operatorGroupFor(props.obj)}
                      namespace={operatorNamespaceFor(props.obj)}
                      kind={referenceForModel(OperatorGroupModel)}
                    />
                  ) : (
                    '-'
                  )}
                </DescriptionListDescription>
              </DescriptionListGroup>
            </DescriptionList>
          </GridItem>
        </Grid>
      </PaneBody>
      <PaneBody>
        <SectionHeading text={t('olm~Conditions')} />
        <Conditions
          conditions={(status?.conditions ?? []).map((c) => ({
            ...c,
            type: c.phase,
            status: 'True',
          }))}
          type={ConditionTypes.ClusterServiceVersion}
        />
      </PaneBody>
    </>
  );
};

export const CSVSubscription: FC<CSVSubscriptionProps> = ({ obj, customData, ...rest }) => {
  const { t } = useTranslation();
  const { subscription, subscriptions, subscriptionsLoaded, subscriptionsLoadError } =
    customData ?? {};
  const EmptyMsg = () => (
    <ConsoleEmptyState title={t('olm~No Operator Subscription')}>
      {t('olm~This Operator will not receive updates.')}
    </ConsoleEmptyState>
  );

  return (
    <StatusBox
      EmptyMsg={EmptyMsg}
      loaded={subscriptionsLoaded}
      loadError={subscriptionsLoadError}
      data={subscription}
    >
      <SubscriptionDetails
        {...rest}
        obj={subscription}
        clusterServiceVersions={[obj]}
        subscriptions={subscriptions}
      />
    </StatusBox>
  );
};

export const ClusterServiceVersionDetailsPage: FC = (props) => {
  const { t } = useTranslation();
  const params = useParams();
  const location = useLocation();
  const [csv, csvLoaded, csvLoadError] = useClusterServiceVersion(params.name, params.ns);
  const namespace = operatorNamespaceFor(csv);
  const [subscriptions, subscriptionsLoaded, subscriptionsLoadError] = useK8sWatchResource<
    SubscriptionKind[]
  >(
    namespace
      ? {
          isList: true,
          groupVersionKind: getGroupVersionKindForModel(SubscriptionModel),
          namespace,
          optional: true,
        }
      : null,
  );
  const [canListClusterScopeInstallPlans] = useAccessReview({
    group: InstallPlanModel?.apiGroup,
    resource: InstallPlanModel?.plural,
    verb: 'list',
  });

  const subscription = useMemo(
    () => (subscriptions ?? []).find((s) => s.status.installedCSV === csv?.metadata?.name),
    [csv, subscriptions],
  );

  const { deprecatedPackage } = findDeprecatedOperator(subscription);

  const pagesFor = useCallback((obj: ClusterServiceVersionKind) => {
    const providedAPIs = providedAPIsForCSV(obj);
    return [
      navFactory.details(ClusterServiceVersionDetails),
      navFactory.editYaml(),
      {
        href: 'subscription',
        // t('olm~Subscription')
        nameKey: 'olm~Subscription',
        component: CSVSubscription,
      },
      navFactory.events(ResourceEventStream),
      ...(providedAPIs.length > 1
        ? [
            {
              href: 'instances',
              // t('olm~All instances')
              nameKey: 'olm~All instances',
              component: ProvidedAPIsPage,
            },
          ]
        : []),
      ...providedAPIs.map<Page<ProvidedAPIPageProps>>((api: CRDDescription) => ({
        href: referenceForProvidedAPI(api),
        name: ['Details', 'YAML', 'Subscription', 'Events'].includes(api.displayName)
          ? `${api.displayName} Operand`
          : api.displayName || api.kind,
        component: ProvidedAPIPage,
        pageData: {
          csv: obj,
          kind: referenceForProvidedAPI(api),
        },
      })),
    ];
  }, []);

  return (
    <DetailsPage
      {...props}
      obj={{ data: csv, loaded: csvLoaded, loadError: csvLoadError }}
      customData={{ subscriptions, subscription, subscriptionsLoaded, subscriptionsLoadError }}
      breadcrumbsFor={() => [
        {
          name: t('olm~Installed Operators'),
          path: getBreadcrumbPath(params),
        },
        { name: t('olm~Operator details'), path: location.pathname },
      ]}
      resources={[
        { kind: referenceForModel(PackageManifestModel), isList: true, prop: 'packageManifests' },
        {
          kind: referenceForModel(InstallPlanModel),
          isList: true,
          prop: 'installPlans',
          ...(canListClusterScopeInstallPlans ? {} : { namespace }),
        },
      ]}
      icon={<ClusterServiceVersionHeaderIcon icon={csv?.spec?.icon?.[0]} />}
      OverrideTitle={({ obj }) => (
        <ClusterServiceVersionHeaderTitle
          displayName={obj?.spec?.displayName}
          provider={obj?.spec?.provider}
          version={obj?.spec?.version}
          deprecation={deprecatedPackage.deprecation}
        />
      )}
      namespace={params.ns}
      kind={referenceForModel(ClusterServiceVersionModel)}
      name={params.name}
      pagesFor={pagesFor}
      customActionMenu={[
        <LazyActionMenu
          context={{ 'operator-actions': { resource: csv, subscription } }}
          variant={ActionMenuVariant.DROPDOWN}
        />,
      ]}
      createRedirect
    />
  );
};

type ClusterServiceVersionStatusProps = {
  obj: ClusterServiceVersionKind;
  subscription: SubscriptionKind;
};

export type ClusterServiceVersionsPageProps = {
  kind: string;
  namespace: string;
  resourceDescriptions: CRDDescription[];
};

export type ClusterServiceVersionListProps = {
  loaded: boolean;
  loadError?: string;
  data: ClusterServiceVersionKind[];
  subscriptions: FirehoseResult<SubscriptionKind[]>;
  catalogSources: FirehoseResult<CatalogSourceKind[]>;
  activeNamespace?: string;
};

export type CRDCardProps = {
  canCreate?: boolean;
  crd: CRDDescription | APIServiceDefinition;
  csv?: ClusterServiceVersionKind;
  required?: boolean;
};

export type CRDCardRowProps = {
  providedAPIs: (CRDDescription | APIServiceDefinition)[];
  csv: ClusterServiceVersionKind;
};

export type CRDCardRowState = {
  expand: boolean;
};

export type ClusterServiceVersionDetailsProps = {
  obj: ClusterServiceVersionKind;
  customData: {
    subscriptions: SubscriptionKind[];
    subscription: SubscriptionKind;
    subscriptionsLoaded: boolean;
    subscriptionsLoadError?: any;
  };
};

type ConsolePluginsProps = {
  csvPlugins: string[];
  trusted: boolean;
};

type ConsolePluginStatusProps = {
  csv: ClusterServiceVersionKind;
  csvPlugins: string[];
};

type InstalledOperatorTableRowProps = RowFunctionArgs<
  ClusterServiceVersionKind | SubscriptionKind,
  {
    activeNamespace: string;
    catalogSources: CatalogSourceKind[];
    subscriptions: SubscriptionKind[];
  }
>;

export type ClusterServiceVersionTableRowProps = {
  obj: ClusterServiceVersionKind;
  catalogSourceMissing: boolean;
  subscription: SubscriptionKind;
  activeNamespace?: string;
};

type SubscriptionTableRowProps = {
  obj: SubscriptionKind;
  catalogSourceMissing: boolean;
  activeNamespace?: string;
};

type ManagedNamespacesProps = {
  obj: ClusterServiceVersionKind;
};

export type CSVSubscriptionProps = Omit<
  SubscriptionDetailsProps,
  'obj' | 'clusterServiceVersions' | 'subscriptions'
> &
  ClusterServiceVersionDetailsProps;

type InitializationResourceAlertProps = {
  csv: ClusterServiceVersionKind;
  initializationResource: K8sResourceCommon;
};

type Header = {
  title: string;
  sortField?: string;
  sortFunc?: string;
  transforms?: any;
  props: { className: string };
};

// TODO(alecmerdler): Find Webpack loader/plugin to add `displayName` to React components automagically
ClusterServiceVersionList.displayName = 'ClusterServiceVersionList';
ClusterServiceVersionsPage.displayName = 'ClusterServiceVersionsPage';
ClusterServiceVersionTableRow.displayName = 'ClusterServiceVersionTableRow';
CRDCard.displayName = 'CRDCard';
ClusterServiceVersionDetailsPage.displayName = 'ClusterServiceVersionsDetailsPage';
ClusterServiceVersionDetails.displayName = 'ClusterServiceVersionDetails';
CSVSubscription.displayName = 'CSVSubscription';
