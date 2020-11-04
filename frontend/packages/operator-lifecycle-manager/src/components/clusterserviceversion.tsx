import * as React from 'react';
import * as _ from 'lodash';
import { Link, match as RouterMatch } from 'react-router-dom';
import { connect } from 'react-redux';
import * as classNames from 'classnames';
import { sortable, wrappable } from '@patternfly/react-table';
import { Helmet } from 'react-helmet';
import { AddCircleOIcon } from '@patternfly/react-icons';
import {
  Alert,
  Button,
  Card,
  CardBody,
  CardFooter,
  Popover,
  CardTitle,
} from '@patternfly/react-core';
import {
  ALL_NAMESPACES_KEY,
  Status,
  WarningStatus,
  getNamespace,
  getUID,
  StatusIconAndText,
} from '@console/shared';
import {
  DetailsPage,
  Table,
  TableRow,
  TableData,
  MultiListPage,
  RowFunctionArgs,
} from '@console/internal/components/factory';
import { withFallback } from '@console/shared/src/components/error/error-boundary';
import {
  modelFor,
  referenceForModel,
  referenceFor,
  groupVersionFor,
  GroupVersionKind,
  K8sKind,
  k8sKill,
  k8sPatch,
  k8sGet,
  K8sResourceCommon,
} from '@console/internal/module/k8s';
import { ResourceEventStream } from '@console/internal/components/events';
import { Conditions } from '@console/internal/components/conditions';
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
  Page,
  RequireCreatePermission,
  resourcePathFromModel,
  KebabOption,
  resourceObjPath,
  KebabAction,
  openshiftHelpBase,
} from '@console/internal/components/utils';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { useAccessReview } from '@console/internal/components/utils/rbac';
import { RootState } from '@console/internal/redux';
import {
  ClusterServiceVersionModel,
  SubscriptionModel,
  PackageManifestModel,
  CatalogSourceModel,
  InstallPlanModel,
  OperatorGroupModel,
} from '../models';
import {
  APIServiceDefinition,
  CatalogSourceKind,
  ClusterServiceVersionKind,
  ClusterServiceVersionPhase,
  CRDDescription,
  InstallPlanKind,
  PackageManifestKind,
  SubscriptionKind,
} from '../types';
import { operatorTypeAnnotation, nonStandaloneAnnotationValue } from '../const';
import { subscriptionForCSV, getSubscriptionStatus } from '../status/csv-status';
import { getInternalObjects, isInternalObject } from '../utils';
import { ProvidedAPIsPage, ProvidedAPIPage } from './operand';
import { createUninstallOperatorModal } from './modals/uninstall-operator-modal';
import { operatorGroupFor, operatorNamespaceFor } from './operator-group';
import {
  SubscriptionDetails,
  catalogSourceForSubscription,
  upgradeRequiresApproval,
  UpgradeApprovalLink,
} from './subscription';
import { RedExclamationCircleIcon } from '@console/shared/src/components/status/icons';
import { ClusterServiceVersionLogo, referenceForProvidedAPI, providedAPIsFor } from './index';
import { getBreadcrumbPath } from '@console/internal/components/utils/breadcrumbs';
import { CreateInitializationResourceButton } from './operator-install-page';

const clusterServiceVersionStateToProps = (state: RootState): ClusterServiceVersionStateProps => {
  return {
    activeNamespace: state.UI.get('activeNamespace'),
  };
};

const isSubscription = (obj) => referenceFor(obj) === referenceForModel(SubscriptionModel);
const isCSV = (obj) => referenceFor(obj) === referenceForModel(ClusterServiceVersionModel);
const isPackageServer = (obj) =>
  obj.metadata.name === 'packageserver' &&
  obj.metadata.namespace === 'openshift-operator-lifecycle-manager';

const nameColumnClass = '';
const namespaceColumnClass = '';
const managedNamespacesColumnClass = classNames('pf-m-hidden', 'pf-m-visible-on-sm');
const statusColumnClass = classNames('pf-m-hidden', 'pf-m-visible-on-lg');
const lastUpdatedColumnClass = classNames('pf-m-hidden', 'pf-m-visible-on-2xl');
const providedAPIsColumnClass = classNames('pf-m-hidden', 'pf-m-visible-on-xl');

