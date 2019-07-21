import * as React from 'react';
import { Link, match as RouterMatch } from 'react-router-dom';
import * as _ from 'lodash-es';
import { connect } from 'react-redux';
import * as classNames from 'classnames';
import { sortable } from '@patternfly/react-table';
import { Helmet } from 'react-helmet';
import { AddCircleOIcon } from '@patternfly/react-icons';
import { Alert, Card, CardBody, CardFooter, CardHeader } from '@patternfly/react-core';

import { SuccessStatus, ErrorStatus, ProgressStatus } from '@console/shared';
import { ProvidedAPIsPage, ProvidedAPIPage } from './operand';
import { DetailsPage, Table, TableRow, TableData, MultiListPage } from '../factory';
import { withFallback } from '../utils/error-boundary';
import { referenceForModel, referenceFor, GroupVersionKind, K8sKind, k8sKill, k8sPatch, k8sGet } from '../../module/k8s';
import { ClusterServiceVersionModel, SubscriptionModel, PackageManifestModel } from '../../models';
import { ResourceEventStream } from '../events';
import { Conditions } from '../conditions';
import { createDisableApplicationModal } from '../modals/disable-application-modal';
import {
  ClusterServiceVersionKind,
  ClusterServiceVersionLogo,
  ClusterServiceVersionPhase,
  CRDDescription,
  referenceForProvidedAPI,
  APIServiceDefinition,
  CSVConditionReason,
  providedAPIsFor,
  SubscriptionKind,
  PackageManifestKind,
  copiedLabelKey,
  SubscriptionState,
} from './index';
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
  Firehose,
  FirehoseResult,
  StatusBox,
  Page,
  resourcePathFromModel,
  KebabOption,
  resourceObjPath,
} from '../utils';
import { operatorGroupFor, operatorNamespaceFor } from './operator-group';
import { SubscriptionDetails } from './subscription';

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
      title: 'Name', sortField: 'metadata.name', transforms: [sortable],
      props: { className: tableColumnClasses[0] },
    },
    {
      title: 'Namespace', props: { className: tableColumnClasses[1] },
    },
    {
      title: 'Deployment', props: { className: tableColumnClasses[2] },
    },
    {
      title: 'Status', props: { className: tableColumnClasses[3] },
    },
    {
      title: 'Provided APIs', props: { className: tableColumnClasses[4] },
    },
    {
      title: '', props: { className: tableColumnClasses[5] },
    },
  ];
};

const editSubscription = (sub: SubscriptionKind) => !_.isNil(sub)
  ? ({
    label: 'Edit Subscription',
    href: `${resourcePathFromModel(SubscriptionModel, sub.metadata.name, sub.metadata.namespace)}/yaml`,
  }) as KebabOption
  : null;
const uninstall = (sub: SubscriptionKind) => !_.isNil(sub)
  ? ({
    label: 'Uninstall Operator',
    callback: () => createDisableApplicationModal({k8sKill, k8sGet, k8sPatch, subscription: sub}),
    accessReview: {
      group: SubscriptionModel.apiGroup,
      resource: SubscriptionModel.plural,
      name: sub.metadata.name,
      namespace: sub.metadata.namespace,
      verb: 'delete',
    },
  }) as KebabOption
  : null;

