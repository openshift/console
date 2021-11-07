import * as React from 'react';
import {
  Alert,
  Button,
  Card,
  CardBody,
  CardFooter,
  Popover,
  CardTitle,
} from '@patternfly/react-core';
import { AddCircleOIcon, PencilAltIcon } from '@patternfly/react-icons';
import { sortable, wrappable } from '@patternfly/react-table';
import * as classNames from 'classnames';
import * as _ from 'lodash';
import { Helmet } from 'react-helmet';
import { Trans, useTranslation } from 'react-i18next';
import { Link, match as RouterMatch } from 'react-router-dom';
import { WatchK8sResource } from '@console/dynamic-plugin-sdk';
import { Conditions } from '@console/internal/components/conditions';
import { ResourceEventStream } from '@console/internal/components/events';
import {
  DetailsPage,
  Table,
  TableData,
  MultiListPage,
  RowFunctionArgs,
  Flatten,
} from '@console/internal/components/factory';
import {
  Kebab,
  MsgBox,
  navFactory,
  ResourceKebab,
  ResourceLink,
  Timestamp,
  SectionHeading,
  ResourceSummary,
  ResourceStatus,
  ScrollToTopOnMount,
  AsyncComponent,
  ExternalLink,
  FirehoseResult,
  StatusBox,
  RequireCreatePermission,
  resourcePathFromModel,
  KebabOption,
  resourceObjPath,
  KebabAction,
  isUpstream,
  openshiftHelpBase,
  Page,
} from '@console/internal/components/utils';
import { getBreadcrumbPath } from '@console/internal/components/utils/breadcrumbs';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { useAccessReview } from '@console/internal/components/utils/rbac';
import { ConsoleOperatorConfigModel } from '@console/internal/models';
import {
  modelFor,
  referenceForModel,
  referenceFor,
  groupVersionFor,
  k8sKill,
  k8sPatch,
  k8sGet,
  K8sResourceCommon,
  K8sResourceKind,
} from '@console/internal/module/k8s';
import { ALL_NAMESPACES_KEY, Status, getNamespace, StatusIconAndText } from '@console/shared';
import { withFallback } from '@console/shared/src/components/error/error-boundary';
import { consolePluginModal } from '@console/shared/src/components/modals';
import { RedExclamationCircleIcon } from '@console/shared/src/components/status/icons';
import { CONSOLE_OPERATOR_CONFIG_NAME } from '@console/shared/src/constants';
import { useActiveNamespace } from '@console/shared/src/hooks/redux-selectors';
import { useK8sModel } from '@console/shared/src/hooks/useK8sModel';
import { isPluginEnabled } from '@console/shared/src/utils';
import { OPERATOR_TYPE_ANNOTATION, NON_STANDALONE_ANNOTATION_VALUE } from '../const';
import {
  ClusterServiceVersionModel,
  SubscriptionModel,
  PackageManifestModel,
  CatalogSourceModel,
  InstallPlanModel,
  OperatorGroupModel,
} from '../models';
import { subscriptionForCSV, getSubscriptionStatus } from '../status/csv-status';
import {
  APIServiceDefinition,
  CatalogSourceKind,
  ClusterServiceVersionKind,
  ClusterServiceVersionPhase,
  CRDDescription,
  CSVConditionReason,
  InstallPlanKind,
  PackageManifestKind,
  SubscriptionKind,
} from '../types';
import {
  getClusterServiceVersionPlugins,
  isCatalogSourceTrusted,
  upgradeRequiresApproval,
} from '../utils';
import { createUninstallOperatorModal } from './modals/uninstall-operator-modal';
import { ProvidedAPIsPage, ProvidedAPIPage, ProvidedAPIPageProps } from './operand';
import { operatorGroupFor, operatorNamespaceFor } from './operator-group';
import { CreateInitializationResourceButton } from './operator-install-page';
import {
  SourceMissingStatus,
  SubscriptionDetails,
  UpgradeApprovalLink,
  catalogSourceForSubscription,
} from './subscription';
import { ClusterServiceVersionLogo, referenceForProvidedAPI, providedAPIsForCSV } from './index';

const isSubscription = (obj) => referenceFor(obj) === referenceForModel(SubscriptionModel);
const isCSV = (obj): obj is ClusterServiceVersionKind =>
  referenceFor(obj) === referenceForModel(ClusterServiceVersionModel);