const nameHeader: Header = {
  title: 'Name',
  sortField: 'metadata.name',
  transforms: [sortable],
  props: { className: nameColumnClass },
};

const namespaceHeader: Header = {
  title: 'Namespace',
  sortFunc: 'getOperatorNamespace',
  transforms: [sortable],
  props: { className: namespaceColumnClass },
};

const managedNamespacesHeader: Header = {
  title: 'Managed Namespaces',
  sortFunc: 'formatTargetNamespaces',
  transforms: [sortable, wrappable],
  props: { className: managedNamespacesColumnClass },
};

const statusHeader: Header = {
  title: 'Status',
  props: { className: statusColumnClass },
};

const lastUpdatedHeader: Header = {
  title: 'Last Updated',
  props: { className: lastUpdatedColumnClass },
};

const providedAPIsHeader: Header = {
  title: 'Provided APIs',
  props: { className: providedAPIsColumnClass },
};

const kebabHeader: Header = {
  title: '',
  props: { className: Kebab.columnClass },
};

export const AllProjectsTableHeader = (): Header[] => [
  nameHeader,
  namespaceHeader,
  managedNamespacesHeader,
  statusHeader,
  lastUpdatedHeader,
  providedAPIsHeader,
  kebabHeader,
];
export const SingleProjectTableHeader = (): Header[] => [
  nameHeader,
  managedNamespacesHeader,
  statusHeader,
  lastUpdatedHeader,
  providedAPIsHeader,
  kebabHeader,
];

const editSubscription = (sub: SubscriptionKind): KebabOption =>
  !_.isNil(sub)
    ? {
        label: 'Edit Subscription',
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
        label: 'Uninstall Operator',
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

const SourceMissingStatus = () => (
  <>
    <WarningStatus title="Cannot update" />
    <span className="text-muted">Catalog source was removed.</span>
  </>
);

const SubscriptionStatus = ({ muted = false, subscription }) => {
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
        <Status status={subscriptionStatus.status || 'Unknown'} />
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
  const { 'olm.targetNamespaces': olmTargetNamespaces = '' } = obj.metadata?.annotations || {};
  const managedNamespaces = olmTargetNamespaces?.split(',') || [];

  if (managedNamespaces.length === 1 && managedNamespaces[0] === '') {
    return <>All Namespaces</>;
  }

  switch (managedNamespaces.length) {
    case 0:
      return <span className="text-muted">All Namespaces</span>;
    case 1:
      return (
        <ResourceLink kind="Namespace" title={managedNamespaces[0]} name={managedNamespaces[0]} />
      );
    default:
      return (
        <Popover
          headerContent="Managed Namespaces"
          bodyContent={managedNamespaces.map((namespace) => (
            <ResourceLink kind="Namespace" title={namespace} name={namespace} />
          ))}
        >
          <Button variant="link" isInline>
            {managedNamespaces.length} Namespaces
          </Button>
        </Popover>
      );
  }
};

export const NamespacedClusterServiceVersionTableRow = withFallback<
  ClusterServiceVersionTableRowProps
>(({ activeNamespace, obj, rowKey, subscription, catalogSourceMissing, index, style }) => {
  const { displayName, provider, version } = _.get(obj, 'spec');
  const { 'olm.operatorNamespace': olmOperatorNamespace = '' } = obj.metadata?.annotations || {};
  const [icon] = _.get(obj, 'spec.icon', []);
  const route = resourceObjPath(obj, referenceFor(obj));
  const uid = getUID(obj);
  const internalObjects = getInternalObjects(obj);
  const providedAPIs = providedAPIsFor(obj).filter(
    (desc) => !isInternalObject(internalObjects, desc.name),
  );

  return (
    <TableRow id={uid} trKey={rowKey} index={index} style={style}>
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
          <ResourceLink kind="Namespace" title={olmOperatorNamespace} name={olmOperatorNamespace} />
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
          <Link to={route} title={`View ${providedAPIsFor(obj).length - 4} more...`}>
            {`View ${providedAPIsFor(obj).length - 4} more...`}
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
    </TableRow>
  );
});

export const ClusterServiceVersionTableRow = connect(clusterServiceVersionStateToProps)(
  NamespacedClusterServiceVersionTableRow,
);

const NamespacedSubscriptionTableRow: React.FC<SubscriptionTableRowProps> = ({
  activeNamespace,
  catalogSourceMissing,
  rowKey,
  obj,
  index,
  style,
}) => {
  const csvName = _.get(obj, 'spec.name');
  const menuActions = [Kebab.factory.Edit, () => uninstall(obj)];
  const namespace = getNamespace(obj);
  const route = resourceObjPath(obj, referenceForModel(SubscriptionModel));
  const uid = getUID(obj);

  return (
    <TableRow id={uid} trKey={rowKey} index={index} style={style}>
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
        <span className="text-muted">None</span>
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
        <span className="text-muted">None</span>
      </TableData>

      {/* Kebab */}
      <TableData className={Kebab.columnClass}>
        <ResourceKebab resource={obj} kind={referenceFor(obj)} actions={menuActions} />
      </TableData>
    </TableRow>
  );
};

export const SubscriptionTableRow = connect(clusterServiceVersionStateToProps)(
  NamespacedSubscriptionTableRow,
);

const InstalledOperatorTableRow: React.FC<InstalledOperatorTableRowProps> = ({
  obj,
  catalogSources = [],
  subscriptions = [],
  ...rest
}) => {
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
      {...rest}
      catalogSourceMissing={catalogSourceMissing}
      obj={obj as ClusterServiceVersionKind}
      subscription={subscription}
    />
  ) : (
    <SubscriptionTableRow
      {...rest}
      catalogSourceMissing={catalogSourceMissing}
      obj={subscription as SubscriptionKind}
    />
  );
};