export const ClusterServiceVersionTableRow = withFallback<ClusterServiceVersionTableRowProps>((props) => {
  const {obj, index, key, style, subscription} = props;

  const route = resourceObjPath(obj, referenceForModel(ClusterServiceVersionModel));
  const statusString = _.get(obj, 'status.reason', ClusterServiceVersionPhase.CSVPhaseUnknown);
  const showSuccessIcon = statusString === 'Copied' || statusString === 'InstallSucceeded';
  const subscriptionState = (state: SubscriptionState) => {
    switch (state) {
      case SubscriptionState.SubscriptionStateUpgradeAvailable: return 'Upgrade available';
      case SubscriptionState.SubscriptionStateUpgradePending: return 'Upgrading';
      case SubscriptionState.SubscriptionStateAtLatest: return 'Up to date';
      default: return '';
    }
  };
  const installStatus = obj.status && obj.status.phase !== ClusterServiceVersionPhase.CSVPhaseFailed
    ? <span className={classNames({'co-icon-and-text': showSuccessIcon})}>{showSuccessIcon &&
        <SuccessStatus title={statusString} />}
    </span>
    : <span className="co-error co-icon-and-text"><ErrorStatus title="Failed" /></span>;
  const menuActions = [Kebab.factory.Edit].concat(!_.isNil(subscription)
    ? [() => editSubscription(subscription), () => uninstall(subscription)]
    : []);

  return (
    <TableRow id={obj.metadata.uid} index={index} trKey={key} style={style}>
      <TableData className={tableColumnClasses[0]}>
        <Link to={route}>
          <ClusterServiceVersionLogo icon={_.get(obj, 'spec.icon', [])[0]} displayName={obj.spec.displayName} version={obj.spec.version} provider={obj.spec.provider} />
        </Link>
      </TableData>
      <TableData className={tableColumnClasses[1]}>
        <ResourceLink kind="Namespace" title={obj.metadata.namespace} name={obj.metadata.namespace} />
      </TableData>
      <TableData className={tableColumnClasses[2]}>
        <ResourceLink kind="Deployment" name={obj.spec.install.spec.deployments[0].name} namespace={operatorNamespaceFor(obj)} title={obj.spec.install.spec.deployments[0].name} />
      </TableData>
      <TableData className={tableColumnClasses[3]}>
        <div className="co-clusterserviceversion-row__status">
          { obj.metadata.deletionTimestamp ? 'Disabling' : installStatus }
          { subscription && <span className="text-muted">{subscriptionState(_.get(subscription.status, 'state'))}</span> }
        </div>
      </TableData>
      <TableData className={tableColumnClasses[4]}>
        { _.take(providedAPIsFor(obj), 4).map((desc, i) => <div key={i}>
          <Link to={`${route}/${referenceForProvidedAPI(desc)}`} title={desc.name}>{desc.displayName}</Link>
        </div>)}
        { providedAPIsFor(obj).length > 4 && <Link to={`${route}/instances`} title={`View ${providedAPIsFor(obj).length - 4} more...`}>{`View ${providedAPIsFor(obj).length - 4} more...`}</Link>}
      </TableData>
      <TableData className={tableColumnClasses[5]}>
        <ResourceKebab resource={obj} kind={referenceFor(obj)} actions={menuActions} />
      </TableData>
    </TableRow>
  );
});

export const FailedSubscriptionTableRow: React.FC<FailedSubscriptionTableRowProps> = (props) => {
  const {obj, index, key, style} = props;

  const route = resourceObjPath(obj, referenceForModel(SubscriptionModel));
  const menuActions = [Kebab.factory.Edit, () => uninstall(obj)];
  const subscriptionState = _.get(obj.status, 'state', 'Unknown');

  return <TableRow id={obj.metadata.uid} index={index} trKey={key} style={style}>
    <TableData className={tableColumnClasses[0]}>
      <Link to={route}>
        <ClusterServiceVersionLogo icon={null} displayName={obj.spec.name} version={null} provider={null} />
      </Link>
    </TableData>
    <TableData className={tableColumnClasses[1]}>
      <ResourceLink kind="Namespace" title={obj.metadata.namespace} name={obj.metadata.namespace} />
    </TableData>
    <TableData className={tableColumnClasses[2]}>
      <span className="text-muted">None</span>
    </TableData>
    <TableData className={tableColumnClasses[3]}>
      { ['Unknown', SubscriptionState.SubscriptionStateFailed].includes(subscriptionState) && <span className="co-icon-and-text co-error">
        <ErrorStatus title={subscriptionState} />
      </span> }
      { subscriptionState === SubscriptionState.SubscriptionStateUpgradePending && <span className="co-icon-and-text">
        <ProgressStatus title={subscriptionState} />
      </span>}
    </TableData>
    <TableData className={tableColumnClasses[4]}>
      <span className="text-muted">None</span>
    </TableData>
    <TableData className={tableColumnClasses[5]}>
      <ResourceKebab resource={obj} kind={referenceFor(obj)} actions={menuActions} />
    </TableData>
  </TableRow>;
};

