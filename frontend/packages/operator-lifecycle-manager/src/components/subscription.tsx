import * as React from 'react';
import * as _ from 'lodash';
import { match, Link } from 'react-router-dom';
import { sortable } from '@patternfly/react-table';
import * as classNames from 'classnames';
import { Alert, Button } from '@patternfly/react-core';
import { InProgressIcon, PencilAltIcon } from '@patternfly/react-icons';
import {
  DetailsPage,
  MultiListPage,
  Table,
  TableRow,
  TableData,
} from '@console/internal/components/factory';
import {
  MsgBox,
  ResourceLink,
  ResourceKebab,
  navFactory,
  Kebab,
  ResourceSummary,
  LoadingInline,
  SectionHeading,
} from '@console/internal/components/utils';
import { removeQueryArgument } from '@console/internal/components/utils/router';
import {
  referenceForModel,
  k8sGet,
  k8sPatch,
  k8sKill,
  k8sUpdate,
  K8sResourceKind,
} from '@console/internal/module/k8s';
import {
  YellowExclamationTriangleIcon,
  GreenCheckCircleIcon,
  getNamespace,
  getName,
  WarningStatus,
} from '@console/shared';
import {
  SubscriptionModel,
  ClusterServiceVersionModel,
  CatalogSourceModel,
  InstallPlanModel,
  PackageManifestModel,
  OperatorGroupModel,
} from '../models';
import {
  SubscriptionKind,
  SubscriptionState,
  PackageManifestKind,
  InstallPlanApproval,
  ClusterServiceVersionKind,
  OperatorGroupKind,
  InstallPlanKind,
  InstallPlanPhase,
  CatalogSourceKind,
} from '../types';
import { requireOperatorGroup } from './operator-group';
import { createUninstallOperatorModal } from './modals/uninstall-operator-modal';
import { createSubscriptionChannelModal } from './modals/subscription-channel-modal';
import { createInstallPlanApprovalModal } from './modals/installplan-approval-modal';

export const catalogSourceForSubscription = (
  catalogSources: CatalogSourceKind[] = [],
  subscription: SubscriptionKind,
): CatalogSourceKind =>
  _.find(catalogSources, {
    metadata: {
      name: _.get(subscription, 'spec.source'),
      namespace: _.get(subscription, 'spec.sourceNamespace'),
    },
  });

export const installedCSVForSubscription = (
  clusterServiceVersions: ClusterServiceVersionKind[] = [],
  subscription: SubscriptionKind,
): ClusterServiceVersionKind =>
  _.find(clusterServiceVersions, {
    metadata: {
      name: _.get(subscription, 'status.installedCSV'),
    },
  });

export const packageForSubscription = (
  packageManifests: PackageManifestKind[] = [],
  subscription: SubscriptionKind,
): PackageManifestKind =>
  _.find(packageManifests, {
    metadata: {
      name: _.get(subscription, 'spec.name'),
    },
    status: {
      packageName: _.get(subscription, 'spec.name'),
      catalogSource: _.get(subscription, 'spec.source'),
      catalogSourceNamespace: _.get(subscription, 'spec.sourceNamespace'),
    },
  });

export const installPlanForSubscription = (
  installPlans: InstallPlanKind[] = [],
  subscription: SubscriptionKind,
): InstallPlanKind =>
  _.find(installPlans, {
    metadata: {
      name: _.get(subscription, 'status.installplan.name'),
    },
  });

const tableColumnClasses = [
  classNames('col-md-3', 'col-sm-4', 'col-xs-6'),
  classNames('col-md-3', 'col-sm-4', 'col-xs-6'),
  classNames('col-lg-2', 'col-md-3', 'col-sm-4', 'hidden-xs'),
  classNames('col-lg-2', 'col-md-3', 'hidden-sm', 'hidden-xs'),
  classNames('col-lg-2', 'hidden-md', 'hidden-sm', 'hidden-xs'),
  Kebab.columnClass,
];