const NoOperatorsMatchFilterMsg = () => <MsgBox title="No Operators Found" />;

export const NamespacedClusterServiceVersionList: React.SFC<ClusterServiceVersionListProps> = ({
  activeNamespace,
  subscriptions,
  catalogSources,
  data,
  ...rest
}) => {
  const noDataDetail = (
    <>
      <div>
        No Operators are available
        {activeNamespace !== ALL_NAMESPACES_KEY && (
          <>
            {' '}
            for project{' '}
            <span className="co-clusterserviceversion-empty__state__namespace">
              {activeNamespace}
            </span>
          </>
        )}
        .
      </div>
      <div>
        Discover and install Operators from the <a href="/operatorhub">OperatorHub</a>.
      </div>
    </>
  );
  const NoDataEmptyMsg = () => <MsgBox title="No Operators Found" detail={noDataDetail} />;

  const isCopiedCSV = (source: ClusterServiceVersionKind, kind: string) => {
    return (
      referenceForModel(ClusterServiceVersionModel) === kind &&
      (source.status?.reason === 'Copied' || source.metadata?.labels?.['olm.copiedFrom'])
    );
  };

  const isStandaloneCSV = (operator: ClusterServiceVersionKind) => {
    return (
      operator.metadata.annotations?.[operatorTypeAnnotation] !== nonStandaloneAnnotationValue ||
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
      return 'None';
    }

    const namespaces = obj.metadata.annotations?.['olm.targetNamespaces']?.split(',') || [];

    if (namespaces.length === 1 && namespaces[0] === '') {
      return 'All Namespaces';
    }

    switch (namespaces.length) {
      case 0:
        return 'All Namespaces';
      case 1:
        return namespaces[0];
      default:
        return `${namespaces.length} Namespaces`;
    }
  };
  const getOperatorNamespace = (
    obj: ClusterServiceVersionKind | SubscriptionKind,
  ): string | null => {
    const olmOperatorNamespace = obj.metadata?.annotations?.['olm.operatorNamespace'];
    return olmOperatorNamespace ?? getNamespace(obj);
  };
  const allNamespaceActive = activeNamespace === ALL_NAMESPACES_KEY;

  return (
    <Table
      data={filterOperators(data, allNamespaceActive)}
      {...rest}
      aria-label="Installed Operators"
      Header={allNamespaceActive ? AllProjectsTableHeader : SingleProjectTableHeader}
      Row={(rowArgs: RowFunctionArgs<ClusterServiceVersionKind | SubscriptionKind>) => (
        <InstalledOperatorTableRow
          obj={rowArgs.obj}
          index={rowArgs.index}
          rowKey={rowArgs.key}
          style={rowArgs.style}
          catalogSources={catalogSources.data}
          subscriptions={subscriptions.data}
        />
      )}
      EmptyMsg={NoOperatorsMatchFilterMsg}
      NoDataEmptyMsg={NoDataEmptyMsg}
      virtualize
      customSorts={{
        formatTargetNamespaces,
        getOperatorNamespace,
      }}
    />
  );
};