const subscriptionFor = (csv: ClusterServiceVersionKind) => (subs: SubscriptionKind[]) => subs.find(sub => {
  return sub.metadata.namespace === csv.metadata.annotations['olm.operatorNamespace'] && _.get(sub.status, 'installedCSV') === csv.metadata.name;
});

export const ClusterServiceVersionList: React.SFC<ClusterServiceVersionListProps> = (props) => {
  const EmptyMsg = () => <MsgBox title="No Cluster Service Versions Found" detail="" />;

  return <Table
    {...props}
    aria-label="Installed Operators"
    Header={ClusterServiceVersionTableHeader}
    Row={(rowProps) => referenceFor(rowProps.obj) === referenceForModel(ClusterServiceVersionModel)
      ? <ClusterServiceVersionTableRow {...rowProps} subscription={subscriptionFor(rowProps.obj)(_.get(props.subscription, 'data', []))} />
      : <FailedSubscriptionTableRow {...rowProps} />}
    EmptyMsg={EmptyMsg}
    virtualize />;
};

export const ClusterServiceVersionsPage: React.FC<ClusterServiceVersionsPageProps> = (props) => {
  const title = 'Installed Operators';
  const helpText = <p className="co-help-text">
    Installed Operators are represented by Cluster Service Versions within this namespace. For more information, see the <ExternalLink href="https://github.com/operator-framework/operator-lifecycle-manager/blob/master/Documentation/design/architecture.md" text="Operator Lifecycle Manager documentation" />. Or create an Operator and Cluster Service Version using the <ExternalLink href="https://github.com/operator-framework/operator-sdk" text="Operator SDK" />.
  </p>;

  return <React.Fragment>
    <Helmet>
      <title>{title}</title>
    </Helmet>
    <PageHeading title={title} />
    <MultiListPage
      {...props}
      resources={[
        {kind: referenceForModel(ClusterServiceVersionModel), namespace: props.namespace, prop: 'clusterServiceVersion'},
        {kind: referenceForModel(SubscriptionModel), prop: 'subscription'},
      ]}
      flatten={({clusterServiceVersion, subscription}) => _.get(clusterServiceVersion, 'data', [] as ClusterServiceVersionKind[])
        .concat(_.get(subscription, 'data', [] as SubscriptionKind[])
          .filter(sub => ['', sub.metadata.namespace].includes(props.namespace) && _.isNil(_.get((sub as SubscriptionKind).status, 'installedCSV'))))
      }
      namespace={props.namespace}
      ListComponent={ClusterServiceVersionList}
      helpText={helpText}
      showTitle={false} />
  </React.Fragment>;
};

export const MarkdownView = (props: {content: string, styles?: string, exactHeight?: boolean}) => {
  return <AsyncComponent loader={() => import('./markdown-view').then(c => c.SyncMarkdownView)} {...props} />;
};

export const CRDCard: React.SFC<CRDCardProps> = (props) => {
  const {csv, crd, canCreate} = props;
  const createRoute = () => `/k8s/ns/${csv.metadata.namespace}/${ClusterServiceVersionModel.plural}/${csv.metadata.name}/${referenceForProvidedAPI(crd)}/~new`;

  return <Card>
    <CardHeader>
      <ResourceLink kind={referenceForProvidedAPI(crd)} title={crd.name} linkTo={false} displayName={crd.displayName} />
    </CardHeader>
    <CardBody>
      <p>{crd.description}</p>
    </CardBody>
    { canCreate && <CardFooter>
      <Link to={createRoute()}>
        <AddCircleOIcon /> Create Instance
      </Link>
    </CardFooter> }
  </Card>;
};