export const SubscriptionTableHeader = () => {
  return [
    {
      title: 'Name',
      sortField: 'metadata.name',
      transforms: [sortable],
      props: { className: tableColumnClasses[0] },
    },
    {
      title: 'Namespace',
      sortField: 'metadata.namespace',
      transforms: [sortable],
      props: { className: tableColumnClasses[1] },
    },
    {
      title: 'Status',
      props: { className: tableColumnClasses[2] },
    },
    {
      title: 'Channel',
      props: { className: tableColumnClasses[3] },
    },
    {
      title: 'Approval Strategy',
      props: { className: tableColumnClasses[4] },
    },
    {
      title: '',
      props: { className: tableColumnClasses[5] },
    },
  ];
};
SubscriptionTableHeader.displayName = 'SubscriptionTableHeader';

const subscriptionState = (state: SubscriptionState) => {
  switch (state) {
    case SubscriptionState.SubscriptionStateUpgradeAvailable:
      return (
        <span>
          <YellowExclamationTriangleIcon /> Upgrade available
        </span>
      );
    case SubscriptionState.SubscriptionStateUpgradePending:
      return (
        <span>
          <InProgressIcon className="text-primary" /> Upgrading
        </span>
      );
    case SubscriptionState.SubscriptionStateAtLatest:
      return (
        <span>
          <GreenCheckCircleIcon /> Up to date
        </span>
      );
    default:
      return (
        <span className={_.isEmpty(state) ? 'text-muted' : ''}>{state || 'Unknown failure'}</span>
      );
  }
};

const menuActions = [
  Kebab.factory.Edit,
  (kind, obj) => ({
    label: 'Remove Subscription',
    callback: () => createUninstallOperatorModal({ k8sKill, k8sGet, k8sPatch, subscription: obj }),
    accessReview: {
      group: kind.apiGroup,
      resource: kind.plural,
      name: obj.metadata.name,
      namespace: obj.metadata.namespace,
      verb: 'delete',
    },
  }),
  (kind, obj) => {
    const installedCSV = _.get(obj, 'status.installedCSV');
    return {
      label: `View ${ClusterServiceVersionModel.kind}...`,
      href: `/k8s/ns/${obj.metadata.namespace}/${ClusterServiceVersionModel.plural}/${installedCSV}`,
      hidden: !installedCSV,
    };
  },
];

export const SubscriptionTableRow: React.FC<SubscriptionTableRowProps> = ({
  obj,
  index,
  key,
  style,
}) => {
  return (
    <TableRow id={obj.metadata.uid} index={index} trKey={key} style={style}>
      <TableData className={tableColumnClasses[0]}>
        <ResourceLink
          kind={referenceForModel(SubscriptionModel)}
          name={obj.metadata.name}
          namespace={obj.metadata.namespace}
          title={obj.metadata.name}
        />
      </TableData>
      <TableData className={tableColumnClasses[1]}>
        <ResourceLink
          kind="Namespace"
          name={obj.metadata.namespace}
          title={obj.metadata.namespace}
          displayName={obj.metadata.namespace}
        />
      </TableData>
      <TableData className={tableColumnClasses[2]}>
        {subscriptionState(_.get(obj.status, 'state'))}
      </TableData>
      <TableData className={classNames(tableColumnClasses[3], 'co-truncate', 'co-select-to-copy')}>
        {obj.spec.channel || 'default'}
      </TableData>
      <TableData className={tableColumnClasses[4]}>
        {obj.spec.installPlanApproval || 'Automatic'}
      </TableData>
      <TableData className={tableColumnClasses[5]}>
        <ResourceKebab
          actions={menuActions}
          kind={referenceForModel(SubscriptionModel)}
          resource={obj}
        />
      </TableData>
    </TableRow>
  );
};
SubscriptionTableRow.displayName = 'SubscriptionTableRow';
export type SubscriptionTableRowProps = {
  obj: K8sResourceKind;
  index: number;
  key?: string;
  style: object;
};