const isPackageServer = (obj) =>
  obj.metadata.name === 'packageserver' &&
  obj.metadata.namespace === 'openshift-operator-lifecycle-manager';

const nameColumnClass = '';
const namespaceColumnClass = '';
const managedNamespacesColumnClass = classNames('pf-m-hidden', 'pf-m-visible-on-sm');
const statusColumnClass = classNames('pf-m-hidden', 'pf-m-visible-on-lg');
const lastUpdatedColumnClass = classNames('pf-m-hidden', 'pf-m-visible-on-2xl');
const providedAPIsColumnClass = classNames('pf-m-hidden', 'pf-m-visible-on-xl');

const editSubscription = (sub: SubscriptionKind): KebabOption =>
  !_.isNil(sub)
    ? {
        // t('olm~Edit Subscription')
        labelKey: 'olm~Edit Subscription',
        href: `${resourcePathFromModel(
          SubscriptionModel,
          sub.metadata.name,
          sub.metadata.namespace,
        )}/yaml`,
      }
    : null;

const uninstall = (sub: SubscriptionKind, csv?: ClusterServiceVersionKind): KebabOption =>
  !_.isNil(sub)
    ? {
        // t('olm~Uninstall Operator')
        labelKey: 'olm~Uninstall Operator',
        callback: () =>
          createUninstallOperatorModal({
            k8sKill,
            k8sGet,
            k8sPatch,
            subscription: sub,
            csv,
          }),
        accessReview: {
          group: SubscriptionModel.apiGroup,
          resource: SubscriptionModel.plural,
          name: sub.metadata.name,
          namespace: sub.metadata.namespace,
          verb: 'delete',
        },
      }
    : null;

const menuActionsForCSV = (
  csv: ClusterServiceVersionKind,
  subscription: SubscriptionKind,
): KebabAction[] => {
  return _.isEmpty(subscription)
    ? [Kebab.factory.Delete]
    : [() => editSubscription(subscription), () => uninstall(subscription, csv)];
};

const SubscriptionStatus: React.FC<{ muted?: boolean; subscription: SubscriptionKind }> = ({
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
    <span className={muted ? 'text-muted' : 'co-icon-and-text'}>
      {muted ? (
        subscriptionStatus.title
      ) : (
        <Status status={subscriptionStatus.status || t('olm~Unknown')} />
      )}
    </span>
  );
};