const crdCardRowStateToProps = ({k8s}, {crdDescs}) => {
  const models: K8sKind[] = _.compact(crdDescs.map(desc => k8s.getIn(['RESOURCES', 'models', referenceForProvidedAPI(desc)])));
  return {
    crdDescs: crdDescs.filter(desc => models.find(m => referenceForModel(m) === referenceForProvidedAPI(desc))),
    createable: models.filter(m => (m.verbs || []).includes('create')).map(m => referenceForModel(m)),
  };
};

export const CRDCardRow = connect(crdCardRowStateToProps)(
  (props: CRDCardRowProps) => <div className="co-crd-card-row">
    { _.isEmpty(props.crdDescs)
      ? <span className="text-muted">No Kubernetes APIs are being provided by this Operator.</span>
      : props.crdDescs.map((desc, i) => <CRDCard key={i} crd={desc} csv={props.csv} canCreate={props.createable.includes(referenceForProvidedAPI(desc))} />) }
  </div>
);

export const ClusterServiceVersionDetails: React.SFC<ClusterServiceVersionDetailsProps> = (props) => {
  const {spec, metadata, status = {} as ClusterServiceVersionKind['status']} = props.obj;

  return <React.Fragment>
    <ScrollToTopOnMount />

    <div className="co-m-pane__body">
      <div className="co-m-pane__body-group">
        <div className="row">
          <div className="col-sm-9">
            {status.phase === ClusterServiceVersionPhase.CSVPhaseFailed && <Alert isInline className="co-alert" variant="danger" title={`${status.phase}: ${status.message}`} />}
            <SectionHeading text="Provided APIs" />
            <CRDCardRow csv={props.obj} crdDescs={providedAPIsFor(props.obj)} />
            <SectionHeading text="Description" />
            <MarkdownView content={spec.description || 'Not available'} />
          </div>
          <div className="col-sm-3">
            <dl className="co-clusterserviceversion-details__field">
              <dt>Provider</dt>
              <dd>{spec.provider && spec.provider.name ? spec.provider.name : 'Not available'}</dd>
              <dt>Created At</dt>
              <dd><Timestamp timestamp={metadata.creationTimestamp} /></dd>
            </dl>
            <dl className="co-clusterserviceversion-details__field">
              <dt>Links</dt>
              { spec.links && spec.links.length > 0
                ? spec.links.map((link, i) => <dd key={i} style={{display: 'flex', flexDirection: 'column'}}>
                  {link.name} <ExternalLink href={link.url} text={link.url || '-'} additionalClassName="co-break-all" />
                </dd>)
                : <dd>Not available</dd> }
            </dl>
            <dl className="co-clusterserviceversion-details__field">
              <dt>Maintainers</dt>
              { spec.maintainers && spec.maintainers.length > 0
                ? spec.maintainers.map((maintainer, i) => <dd key={i} style={{display: 'flex', flexDirection: 'column'}}>
                  {maintainer.name} <a href={`mailto:${maintainer.email}`} className="co-break-all" >{maintainer.email || '-'}</a>
                </dd>)
                : <dd>Not available</dd> }
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
            <dd>{status.phase}</dd>
            <dt>Status Reason</dt>
            <dd>{status.message}</dd>
            <dt>Operator Deployments</dt>
            {spec.install.spec.deployments.map(({name}, i) => <dd key={i}><ResourceLink name={name} kind="Deployment" namespace={operatorNamespaceFor(props.obj)} /></dd>)}
            { _.get(spec.install.spec, 'permissions') && <React.Fragment>
              <dt>Operator Service Accounts</dt>
              {spec.install.spec.permissions.map(({serviceAccountName}, i) => <dd key={i}><ResourceLink name={serviceAccountName} kind="ServiceAccount" namespace={operatorNamespaceFor(props.obj)} /></dd>)}
            </React.Fragment> }
            <dt>Operator Group</dt>
            { _.get(status, 'reason') === CSVConditionReason.CSVReasonCopied
              ? <dd><ResourceLink name={metadata.name} namespace={operatorNamespaceFor(props.obj)} kind={referenceFor(props.obj)} /></dd>
              : <dd>{operatorGroupFor(props.obj) || '-'}</dd> }
          </div>
        </div>
      </div>
    </div>
    <div className="co-m-pane__body">
      <SectionHeading text="Conditions" />
      <Conditions conditions={_.get(status, 'conditions', []).map(c => ({...c, type: c.phase, status: 'True'}))} />
    </div>
  </React.Fragment>;
};

