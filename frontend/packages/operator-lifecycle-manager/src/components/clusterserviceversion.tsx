import * as React from 'react';
import { Link, match as RouterMatch } from 'react-router-dom';
import * as _ from 'lodash';
import { connect } from 'react-redux';
import * as classNames from 'classnames';
import { sortable } from '@patternfly/react-table';
import { Helmet } from 'react-helmet';
import { AddCircleOIcon } from '@patternfly/react-icons';
import { Alert, Card, CardBody, CardFooter, CardHeader } from '@patternfly/react-core';
import * as UIActions from '@console/internal/actions/ui';
import {
  ErrorStatus,
  getName,
  ProgressStatus,
  SuccessStatus,
  WarningStatus,
  getNamespace,
  getUID,
} from '@console/shared';
import {
  DetailsPage,
  Table,
  TableRow,
  TableData,
  MultiListPage,
} from '@console/internal/components/factory';
import { withFallback } from '@console/internal/components/utils/error-boundary';
import {
  modelFor,
  referenceForModel,
  referenceFor,
  GroupVersionKind,
  K8sKind,
  k8sKill,
  k8sPatch,
  k8sGet,
} from '@console/internal/module/k8s';
import { ResourceEventStream } from '@console/internal/components/events';
import { Conditions } from '@console/internal/components/conditions';
import {
  Kebab,
  MsgBox,
  navFactory,
  PageHeading,
  ResourceKebab,
  ResourceLink,
  Timestamp,
  SectionHeading,
  ResourceSummary,
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
} from '@console/internal/components/utils';
import { useAccessReview } from '@console/internal/components/utils/rbac';
import {
  ClusterServiceVersionModel,
  SubscriptionModel,
  PackageManifestModel,
  CatalogSourceModel,
  InstallPlanModel,
} from '../models';
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
  SubscriptionState,
} from '../types';
import { ProvidedAPIsPage, ProvidedAPIPage } from './operand';
import { createUninstallOperatorModal } from './modals/uninstall-operator-modal';
import { operatorGroupFor, operatorNamespaceFor } from './operator-group';
import { SubscriptionDetails, catalogSourceForSubscription } from './subscription';
import { ClusterServiceVersionLogo, referenceForProvidedAPI, providedAPIsFor } from './index';

const FAILED_SUBSCRIPTION_STATES = ['Unknown', SubscriptionState.SubscriptionStateFailed];

const subscriptionForCSV = (
  subscriptions: SubscriptionKind[],
  csv: ClusterServiceVersionKind,
): SubscriptionKind =>
  _.find(subscriptions, {
    metadata: {
      namespace: _.get(csv, ['metadata', 'annotations', 'olm.operatorNamespace']),
    },
    status: {
      installedCSV: getName(csv),
    },
  } as any); // 'as any' to supress typescript error caused by lodash

const isSubscription = (obj) => referenceFor(obj) === referenceForModel(SubscriptionModel);
const isCSV = (obj) => referenceFor(obj) === referenceForModel(ClusterServiceVersionModel);
const tableColumnClasses = [
  classNames('col-lg-3', 'col-md-4', 'col-sm-4', 'col-xs-6'),
  classNames('col-lg-2', 'col-md-2', 'col-sm-4', 'col-xs-6'),
  classNames('col-lg-2', 'hidden-md', 'hidden-sm', 'hidden-xs'),
  classNames('col-lg-2', 'col-md-3', 'col-sm-4', 'hidden-xs'),
  classNames('col-lg-3', 'col-md-3', 'hidden-sm', 'hidden-xs'),
  Kebab.columnClass,
];

export const ClusterServiceVersionTableHeader = () => {
  return [
    {
      title: 'Name',
      sortField: 'metadata.name',
      transforms: [sortable],
      props: { className: tableColumnClasses[0] },
    },
    {
      title: 'Namespace',
      props: { className: tableColumnClasses[1] },
    },
    {
      title: 'Deployment',
      props: { className: tableColumnClasses[2] },
    },
    {
      title: 'Status',
      props: { className: tableColumnClasses[3] },
    },
    {
      title: 'Provided APIs',
      props: { className: tableColumnClasses[4] },
    },
    {
      title: '',
      props: { className: tableColumnClasses[5] },
    },
  ];
};

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