export const SubscriptionsList = requireOperatorGroup((props: SubscriptionsListProps) => (
  <Table
    {...props}
    aria-label="Operator Subscriptions"
    Header={SubscriptionTableHeader}
    Row={SubscriptionTableRow}
    EmptyMsg={() => (
      <MsgBox
        title="No Subscriptions Found"
        detail="Each namespace can subscribe to a single channel of a package for automatic updates."
      />
    )}
    virtualize
  />
));

export const SubscriptionsPage: React.SFC<SubscriptionsPageProps> = (props) => {
  return (
    <MultiListPage
      {...props}
      resources={[
        {
          kind: referenceForModel(SubscriptionModel),
          namespace: props.namespace,
          namespaced: true,
          prop: 'subscription',
        },
        {
          kind: referenceForModel(OperatorGroupModel),
          namespace: props.namespace,
          namespaced: true,
          prop: 'operatorGroup',
        },
      ]}
      flatten={(resources) => _.get(resources.subscription, 'data', [])}
      title="Subscriptions"
      helpText="Operator Subscriptions keep your services up to date by tracking a channel in a package. The approval strategy determines either manual or automatic updates."
      showTitle={false}
      canCreate
      createProps={{ to: '/operatorhub' }}
      createButtonText="Create Subscription"
      ListComponent={SubscriptionsList}
      filterLabel="Subscriptions by package"
    />
  );
};