export const ClusterServiceVersionList = connect(clusterServiceVersionStateToProps)(
  NamespacedClusterServiceVersionList,
);

export const ClusterServiceVersionsPage: React.FC<ClusterServiceVersionsPageProps> = (props) => {
  const title = 'Installed Operators';
  const helpText = (
    <>
      Installed Operators are represented by Cluster Service Versions within this namespace. For
      more information, see the{' '}
      <ExternalLink
        href={`${openshiftHelpBase}operators/understanding/olm-what-operators-are.html`}
        text="Understanding Operators documentation"
      />
      . Or create an Operator and Cluster Service Version using the{' '}
      <ExternalLink href="https://sdk.operatorframework.io/" text="Operator SDK" />.
    </>
  );

  const flatten = ({ clusterServiceVersions, subscriptions }) =>
    [
      ..._.get(clusterServiceVersions, 'data', []),
      ..._.get(subscriptions, 'data', []).filter(
        (sub) =>
          ['', sub.metadata.namespace].includes(props.namespace) &&
          _.isNil(_.get(sub, 'status.installedCSV')),
      ),
    ].filter(
      (obj, i, all) =>
        isCSV(obj) ||
        _.isUndefined(
          all.find(({ metadata }) =>
            [_.get(obj, 'status.currentCSV'), _.get(obj, 'spec.startingCSV')].includes(
              metadata.name,
            ),
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

export const CRDCard: React.FC<CRDCardProps> = (props) => {
  const { csv, crd, canCreate, required = false } = props;
  const reference = referenceForProvidedAPI(crd);
  const model = modelFor(reference);
  const createRoute = () =>
    `/k8s/ns/${csv.metadata.namespace}/${ClusterServiceVersionModel.plural}/${csv.metadata.name}/${reference}/~new`;

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
              <StatusIconAndText icon={<RedExclamationCircleIcon />} title="Required" />
            </ResourceStatus>
          )}
        </span>
      </CardTitle>
      <CardBody>
        <MarkdownView content={crd.description} truncateContent />
      </CardBody>
      {canCreate && (
        <RequireCreatePermission model={model} namespace={csv.metadata.namespace}>
          <CardFooter>
            <Link to={createRoute()}>
              <AddCircleOIcon className="co-icon-space-r" />
              Create Instance
            </Link>
          </CardFooter>
        </RequireCreatePermission>
      )}
    </Card>
  );
};

const crdCardRowStateToProps = ({ k8s }, { crdDescs }) => {
  const models: K8sKind[] = _.compact(
    crdDescs.map((desc) => k8s.getIn(['RESOURCES', 'models', referenceForProvidedAPI(desc)])),
  );
  return {
    crdDescs: crdDescs.filter((desc) =>
      models.find((m) => referenceForModel(m) === referenceForProvidedAPI(desc)),
    ),
    createable: models
      .filter((m) => (m.verbs || []).includes('create'))
      .map((m) => referenceForModel(m)),
  };
};

export const CRDCardRow = connect(crdCardRowStateToProps)((props: CRDCardRowProps) => {
  const internalObjects = getInternalObjects(props.csv);
  const crds = props.crdDescs?.filter(({ name }) => !isInternalObject(internalObjects, name));
  return (
    <div className="co-crd-card-row">
      {_.isEmpty(crds) ? (
        <span className="text-muted">No Kubernetes APIs are being provided by this Operator.</span>
      ) : (
        crds.map((crd) => (
          <CRDCard
            key={referenceForProvidedAPI(crd)}
            crd={crd}
            csv={props.csv}
            canCreate={props.createable.includes(referenceForProvidedAPI(crd))}
          />
        ))
      )}
    </div>
  );
});

const InitializationResourceAlert: React.FC<InitializationResourceAlertProps> = (props) => {
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
        title={`${initializationResourceKind} Required`}
      >
        <p>Create a {initializationResourceKind} instance to use this operator.</p>
        <CreateInitializationResourceButton
          obj={props.csv}
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

export const ClusterServiceVersionDetails: React.SFC<ClusterServiceVersionDetailsProps> = (
  props,
) => {
  const { spec, metadata, status } = props.obj;
  const {
    'marketplace.openshift.io/support-workflow': marketplaceSupportWorkflow,
    'olm.targetNamespaces': olmTargetNamespaces = '',
    'operatorframework.io/initialization-resource': initializationResourceJSON,
  } = metadata.annotations || {};

  let initializationResource = null;
  if (initializationResourceJSON) {
    try {
      initializationResource = JSON.parse(initializationResourceJSON);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(error.message);
    }
  }

  let supportWorkflowUrl;
  if (marketplaceSupportWorkflow) {
    try {
      const url = new URL(marketplaceSupportWorkflow);
      url.searchParams.set('utm_source', 'openshift_console');
      supportWorkflowUrl = url.toString();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(error.message);
    }
  }

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
                  title={`${status.phase}: ${status.message}`}
                />
              )}
              {initializationResource && (
                <InitializationResourceAlert
                  initializationResource={initializationResource}
                  csv={props.obj}
                />
              )}
              <SectionHeading text="Provided APIs" />
              <CRDCardRow csv={props.obj} crdDescs={providedAPIsFor(props.obj)} />
              <SectionHeading text="Description" />
              <MarkdownView content={spec.description || 'Not available'} />
            </div>
            <div className="col-sm-3">
              <dl className="co-clusterserviceversion-details__field">
                <dt>Provider</dt>
                <dd>
                  {spec.provider && spec.provider.name ? spec.provider.name : 'Not available'}
                </dd>
                {supportWorkflowUrl && (
                  <>
                    <dt>Support</dt>
                    <dd>
                      <ExternalLink href={supportWorkflowUrl} text="Get support" />
                    </dd>
                  </>
                )}
                <dt>Created At</dt>
                <dd>
                  <Timestamp timestamp={metadata.creationTimestamp} />
                </dd>
              </dl>
              <dl className="co-clusterserviceversion-details__field">
                <dt>Links</dt>
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
                  <dd>Not available</dd>
                )}
              </dl>
              <dl className="co-clusterserviceversion-details__field">
                <dt>Maintainers</dt>
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
                  <dd>Not available</dd>
                )}
              </dl>
            </div>
          </div>
        </div>
      </div>
      <div className="co-m-pane__body">
        <SectionHeading text="ClusterServiceVersion Details" />
        <div className="co-m-pane__body-group">
          <div className="row">
            <div className="col-sm-6">
              <ResourceSummary resource={props.obj}>
                <dt>
                  <Popover
                    headerContent={<div>Managed Namespaces</div>}
                    bodyContent={<div>Operands in this Namespace are managed by the Operator.</div>}
                    maxWidth="30rem"
                  >
                    <Button variant="plain" className="details-item__popover-button">
                      Managed Namespaces
                    </Button>
                  </Popover>
                </dt>
                <dd>
                  {olmTargetNamespaces === '' ? (
                    'All Namespaces'
                  ) : (
                    <ResourceLink
                      kind="Namespace"
                      name={props.obj.metadata.namespace}
                      title={props.obj.metadata.uid}
                    />
                  )}
                </dd>
              </ResourceSummary>
            </div>
            <div className="col-sm-6">
              <dt>Status</dt>
              <dd>
                <Status status={status ? status.phase : 'Unknown'} />
              </dd>
              <dt>Status Reason</dt>
              <dd>{status ? status.message : 'Unknown'}</dd>
              <dt>Operator Deployments</dt>
              {spec.install.spec.deployments.map(({ name }) => (
                <dd key={name}>
                  <ResourceLink
                    name={name}
                    kind="Deployment"
                    namespace={operatorNamespaceFor(props.obj)}
                  />
                </dd>
              ))}
              {_.get(spec.install.spec, 'permissions') && (
                <>
                  <dt>Operator Service Accounts</dt>
                  {spec.install.spec.permissions.map(({ serviceAccountName }) => (
                    <dd key={serviceAccountName}>
                      <ResourceLink
                        name={serviceAccountName}
                        kind="ServiceAccount"
                        namespace={operatorNamespaceFor(props.obj)}
                      />
                    </dd>
                  ))}
                </>
              )}
              <dt>Operator Group</dt>
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
        <SectionHeading text="Conditions" />
        <Conditions
          conditions={_.get(status, 'conditions', []).map((c) => ({
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
  const EmptyMsg = () => (
    <MsgBox title="No Operator Subscription" detail="This Operator will not receive updates." />
  );

  const subscription = React.useMemo(() => subscriptionForCSV(subscriptions, obj), [
    obj,
    subscriptions,
  ]);

  return (
    <StatusBox EmptyMsg={EmptyMsg} loaded data={subscription}>
      <SubscriptionDetails {...rest} obj={subscription} clusterServiceVersions={[obj]} />
    </StatusBox>
  );
};

export const ClusterServiceVersionsDetailsPage: React.FC<ClusterServiceVersionsDetailsPageProps> = (
  props,
) => {
  const instancePagesFor = (obj: ClusterServiceVersionKind) => {
    const internalObjects = getInternalObjects(obj);
    const allInstancesPage: Page = {
      href: 'instances',
      name: 'All Instances',
      component: ProvidedAPIsPage,
    };

    return (providedAPIsFor(obj).length > 1 ? [allInstancesPage] : ([] as Page[])).concat(
      providedAPIsFor(obj).reduce(
        (acc, desc: CRDDescription) =>
          !isInternalObject(internalObjects, desc.name)
            ? [
                ...acc,
                {
                  href: referenceForProvidedAPI(desc),
                  name: ['Details', 'YAML', 'Subscription', 'Events'].includes(desc.displayName)
                    ? `${desc.displayName} Operand`
                    : desc.displayName || desc.kind,
                  component: ProvidedAPIPage,
                  pageData: {
                    csv: obj,
                    kind: referenceForProvidedAPI(desc),
                    namespace: obj.metadata.namespace,
                  },
                },
              ]
            : acc,
        [],
      ),
    );
  };

  type ExtraResources = { subscriptions: SubscriptionKind[] };
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
    (obj: ClusterServiceVersionKind) =>
      _.compact([
        navFactory.details(ClusterServiceVersionDetails),
        navFactory.editYaml(),
        canListSubscriptions
          ? { href: 'subscription', name: 'Subscription', component: CSVSubscription }
          : null,
        navFactory.events(ResourceEventStream),
        ...instancePagesFor(obj),
      ]),
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
        { name: 'Operator Details', path: props.match.url },
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
  crd: CRDDescription | APIServiceDefinition;
  csv: ClusterServiceVersionKind;
  canCreate: boolean;
  required?: boolean;
};

export type CRDCardRowProps = {
  crdDescs: (CRDDescription | APIServiceDefinition)[];
  csv: ClusterServiceVersionKind;
  createable: GroupVersionKind[];
};

export type CRDCardRowState = {
  expand: boolean;
};

export type ClusterServiceVersionsDetailsPageProps = {
  match: RouterMatch<any>;
};

export type ClusterServiceVersionDetailsProps = {
  obj: ClusterServiceVersionKind;
};

type InstalledOperatorTableRowProps = {
  obj: ClusterServiceVersionKind | SubscriptionKind;
  index: number;
  rowKey: string;
  style: object;
  catalogSources: CatalogSourceKind[];
  subscriptions: SubscriptionKind[];
};

export type ClusterServiceVersionTableRowProps = {
  obj: ClusterServiceVersionKind;
  index: number;
  rowKey: string;
  style: object;
  catalogSourceMissing: boolean;
  subscription: SubscriptionKind;
  activeNamespace?: string;
};

type SubscriptionTableRowProps = {
  obj: SubscriptionKind;
  index: number;
  rowKey: string;
  style: object;
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

type ClusterServiceVersionStateProps = {
  activeNamespace?: string;
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
NamespacedClusterServiceVersionList.displayName = 'ClusterServiceVersionList';
ClusterServiceVersionsPage.displayName = 'ClusterServiceVersionsPage';
ClusterServiceVersionTableRow.displayName = 'ClusterServiceVersionTableRow';
SingleProjectTableHeader.displayName = 'SingleProjectClusterServiceVersionTableHeader';
AllProjectsTableHeader.displayName = 'AllProjectsClusterServiceVersionTableHeader';
CRDCard.displayName = 'CRDCard';
ClusterServiceVersionsDetailsPage.displayName = 'ClusterServiceVersionsDetailsPage';
ClusterServiceVersionDetails.displayName = 'ClusterServiceVersionDetails';
CSVSubscription.displayName = 'CSVSubscription';