const ClusterServiceVersionStatus: React.FC<ClusterServiceVersionStatusProps> = ({
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

const ManagedNamespaces: React.FC<ManagedNamespacesProps> = ({ obj }) => {
  const { t } = useTranslation();
  const olmTargetNamespaces = obj?.metadata?.annotations?.['olm.targetNamespaces'] ?? '';
  const managedNamespaces = olmTargetNamespaces?.split(',') || [];

  if (managedNamespaces.length === 1 && managedNamespaces[0] === '') {
    return t('olm~All Namespaces');
  }

  switch (managedNamespaces.length) {
    case 0:
      return <span className="text-muted">{t('olm~All Namespaces')}</span>;
    case 1:
      return (
        <ResourceLink kind="Namespace" title={managedNamespaces[0]} name={managedNamespaces[0]} />
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

const ConsolePlugins: React.FC<ConsolePluginsProps> = ({ csvPlugins, trusted }) => {
  const console: WatchK8sResource = {
    kind: referenceForModel(ConsoleOperatorConfigModel),
    isList: false,
    name: CONSOLE_OPERATOR_CONFIG_NAME,
  };
  const [consoleOperatorConfig] = useK8sWatchResource<K8sResourceKind>(console);
  const { t } = useTranslation();
  const canPatchConsoleOperatorConfig = useAccessReview({
    group: ConsoleOperatorConfigModel.apiGroup,
    resource: ConsoleOperatorConfigModel.plural,
    verb: 'patch',
    name: CONSOLE_OPERATOR_CONFIG_NAME,
  });
  const csvPluginsCount = csvPlugins.length;

  return (
    <>
      {consoleOperatorConfig && canPatchConsoleOperatorConfig && (
        <dl className="co-clusterserviceversion-details__field">
          <dt>{t('olm~Console plugin', { count: csvPluginsCount })}</dt>
          {csvPlugins.map((plugin) => (
            <dd key={plugin} className="co-clusterserviceversion-details__field-description">
              {csvPluginsCount > 1 && (
                <strong className="text-muted">{t('olm~{{plugin}}:', { plugin })} </strong>
              )}
              <Button
                data-test="edit-console-plugin"
                type="button"
                isInline
                onClick={() =>
                  consolePluginModal({
                    consoleOperatorConfig,
                    csvPluginsCount,
                    plugin,
                    trusted,
                  })
                }
                variant="link"
              >
                <>
                  {isPluginEnabled(consoleOperatorConfig, plugin)
                    ? t('olm~Enabled')
                    : t('olm~Disabled')}{' '}
                  <PencilAltIcon className="co-icon-space-l pf-c-button-icon--plain" />
                </>
              </Button>
            </dd>
          ))}
        </dl>
      )}
    </>
  );
};

const ConsolePluginStatus: React.FC<ConsolePluginStatusProps> = ({ csv, csvPlugins }) => {
  const console: WatchK8sResource = {
    kind: referenceForModel(ConsoleOperatorConfigModel),
    isList: false,
    name: CONSOLE_OPERATOR_CONFIG_NAME,
  };
  const [consoleOperatorConfig] = useK8sWatchResource<K8sResourceKind>(console);
  const { t } = useTranslation();
  const canPatchConsoleOperatorConfig = useAccessReview({
    group: ConsoleOperatorConfigModel.apiGroup,
    resource: ConsoleOperatorConfigModel.plural,
    verb: 'patch',
    name: CONSOLE_OPERATOR_CONFIG_NAME,
  });
  const aPluginIsDisabled =
    !consoleOperatorConfig?.spec?.plugins?.length ||
    csvPlugins.some((plugin) => !isPluginEnabled(consoleOperatorConfig, plugin));

  return (
    consoleOperatorConfig &&
    canPatchConsoleOperatorConfig &&
    aPluginIsDisabled && (
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
    const olmOperatorNamespace = obj.metadata?.annotations?.['olm.operatorNamespace'] ?? '';
    const [icon] = obj.spec.icon ?? [];
    const route = resourceObjPath(obj, referenceFor(obj));
    const providedAPIs = providedAPIsForCSV(obj);
    const csvPlugins = getClusterServiceVersionPlugins(obj?.metadata?.annotations);

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
            <Link to={route} title={`View ${providedAPIs.length - 4} more...`}>
              {`View ${providedAPIs.length - 4} more...`}
            </Link>
          )}
        </TableData>

        {/* Kebab */}
        <TableData className={Kebab.columnClass}>
          <ResourceKebab
            resource={obj}
            kind={referenceFor(obj)}
            actions={menuActionsForCSV(obj, subscription)}
          />
        </TableData>
      </>
    );
  },
);

export const SubscriptionTableRow: React.FC<SubscriptionTableRowProps> = ({
  activeNamespace,
  catalogSourceMissing,
  obj,
}) => {
  const { t } = useTranslation();
  const csvName = obj?.spec?.name;
  const menuActions = [Kebab.factory.Edit, () => uninstall(obj)];
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
        <span className="text-muted">{t('olm~None')}</span>
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
        <span className="text-muted">{t('olm~None')}</span>
      </TableData>

      {/* Kebab */}
      <TableData className={Kebab.columnClass}>
        <ResourceKebab resource={obj} kind={referenceFor(obj)} actions={menuActions} />
      </TableData>
    </>
  );
};

const InstalledOperatorTableRow: React.FC<InstalledOperatorTableRowProps> = ({
  obj,
  customData,
}) => {
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
  return <MsgBox title={t('olm~No Operators found')} />;
};

const CSVListNoDataEmptyMsg = () => {
  const { t } = useTranslation();
  const project = useActiveNamespace();
  const noOperatorsInSingleNamespaceMessage = t(
    'olm~No Operators are available for project {{project}}.',
    { project },
  );
  const noOperatorsInAllNamespacesMessage = t('olm~No Operators are available.');
  const detail = (
    <>
      <div>
        {project === ALL_NAMESPACES_KEY
          ? noOperatorsInAllNamespacesMessage
          : noOperatorsInSingleNamespaceMessage}
      </div>
      <div>
        <Trans ns="olm">
          Discover and install Operators from the <a href="/operatorhub">OperatorHub</a>.
        </Trans>
      </div>
    </>
  );
  return <MsgBox title={t('olm~No Operators found')} detail={detail} />;
};

export const ClusterServiceVersionList: React.FC<ClusterServiceVersionListProps> = ({
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
    props: { className: Kebab.columnClass },
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

  const isCopiedCSV = (source: ClusterServiceVersionKind, kind: string) => {
    return (
      referenceForModel(ClusterServiceVersionModel) === kind &&
      (source.status?.reason === 'Copied' || source.metadata?.labels?.['olm.copiedFrom'])
    );
  };

  const isStandaloneCSV = (operator: ClusterServiceVersionKind) => {
    return (
      operator.metadata.annotations?.[OPERATOR_TYPE_ANNOTATION] !==
        NON_STANDALONE_ANNOTATION_VALUE ||
      operator.status?.phase === ClusterServiceVersionPhase.CSVPhaseFailed
    );
  };

  const filterOperators = (
    operators: (ClusterServiceVersionKind | SubscriptionKind)[],
    allNamespaceActive: boolean,
  ): (ClusterServiceVersionKind | SubscriptionKind)[] => {
    return operators.filter((source) => {
      const kind = referenceFor(source);
      if (isSubscription(source)) {
        return true;
      }
      const csv = source as ClusterServiceVersionKind;
      if (allNamespaceActive) {
        return !isCopiedCSV(csv, kind) && isStandaloneCSV(csv);
      }
      return isStandaloneCSV(csv);
    });
  };

  const formatTargetNamespaces = (obj: ClusterServiceVersionKind | SubscriptionKind): string => {
    if (obj.kind === 'Subscription') {
      return t('olm~None');
    }
    const namespaces = obj.metadata.annotations?.['olm.targetNamespaces']?.split(',') || [];
    if (namespaces.length === 1 && namespaces[0] === '') {
      return t('olm~All Namespaces');
    }

    switch (namespaces.length) {
      case 0:
        return t('olm~All Namespaces');
      case 1:
        return namespaces[0];
      default:
        return t('olm~{{count}} Namespaces', { count: namespaces.length });
    }
  };
  const getOperatorNamespace = (
    obj: ClusterServiceVersionKind | SubscriptionKind,
  ): string | null => {
    const olmOperatorNamespace = obj.metadata?.annotations?.['olm.operatorNamespace'];
    return olmOperatorNamespace ?? getNamespace(obj);
  };
  const allNamespaceActive = activeNamespace === ALL_NAMESPACES_KEY;

  const customData = React.useMemo(
    () => ({
      catalogSources: catalogSources.data,
      subscriptions: subscriptions.data,
      activeNamespace,
    }),
    [activeNamespace, catalogSources.data, subscriptions.data],
  );

  return (
    <Table
      data={filterOperators(data, allNamespaceActive)}
      {...rest}
      aria-label="Installed Operators"
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
  );
};

export const ClusterServiceVersionsPage: React.FC<ClusterServiceVersionsPageProps> = (props) => {
  const { t } = useTranslation();
  const title = t('olm~Installed Operators');
  const olmLink = isUpstream()
    ? `${openshiftHelpBase}operators/understanding/olm-what-operators-are.html`
    : `${openshiftHelpBase}html/operators/understanding-operators#olm-what-operators-are`;
  const helpText = (
    <Trans ns="olm">
      Installed Operators are represented by ClusterServiceVersions within this Namespace. For more
      information, see the{' '}
      <ExternalLink href={olmLink}>Understanding Operators documentation</ExternalLink>. Or create
      an Operator and ClusterServiceVersion using the{' '}
      <ExternalLink href="https://sdk.operatorframework.io/">Operator SDK</ExternalLink>.
    </Trans>
  );

  const flatten: Flatten<{
    clusterServiceVersions: ClusterServiceVersionKind[];
    subscriptions: SubscriptionKind[];
  }> = ({ clusterServiceVersions, subscriptions }) =>
    [
      ...(clusterServiceVersions?.data ?? []),
      ...(subscriptions?.data ?? []).filter(
        (sub) =>
          ['', sub.metadata.namespace].includes(props.namespace || '') &&
          _.isNil(_.get(sub, 'status.installedCSV')),
      ),
    ].filter(
      (obj, i, all) =>
        isCSV(obj) ||
        _.isUndefined(
          all.find(({ metadata }) =>
            [obj?.status?.currentCSV, obj?.spec?.startingCSV].includes(metadata.name),
          ),
        ),
    );

  return (
    <>
      <Helmet>
        <title>{title}</title>
      </Helmet>
      <MultiListPage
        {...props}
        resources={[
          {
            kind: referenceForModel(ClusterServiceVersionModel),
            namespace: props.namespace,
            prop: 'clusterServiceVersions',
          },
          {
            kind: referenceForModel(SubscriptionModel),
            prop: 'subscriptions',
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

export const CRDCard: React.FC<CRDCardProps> = ({ csv, crd, required, ...rest }) => {
  const { t } = useTranslation();
  const reference = referenceForProvidedAPI(crd);
  const [model] = useK8sModel(reference);
  const canCreate = rest.canCreate ?? model?.verbs?.includes?.('create');
  const createRoute = React.useMemo(
    () =>
      csv
        ? `/k8s/ns/${csv.metadata.namespace}/${ClusterServiceVersionModel.plural}/${csv.metadata.name}/${reference}/~new`
        : null,
    [csv, reference],
  );

  return (
    <Card>
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
  return (
    <div className="co-crd-card-row">
      {providedAPIs.length ? (
        providedAPIs.map((crd) => (
          <CRDCard key={referenceForProvidedAPI(crd)} crd={crd} csv={csv} />
        ))
      ) : (
        <span className="text-muted">No Kubernetes APIs are being provided by this Operator.</span>
      )}
    </div>
  );
};

const InitializationResourceAlert: React.FC<InitializationResourceAlertProps> = (props) => {
  const { t } = useTranslation();
  const { initializationResource, csv } = props;

  const initializationResourceKind = initializationResource?.kind;
  const { group: initializationResourceGroup } = groupVersionFor(
    initializationResource?.apiVersion,
  );
  const model = modelFor(referenceFor(initializationResource));

  // Check if the CR is already present - only watches for the model in namespace
  const [customResource, customResourceLoaded] = useK8sWatchResource<K8sResourceCommon[]>({
    kind: referenceForModel(model),
    namespaced: true,
    isList: true,
  });

  const canCreateCustomResource = useAccessReview({
    group: initializationResourceGroup,
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
          targetNamespace={
            model?.namespaced
              ? initializationResource?.metadata.namespace || csv.metadata?.namespace
              : null
          }
        />
      </Alert>
    );
  }
  return null;
};

export const ClusterServiceVersionDetails: React.FC<ClusterServiceVersionDetailsProps> = (
  props,
) => {
  const { t } = useTranslation();
  const { spec, metadata, status } = props.obj;
  const providedAPIs = providedAPIsForCSV(props.obj);
  const {
    'marketplace.openshift.io/support-workflow': marketplaceSupportWorkflow,
    'olm.targetNamespaces': olmTargetNamespaces = '',
    'operatorframework.io/initialization-resource': initializationResourceJSON,
  } = metadata.annotations || {};

  const initializationResource = React.useMemo(() => {
    if (initializationResourceJSON) {
      try {
        return JSON.parse(initializationResourceJSON);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error(error.message);
      }
    }
    return null;
  }, [initializationResourceJSON]);

  const supportWorkflowUrl = React.useMemo(() => {
    if (marketplaceSupportWorkflow) {
      try {
        const url = new URL(marketplaceSupportWorkflow);
        url.searchParams.set('utm_source', 'openshift_console');
        return url.toString();
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error(error.message);
      }
    }
    return null;
  }, [marketplaceSupportWorkflow]);

  const csvPlugins = getClusterServiceVersionPlugins(metadata?.annotations);
  const subscription = subscriptionForCSV(props.subscriptions, props.obj);
  const permissions = _.uniqBy(spec?.install?.spec?.permissions, 'serviceAccountName');

  return (
    <>
      <ScrollToTopOnMount />

      <div className="co-m-pane__body">
        <div className="co-m-pane__body-group">
          <div className="row">
            <div className="col-sm-9">
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
                        This Operator was copied from another namespace. For the reason it failed,
                        see{' '}
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
              <SectionHeading text={t('olm~Provided APIs')} />
              <CRDCardRow csv={props.obj} providedAPIs={providedAPIs} />
              <SectionHeading text={t('olm~Description')} />
              <MarkdownView content={spec.description || t('olm~Not available')} />
            </div>
            <div className="col-sm-3">
              <dl className="co-clusterserviceversion-details__field">
                <dt>{t('olm~Provider')}</dt>
                <dd>
                  {spec.provider && spec.provider.name
                    ? spec.provider.name
                    : t('olm~Not available')}
                </dd>
                {supportWorkflowUrl && (
                  <>
                    <dt>{t('olm~Support')}</dt>
                    <dd>
                      <ExternalLink href={supportWorkflowUrl} text={t('olm~Get support')} />
                    </dd>
                  </>
                )}
                <dt>{t('olm~Created at')}</dt>
                <dd>
                  <Timestamp timestamp={metadata.creationTimestamp} />
                </dd>
              </dl>
              {csvPlugins.length > 0 && subscription && (
                <ConsolePlugins
                  csvPlugins={csvPlugins}
                  trusted={isCatalogSourceTrusted(subscription?.spec?.source)}
                />
              )}
              <dl className="co-clusterserviceversion-details__field">
                <dt>{t('olm~Links')}</dt>
                {spec.links && spec.links.length > 0 ? (
                  spec.links.map((link) => (
                    <dd key={link.url} style={{ display: 'flex', flexDirection: 'column' }}>
                      {link.name}{' '}
                      <ExternalLink
                        href={link.url}
                        text={link.url || '-'}
                        additionalClassName="co-break-all"
                      />
                    </dd>
                  ))
                ) : (
                  <dd>{t('olm~Not available')}</dd>
                )}
              </dl>
              <dl className="co-clusterserviceversion-details__field">
                <dt>{t('olm~Maintainers')}</dt>
                {spec.maintainers && spec.maintainers.length > 0 ? (
                  spec.maintainers.map((maintainer) => (
                    <dd key={maintainer.email} style={{ display: 'flex', flexDirection: 'column' }}>
                      {maintainer.name}{' '}
                      <a href={`mailto:${maintainer.email}`} className="co-break-all">
                        {maintainer.email || '-'}
                      </a>
                    </dd>
                  ))
                ) : (
                  <dd>{t('olm~Not available')}</dd>
                )}
              </dl>
            </div>
          </div>
        </div>
      </div>
      <div className="co-m-pane__body">
        <SectionHeading text={t('olm~ClusterServiceVersion details')} />
        <div className="co-m-pane__body-group">
          <div className="row">
            <div className="col-sm-6">
              <ResourceSummary resource={props.obj}>
                <dt>
                  <Popover
                    headerContent={<div>{t('olm~Managed Namespaces')}</div>}
                    bodyContent={
                      <div>{t('olm~Operands in this Namespace are managed by the Operator.')}</div>
                    }
                    maxWidth="30rem"
                  >
                    <Button variant="plain" className="details-item__popover-button">
                      {t('olm~Managed Namespaces')}
                    </Button>
                  </Popover>
                </dt>
                <dd>
                  {olmTargetNamespaces === '' ? (
                    t('olm~All Namespaces')
                  ) : (
                    <ResourceLink kind="Namespace" name={props.obj.metadata.namespace} />
                  )}
                </dd>
              </ResourceSummary>
            </div>
            <div className="col-sm-6">
              <dt>{t('olm~Status')}</dt>
              <dd>
                <Status status={status ? status.phase : t('olm~Unknown')} />
              </dd>
              <dt>{t('olm~Status reason')}</dt>
              <dd>{status ? status.message : t('olm~Unknown')}</dd>
              <dt>{t('olm~Operator Deployments')}</dt>
              {spec.install.spec.deployments.map(({ name }) => (
                <dd key={name}>
                  <ResourceLink
                    name={name}
                    kind="Deployment"
                    namespace={operatorNamespaceFor(props.obj)}
                  />
                </dd>
              ))}
              {!_.isEmpty(permissions) && (
                <>
                  <dt>{t('olm~Operator ServiceAccounts')}</dt>
                  {permissions.map(({ serviceAccountName }) => (
                    <dd key={serviceAccountName} data-service-account-name={serviceAccountName}>
                      <ResourceLink
                        name={serviceAccountName}
                        kind="ServiceAccount"
                        namespace={operatorNamespaceFor(props.obj)}
                      />
                    </dd>
                  ))}
                </>
              )}
              <dt>{t('olm~OperatorGroup')}</dt>
              <dd>
                {operatorGroupFor(props.obj) ? (
                  <ResourceLink
                    name={operatorGroupFor(props.obj)}
                    namespace={operatorNamespaceFor(props.obj)}
                    kind={referenceForModel(OperatorGroupModel)}
                  />
                ) : (
                  '-'
                )}
              </dd>
            </div>
          </div>
        </div>
      </div>
      <div className="co-m-pane__body">
        <SectionHeading text={t('olm~Conditions')} />
        <Conditions
          conditions={(status?.conditions ?? []).map((c) => ({
            ...c,
            type: c.phase,
            status: 'True',
          }))}
        />
      </div>
    </>
  );
};

export const CSVSubscription: React.FC<CSVSubscriptionProps> = ({
  obj,
  subscriptions = [],
  ...rest
}) => {
  const { t } = useTranslation();
  const EmptyMsg = () => (
    <MsgBox
      title={t('olm~No Operator Subscription')}
      detail={t('olm~This Operator will not receive updates.')}
    />
  );

  const subscription = React.useMemo(() => subscriptionForCSV(subscriptions, obj), [
    obj,
    subscriptions,
  ]);

  return (
    <StatusBox EmptyMsg={EmptyMsg} loaded data={subscription}>
      <SubscriptionDetails
        {...rest}
        obj={subscription}
        clusterServiceVersions={[obj]}
        subscriptions={subscriptions}
      />
    </StatusBox>
  );
};

export const ClusterServiceVersionsDetailsPage: React.FC<ClusterServiceVersionsDetailsPageProps> = (
  props,
) => {
  const { t } = useTranslation();
  const menuActions = (
    model,
    obj: ClusterServiceVersionKind,
    { subscriptions }: ExtraResources,
  ) => {
    const subscription = subscriptionForCSV(subscriptions, obj);
    return [
      ...(_.isEmpty(subscription)
        ? [Kebab.factory.Delete(model, obj)]
        : [editSubscription(subscription), uninstall(subscription, obj)]),
    ];
  };

  const canListSubscriptions = useAccessReview({
    group: SubscriptionModel.apiGroup,
    resource: SubscriptionModel.plural,
    verb: 'list',
  });

  const pagesFor = React.useCallback(
    (obj: ClusterServiceVersionKind) => {
      const providedAPIs = providedAPIsForCSV(obj);
      return [
        navFactory.details(ClusterServiceVersionDetails),
        navFactory.editYaml(),
        ...(canListSubscriptions
          ? [
              {
                href: 'subscription',
                // t('olm~Subscription')
                nameKey: 'olm~Subscription',
                component: CSVSubscription,
              },
            ]
          : []),
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
            namespace: obj.metadata.namespace,
          },
        })),
      ];
    },
    [canListSubscriptions],
  );

  return (
    <DetailsPage
      {...props}
      breadcrumbsFor={() => [
        {
          name: 'Installed Operators',
          path: getBreadcrumbPath(props.match),
        },
        { name: t('olm~{{item}} details', { item: 'Operator' }), path: props.match.url },
      ]}
      resources={[
        { kind: referenceForModel(SubscriptionModel), isList: true, prop: 'subscriptions' },
        { kind: referenceForModel(PackageManifestModel), isList: true, prop: 'packageManifests' },
        { kind: referenceForModel(CatalogSourceModel), isList: true, prop: 'catalogSources' },
        { kind: referenceForModel(InstallPlanModel), isList: true, prop: 'installPlans' },
      ]}
      icon={({ obj }) => (
        <ClusterServiceVersionLogo
          displayName={_.get(obj.spec, 'displayName')}
          icon={_.get(obj.spec, 'icon[0]')}
          provider={_.get(obj.spec, 'provider')}
          version={_.get(obj.spec, 'version')}
        />
      )}
      namespace={props.match.params.ns}
      kind={referenceForModel(ClusterServiceVersionModel)}
      name={props.match.params.name}
      pagesFor={pagesFor}
      menuActions={menuActions}
    />
  );
};

type ExtraResources = { subscriptions: SubscriptionKind[] };

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

export type ClusterServiceVersionsDetailsPageProps = {
  match: RouterMatch<any>;
};

export type ClusterServiceVersionDetailsProps = {
  obj: ClusterServiceVersionKind;
  subscriptions: SubscriptionKind[];
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

export type CSVSubscriptionProps = {
  catalogSources: CatalogSourceKind[];
  installPlans: InstallPlanKind[];
  obj: ClusterServiceVersionKind;
  packageManifests: PackageManifestKind[];
  subscriptions: SubscriptionKind[];
};

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
ClusterServiceVersionsDetailsPage.displayName = 'ClusterServiceVersionsDetailsPage';
ClusterServiceVersionDetails.displayName = 'ClusterServiceVersionDetails';
CSVSubscription.displayName = 'CSVSubscription';