const uninstall = (sub: SubscriptionKind, displayName?: string): KebabOption =>
  !_.isNil(sub)
    ? {
        label: 'Uninstall Operator',
        callback: () =>
          createUninstallOperatorModal({
            k8sKill,
            k8sGet,
            k8sPatch,
            subscription: sub,
            displayName,
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
    ? [Kebab.factory.Edit, Kebab.factory.Delete]
    : [
        Kebab.factory.Edit,
        () => editSubscription(subscription),
        () => uninstall(subscription, _.get(csv, 'spec.displayName')),
      ];
};

const getSubscriptionState = (subscription: SubscriptionKind): string => {
  const state: SubscriptionState = _.get(subscription, 'status.state');
  switch (state) {
    case SubscriptionState.SubscriptionStateUpgradeAvailable:
      return 'Upgrade available';
    case SubscriptionState.SubscriptionStateUpgradePending:
      return 'Upgrading';
    case SubscriptionState.SubscriptionStateAtLatest:
      return 'Up to date';
    default:
      return '';
  }
};

const ClusterServiceVersionStatus: React.FC<ClusterServiceVersionStatusProps> = ({
  catalogSource,
  obj,
  subscription,
}) => {
  const statusString = _.get(obj, 'status.reason', ClusterServiceVersionPhase.CSVPhaseUnknown);
  const showSuccessIcon = statusString === 'Copied' || statusString === 'InstallSucceeded';
  if (obj.metadata.deletionTimestamp) {
    return <>Disabling</>;
  }

  if (_.isEmpty(catalogSource)) {
    return (
      <>
        <WarningStatus title="Cannot update" />
        <span className="text-muted">Catalog source was removed</span>
      </>
    );
  }

  return (
    <>
      {_.get(obj, 'status.phase') !== ClusterServiceVersionPhase.CSVPhaseFailed ? (
        <span className={classNames({ 'co-icon-and-text': showSuccessIcon })}>
          {showSuccessIcon && <SuccessStatus title={statusString} />}
        </span>
      ) : (
        <span className="co-error co-icon-and-text">
          <ErrorStatus title="Failed" />
        </span>
      )}
      {subscription && <span className="text-muted">{getSubscriptionState(subscription)}</span>}
    </>
  );
};

export const ClusterServiceVersionTableRow = withFallback<ClusterServiceVersionTableRowProps>(
  ({ obj, key, subscription, catalogSource, ...rest }) => {
    const { displayName, provider, version } = _.get(obj, 'spec');
    const [icon] = _.get(obj, 'spec.icon', []);
    const deploymentName = _.get(obj, 'spec.install.spec.deployments[0].name');
    const namespace = getNamespace(obj);
    const route = resourceObjPath(obj, referenceFor(obj));
    const uid = getUID(obj);
    return (
      <TableRow id={uid} trKey={key} {...rest}>
        {/* Name */}
        <TableData className={tableColumnClasses[0]}>
          <Link to={route} className="co-clusterserviceversion-link">
            <ClusterServiceVersionLogo
              icon={icon}
              displayName={displayName}
              version={version}
              provider={provider}
            />
          </Link>
        </TableData>

        {/* Namespace */}
        <TableData className={tableColumnClasses[1]}>
          <ResourceLink kind="Namespace" title={namespace} name={namespace} />
        </TableData>

        {/* Deployment */}
        <TableData className={tableColumnClasses[2]}>
          <ResourceLink
            kind="Deployment"
            name={deploymentName}
            namespace={operatorNamespaceFor(obj)}
            title={deploymentName}
          />
        </TableData>

        {/* Status */}
        <TableData className={tableColumnClasses[3]}>
          <div className="co-clusterserviceversion-row__status">
            <ClusterServiceVersionStatus
              catalogSource={catalogSource}
              obj={obj}
              subscription={subscription}
            />
          </div>
        </TableData>

        {/* Provided APIs */}
        <TableData className={tableColumnClasses[4]}>
          {_.take(providedAPIsFor(obj), 4).map((desc) => (
            <div key={referenceForProvidedAPI(desc)}>
              <Link to={`${route}/${referenceForProvidedAPI(desc)}`} title={desc.name}>
                {desc.displayName}
              </Link>
            </div>
          ))}
          {providedAPIsFor(obj).length > 4 && (
            <Link
              to={`${route}/instances`}
              title={`View ${providedAPIsFor(obj).length - 4} more...`}
            >
              {`View ${providedAPIsFor(obj).length - 4} more...`}
            </Link>
          )}
        </TableData>

        {/* Kabob */}
        <TableData className={tableColumnClasses[5]}>
          <ResourceKebab
            resource={obj}
            kind={referenceFor(obj)}
            actions={menuActionsForCSV(obj, subscription)}
          />
        </TableData>
      </TableRow>
    );
  },
);

export const FailedSubscriptionTableRow: React.FC<FailedSubscriptionTableRowProps> = ({
  catalogSource,
  key,
  obj,
  ...rest
}) => {
  const csvName = _.get(obj, 'spec.name');
  const menuActions = [Kebab.factory.Edit, () => uninstall(obj, obj.spec.displayName)];
  const namespace = getNamespace(obj);
  const route = resourceObjPath(obj, referenceForModel(SubscriptionModel));
  const subscriptionState = _.get(obj, 'status.state', 'Unknown');
  const uid = getUID(obj);
  const getStatus = () => {
    if (_.isEmpty(catalogSource)) {
      return (
        <>
          <WarningStatus title="Cannot update" />
          <span className="text-muted">Catalog source was removed.</span>
        </>
      );
    }
    if (FAILED_SUBSCRIPTION_STATES.includes(subscriptionState)) {
      return (
        <span className="co-icon-and-text co-error">
          <ErrorStatus title={subscriptionState} />
        </span>
      );
    }

    if (subscriptionState === SubscriptionState.SubscriptionStateUpgradePending) {
      return (
        <span className="co-icon-and-text">
          <ProgressStatus title={subscriptionState} />
        </span>
      );
    }
    return 'Unknown';
  };

  return (
    <TableRow id={uid} trKey={key} {...rest}>
      {/* Name */}
      <TableData className={tableColumnClasses[0]}>
        <Link to={route}>
          <ClusterServiceVersionLogo
            icon={null}
            displayName={csvName}
            version={null}
            provider={null}
          />
        </Link>
      </TableData>

      {/* Namespace */}
      <TableData className={tableColumnClasses[1]}>
        <ResourceLink kind="Namespace" title={namespace} name={namespace} />
      </TableData>

      {/* Deployment */}
      <TableData className={tableColumnClasses[2]}>
        <span className="text-muted">None</span>
      </TableData>

      {/* Status */}
      <TableData className={tableColumnClasses[3]}>{getStatus()}</TableData>

      {/* Provided APIs */}
      <TableData className={tableColumnClasses[4]}>
        <span className="text-muted">None</span>
      </TableData>

      {/* Kabob */}
      <TableData className={tableColumnClasses[5]}>
        <ResourceKebab resource={obj} kind={referenceFor(obj)} actions={menuActions} />
      </TableData>
    </TableRow>
  );
};

const InstalledOperatorTableRow: React.FC<InstalledOperatorTableRowProps> = ({
  catalogSources = [],
  obj,
  subscriptions = [],
  ...rest
}) => {
  const subscription = isCSV(obj)
    ? subscriptionForCSV(subscriptions, obj as ClusterServiceVersionKind)
    : (obj as SubscriptionKind);
  const catalogSource = catalogSourceForSubscription(catalogSources, subscription);

  return isCSV(obj) ? (
    <ClusterServiceVersionTableRow
      {...rest}
      catalogSource={catalogSource}
      obj={obj as ClusterServiceVersionKind}
      subscription={subscription}
    />
  ) : (
    <FailedSubscriptionTableRow
      {...rest}
      catalogSource={catalogSource}
      obj={subscription as SubscriptionKind}
    />
  );
};

const NoOperatorsMatchFilterMsg = () => <MsgBox title="No Operators Found" />;

const noDataDetail = (
  <>
    <div>
      No Operators are available for project{' '}
      <span className="co-clusterserviceversion-empty__state__namespace">
        {UIActions.getActiveNamespace()}
      </span>
    </div>
    <div>
      Discover and install Operators from the <a href="/operatorhub">OperatorHub</a>.
    </div>
  </>
);
const NoDataEmptyMsg = () => <MsgBox title="No Operators Found" detail={noDataDetail} />;

export const ClusterServiceVersionList: React.SFC<ClusterServiceVersionListProps> = ({
  subscriptions,
  catalogSources,
  ...rest
}) => {
  return (
    <Table
      {...rest}
      aria-label="Installed Operators"
      Header={ClusterServiceVersionTableHeader}
      Row={(rowProps) => (
        <InstalledOperatorTableRow
          {...rowProps}
          catalogSources={catalogSources.data}
          subscriptions={subscriptions.data}
        />
      )}
      EmptyMsg={NoOperatorsMatchFilterMsg}
      NoDataEmptyMsg={NoDataEmptyMsg}
      virtualize
    />
  );
};

export const ClusterServiceVersionsPage: React.FC<ClusterServiceVersionsPageProps> = (props) => {
  const title = 'Installed Operators';
  const helpText = (
    <p className="co-help-text">
      Installed Operators are represented by Cluster Service Versions within this namespace. For
      more information, see the{' '}
      <ExternalLink
        href="https://github.com/operator-framework/operator-lifecycle-manager/blob/master/doc/design/architecture.md"
        text="Operator Lifecycle Manager documentation"
      />
      . Or create an Operator and Cluster Service Version using the{' '}
      <ExternalLink href="https://github.com/operator-framework/operator-sdk" text="Operator SDK" />
      .
    </p>
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
        isSubscription(obj) ||
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
      <PageHeading title={title} />
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
          },
          {
            kind: referenceForModel(CatalogSourceModel),
            prop: 'catalogSources',
          },
        ]}
        flatten={flatten}
        namespace={props.namespace}
        ListComponent={ClusterServiceVersionList}
        helpText={helpText}
        showTitle={false}
      />
    </>
  );
};