export const CSVSubscription: React.FC<CSVSubscriptionProps> = (props) => {
  type SubscriptionProps = {
    subscription: FirehoseResult<SubscriptionKind[]>;
    packageManifest: FirehoseResult<PackageManifestKind[]>;
    loaded: boolean;
  };

  const Subscription: React.FC<SubscriptionProps> = (subscriptionProps) => {
    const subscription = subscriptionProps.subscription.data.find(sub => _.get(sub.status, 'installedCSV') === props.obj.metadata.name);

    return <StatusBox {...subscriptionProps.subscription}>
      <SubscriptionDetails
        obj={subscription}
        installedCSV={props.obj}
        pkg={subscriptionProps.packageManifest.data.find(pkg => pkg.status.packageName === subscription.spec.name)} />
    </StatusBox>;
  };

  return <Firehose resources={[{
    kind: referenceForModel(SubscriptionModel),
    namespace: props.obj.metadata.annotations[copiedLabelKey],
    isList: true,
    prop: 'subscription',
  }, {
    kind: referenceForModel(PackageManifestModel),
    namespace: props.obj.metadata.namespace,
    isList: true,
    prop: 'packageManifest',
  }]}>
    <Subscription {...props as any} />
  </Firehose>;
};

export const ClusterServiceVersionsDetailsPage: React.FC<ClusterServiceVersionsDetailsPageProps> = (props) => {
  const instancePagesFor = (obj: ClusterServiceVersionKind) => {
    return (providedAPIsFor(obj).length > 1 ? [{href: 'instances', name: 'All Instances', component: ProvidedAPIsPage}] : [] as Page[])
      .concat(providedAPIsFor(obj).map((desc: CRDDescription) => ({
        href: referenceForProvidedAPI(desc),
        name: desc.displayName,
        component: React.memo(() => <ProvidedAPIPage csv={obj} kind={referenceForProvidedAPI(desc)} namespace={obj.metadata.namespace} />, (_.isEqual)),
      })));
  };
  type ExtraResources = {subscription: SubscriptionKind[]};
  const menuActions = (model, obj: ClusterServiceVersionKind, {subscription}: ExtraResources) => [Kebab.factory.Edit(model, obj)].concat(!_.isNil(subscriptionFor(obj)(subscription))
    ? [editSubscription(subscriptionFor(obj)(subscription)), uninstall(subscriptionFor(obj)(subscription))]
    : []);

  const pagesFor = React.useCallback((obj: ClusterServiceVersionKind) => _.compact([
    navFactory.details(ClusterServiceVersionDetails),
    navFactory.editYaml(),
    {
      href: 'subscription',
      name: 'Subscription',
      component: CSVSubscription,
    },
    navFactory.events(ResourceEventStream),
    ...instancePagesFor(obj),
  ]), []);

  return <DetailsPage
    {...props}
    breadcrumbsFor={() => [
      {name: 'Installed Operators', path: `/k8s/ns/${props.match.params.ns}/${props.match.params.plural}`},
      {name: 'Operator Details', path: props.match.url},
    ]}
    resources={[{kind: referenceForModel(SubscriptionModel), isList: true, prop: 'subscription'}]}
    namespace={props.match.params.ns}
    kind={referenceForModel(ClusterServiceVersionModel)}
    name={props.match.params.name}
    pagesFor={pagesFor}
    menuActions={menuActions} />;
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
  subscription: FirehoseResult<SubscriptionKind[]>
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

export type ClusterServiceVersionTableRowProps = {
  obj: ClusterServiceVersionKind;
  subscription: SubscriptionKind;
  index: number;
  key?: string;
  style: object;
};

export type FailedSubscriptionTableRowProps = {
  obj: SubscriptionKind;
  index: number;
  key?: string;
  style: object;
};

export type CSVSubscriptionProps = {
  obj: ClusterServiceVersionKind;
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