export const SubscriptionDetails: React.FC<SubscriptionDetailsProps> = ({
  catalogSources = [],
  clusterServiceVersions = [],
  installPlans = [],
  obj,
  packageManifests = [],
}) => {
  const catalogSource = catalogSourceForSubscription(catalogSources, obj);
  const installedCSV = installedCSVForSubscription(clusterServiceVersions, obj);
  const installPlan = installPlanForSubscription(installPlans, obj);
  const installStatusPhase = _.get(installPlan, 'status.phase');
  const installStatusMessage = _.get(installPlan, 'status.message') || 'Unknown';

  const pkg = packageForSubscription(packageManifests, obj);
  if (new URLSearchParams(window.location.search).has('showDelete')) {
    createUninstallOperatorModal({ k8sKill, k8sGet, k8sPatch, subscription: obj })
      .result.then(() => removeQueryArgument('showDelete'))
      .catch(_.noop);
  }

  return (
    <div className="co-m-pane__body">
      {!catalogSource && (
        <Alert isInline className="co-alert" variant="warning" title="Catalog Source Removed">
          The catalog source for this operator has been removed. The catalog source must be added
          back in order for this opertor to receive any updates.
        </Alert>
      )}
      {installStatusPhase === InstallPlanPhase.InstallPlanPhaseFailed && (
        <Alert
          isInline
          className="co-alert"
          variant="danger"
          title={`${installStatusPhase}: ${installStatusMessage}`}
        />
      )}
      <SectionHeading text="Subscription Details" />
      <div className="co-m-pane__body-group">
        <SubscriptionUpdates
          catalogSource={catalogSource}
          pkg={pkg}
          obj={obj}
          installedCSV={installedCSV}
          installPlan={installPlan}
        />
      </div>
      <div className="co-m-pane__body-group">
        <div className="row">
          <div className="col-sm-6">
            <ResourceSummary resource={obj} showAnnotations={false} />
          </div>
          <div className="col-sm-6">
            <dl className="co-m-pane__details">
              <dt>Installed Version</dt>
              <dd>
                {installedCSV ? (
                  <ResourceLink
                    kind={referenceForModel(ClusterServiceVersionModel)}
                    name={getName(installedCSV)}
                    namespace={getNamespace(installedCSV)}
                    title={getName(installedCSV)}
                  />
                ) : (
                  'None'
                )}
              </dd>
              <dt>Starting Version</dt>
              <dd>{obj.spec.startingCSV || 'None'}</dd>
              <dt>Catalog Source</dt>
              <dd>
                {catalogSource ? (
                  <ResourceLink
                    kind={referenceForModel(CatalogSourceModel)}
                    name={getName(catalogSource)}
                    namespace={getNamespace(catalogSource)}
                    title={getName(catalogSource)}
                  />
                ) : (
                  'None'
                )}
              </dd>
              <dt>Install Plan</dt>
              <dd>
                {installPlan ? (
                  <ResourceLink
                    kind={referenceForModel(InstallPlanModel)}
                    name={getName(installPlan)}
                    namespace={getNamespace(installPlan)}
                    title={getName(installPlan)}
                  />
                ) : (
                  'None'
                )}
              </dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
};

export class SubscriptionUpdates extends React.Component<
  SubscriptionUpdatesProps,
  SubscriptionUpdatesState
> {
  constructor(props) {
    super(props);
    this.state = {
      waitingForUpdate: false,
      installPlanApproval: _.get(props.obj, 'spec.installPlanApproval'),
      channel: _.get(props.obj, 'spec.channel'),
    };
  }

  static getDerivedStateFromProps(nextProps, prevState) {
    const stillWaiting =
      prevState.waitingForUpdate &&
      _.get(nextProps, 'obj.spec.channel') === prevState.channel &&
      _.get(nextProps, 'obj.spec.installPlanApproval') === prevState.installPlanApproval;

    return stillWaiting
      ? null
      : {
          waitingForUpdate: false,
          channel: _.get(nextProps, 'obj.spec.channel'),
          installPlanApproval: _.get(nextProps, 'obj.spec.installPlanApproval'),
        };
  }

  render() {
    const { catalogSource, installedCSV, obj, pkg } = this.props;

    const k8sUpdateAndWait = (...args) =>
      k8sUpdate(...args).then(() => this.setState({ waitingForUpdate: true }));
    const channelModal = () =>
      createSubscriptionChannelModal({ subscription: obj, pkg, k8sUpdate: k8sUpdateAndWait });
    const approvalModal = () =>
      createInstallPlanApprovalModal({ obj, k8sUpdate: k8sUpdateAndWait });
    const installPlanPhase = (installPlan: InstallPlanKind) => {
      switch (_.get(installPlan, 'status.phase') as InstallPlanPhase) {
        case InstallPlanPhase.InstallPlanPhaseRequiresApproval:
          return '1 requires approval';
        case InstallPlanPhase.InstallPlanPhaseFailed:
          return '1 failed';
        default:
          return '1 installing';
      }
    };

    return (
      <div className="co-detail-table">
        <div className="co-detail-table__row row">
          <div className="co-detail-table__section col-sm-3">
            <dl className="co-m-pane__details">
              <dt className="co-detail-table__section-header">Channel</dt>
              <dd>
                {this.state.waitingForUpdate ? (
                  <LoadingInline />
                ) : (
                  <Button
                    type="button"
                    isInline
                    onClick={channelModal}
                    variant="link"
                    isDisabled={!pkg}
                  >
                    {obj.spec.channel || 'default'}
                    {pkg && <PencilAltIcon className="co-icon-space-l pf-c-button-icon--plain" />}
                  </Button>
                )}
              </dd>
            </dl>
          </div>
          <div className="co-detail-table__section col-sm-3">
            <dl className="co-m-pane__details">
              <dt className="co-detail-table__section-header">Approval</dt>
              <dd>
                {this.state.waitingForUpdate ? (
                  <LoadingInline />
                ) : (
                  <Button type="button" isInline onClick={approvalModal} variant="link">
                    {obj.spec.installPlanApproval || 'Automatic'}
                    <PencilAltIcon className="co-icon-space-l pf-c-button-icon--plain" />
                  </Button>
                )}
              </dd>
            </dl>
          </div>
          <div className="co-detail-table__section co-detail-table__section--last col-sm-6">
            <dl className="co-m-pane__details">
              <dt className="co-detail-table__section-header">Upgrade Status</dt>
              {catalogSource ? (
                <dd>{subscriptionState(_.get(obj.status, 'state'))}</dd>
              ) : (
                <dd>
                  <WarningStatus title="Cannot update" />
                  <span className="text-muted">Catalog source was removed</span>
                </dd>
              )}
            </dl>
            {catalogSource && (
              <>
                <div className="co-detail-table__bracket" />
                <div className="co-detail-table__breakdown">
                  {_.get(obj.status, 'installedCSV') && installedCSV ? (
                    <Link
                      to={`/k8s/ns/${obj.metadata.namespace}/${referenceForModel(
                        ClusterServiceVersionModel,
                      )}/${_.get(obj.status, 'installedCSV')}`}
                    >
                      1 installed
                    </Link>
                  ) : (
                    <span>0 installed</span>
                  )}
                  {_.get(obj.status, 'state') ===
                    SubscriptionState.SubscriptionStateUpgradePending &&
                  _.get(obj.status, 'installplan') &&
                  this.props.installPlan ? (
                    <Link
                      to={`/k8s/ns/${obj.metadata.namespace}/${referenceForModel(
                        InstallPlanModel,
                      )}/${_.get(obj.status, 'installplan.name')}`}
                    >
                      <span>{installPlanPhase(this.props.installPlan)}</span>
                    </Link>
                  ) : (
                    <span>0 installing</span>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }
}

export const SubscriptionDetailsPage: React.SFC<SubscriptionDetailsPageProps> = (props) => (
  <DetailsPage
    {...props}
    namespace={props.match.params.ns}
    kind={referenceForModel(SubscriptionModel)}
    name={props.match.params.name}
    pages={[navFactory.details(SubscriptionDetails), navFactory.editYaml()]}
    resources={[
      {
        kind: referenceForModel(PackageManifestModel),
        isList: true,
        namespace: props.namespace,
        prop: 'packageManifests',
      },
      {
        kind: referenceForModel(InstallPlanModel),
        isList: true,
        namespace: props.namespace,
        prop: 'installPlans',
      },
      {
        kind: referenceForModel(ClusterServiceVersionModel),
        namespace: props.namespace,
        isList: true,
        prop: 'clusterServiceVersions',
      },
      {
        kind: referenceForModel(CatalogSourceModel),
        isList: true,
        prop: 'catalogSources',
      },
    ]}
    menuActions={menuActions}
  />
);

export type SubscriptionsPageProps = {
  namespace?: string;
  match?: match<{ ns?: string }>;
};

export type SubscriptionsListProps = {
  loaded: boolean;
  loadError?: string;
  data: SubscriptionKind[];
  operatorGroup: { loaded: boolean; data?: OperatorGroupKind[] };
};

export type SubscriptionUpdatesProps = {
  catalogSource: CatalogSourceKind;
  obj: SubscriptionKind;
  pkg: PackageManifestKind;
  installedCSV?: ClusterServiceVersionKind;
  installPlan?: InstallPlanKind;
};

export type SubscriptionUpdatesState = {
  waitingForUpdate: boolean;
  channel: string;
  installPlanApproval: InstallPlanApproval;
};

export type SubscriptionDetailsProps = {
  catalogSources?: CatalogSourceKind[];
  clusterServiceVersions?: ClusterServiceVersionKind[];
  installPlans?: InstallPlanKind[];
  obj: SubscriptionKind;
  packageManifests: PackageManifestKind[];
};

export type SubscriptionDetailsPageProps = {
  match: match<{ ns: string; name: string }>;
  namespace: string;
};

SubscriptionsList.displayName = 'SubscriptionsList';
SubscriptionsPage.displayName = 'SubscriptionsPage';
SubscriptionDetails.displayName = 'SubscriptionDetails';
SubscriptionDetailsPage.displayName = 'SubscriptionDetailsPage';