export const MarkdownView = (props: {
  content: string;
  styles?: string;
  exactHeight?: boolean;
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

export const CRDCard: React.SFC<CRDCardProps> = (props) => {
  const { csv, crd, canCreate } = props;
  const reference = referenceForProvidedAPI(crd);
  const model = modelFor(reference);
  const createRoute = () =>
    `/k8s/ns/${csv.metadata.namespace}/${ClusterServiceVersionModel.plural}/${
      csv.metadata.name
    }/${reference}/~new`;
  return (
    <Card>
      <CardHeader>
        <ResourceLink
          kind={referenceForProvidedAPI(crd)}
          title={crd.name}
          linkTo={false}
          displayName={crd.displayName}
        />
      </CardHeader>
      <CardBody>
        <p>{crd.description}</p>
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

export const CRDCardRow = connect(crdCardRowStateToProps)((props: CRDCardRowProps) => (
  <div className="co-crd-card-row">
    {_.isEmpty(props.crdDescs) ? (
      <span className="text-muted">No Kubernetes APIs are being provided by this Operator.</span>
    ) : (
      props.crdDescs.map((desc) => (
        <CRDCard
          key={referenceForProvidedAPI(desc)}
          crd={desc}
          csv={props.csv}
          canCreate={props.createable.includes(referenceForProvidedAPI(desc))}
        />
      ))
    )}
  </div>
));

export const ClusterServiceVersionDetails: React.SFC<ClusterServiceVersionDetailsProps> = (
  props,
) => {
  const { spec, metadata, status } = props.obj;

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
        <SectionHeading text="ClusterServiceVersion Overview" />
        <div className="co-m-pane__body-group">
          <div className="row">
            <div className="col-sm-6">
              <ResourceSummary resource={props.obj} />
            </div>
            <div className="col-sm-6">
              <dt>Status</dt>
              <dd>{status ? status.phase : 'Unknown'}</dd>
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
              {_.get(status, 'reason') === CSVConditionReason.CSVReasonCopied ? (
                <dd>
                  <ResourceLink
                    name={metadata.name}
                    namespace={operatorNamespaceFor(props.obj)}
                    kind={referenceFor(props.obj)}
                  />
                </dd>
              ) : (
                <dd>{operatorGroupFor(props.obj) || '-'}</dd>
              )}
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

  const [subscription, setSubscription] = React.useState();

  React.useEffect(() => {
    setSubscription(subscriptionForCSV(subscriptions, obj));
  }, [obj, subscriptions]);

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
    return (providedAPIsFor(obj).length > 1
      ? [{ href: 'instances', name: 'All Instances', component: ProvidedAPIsPage }]
      : ([] as Page[])
    ).concat(
      providedAPIsFor(obj).map((desc: CRDDescription) => ({
        href: referenceForProvidedAPI(desc),
        name: desc.displayName,
        component: React.memo(
          () => (
            <ProvidedAPIPage
              csv={obj}
              kind={referenceForProvidedAPI(desc)}
              namespace={obj.metadata.namespace}
            />
          ),
          _.isEqual,
        ),
      })),
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
      Kebab.factory.Edit(model, obj),
      ...(_.isEmpty(subscription)
        ? [Kebab.factory.Delete(model, obj)]
        : [editSubscription(subscription), uninstall(subscription)]),
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
          path: `/k8s/ns/${props.match.params.ns}/${props.match.params.plural}`,
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
  catalogSource: CatalogSourceKind;
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
};

export type CRDCardProps = {
  crd: CRDDescription | APIServiceDefinition;
  csv: ClusterServiceVersionKind;
  canCreate: boolean;
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
  catalogSources: CatalogSourceKind[];
  index: number;
  key?: string;
  obj: ClusterServiceVersionKind | SubscriptionKind;
  style: object;
  subscriptions: SubscriptionKind[];
};

export type ClusterServiceVersionTableRowProps = {
  catalogSource: CatalogSourceKind;
  index: number;
  key?: string;
  obj: ClusterServiceVersionKind;
  style: object;
  subscription: SubscriptionKind;
};

export type FailedSubscriptionTableRowProps = {
  catalogSource: CatalogSourceKind;
  index: number;
  key?: string;
  obj: SubscriptionKind;
  style: object;
};

export type CSVSubscriptionProps = {
  catalogSources: CatalogSourceKind[];
  installPlans: InstallPlanKind[];
  obj: ClusterServiceVersionKind;
  packageManifests: PackageManifestKind[];
  subscriptions: SubscriptionKind[];
};

// TODO(alecmerdler): Find Webpack loader/plugin to add `displayName` to React components automagically
ClusterServiceVersionList.displayName = 'ClusterServiceVersionList';
ClusterServiceVersionsPage.displayName = 'ClusterServiceVersionsPage';
ClusterServiceVersionTableRow.displayName = 'ClusterServiceVersionTableRow';
ClusterServiceVersionTableHeader.displayName = 'ClusterServiceVersionTableHeader';
CRDCard.displayName = 'CRDCard';
ClusterServiceVersionsDetailsPage.displayName = 'ClusterServiceVersionsDetailsPage';
ClusterServiceVersionDetails.displayName = 'ClusterServiceVersionDetails';
CSVSubscription.displayName = 'CSVSubscription';
