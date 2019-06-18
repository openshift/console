import * as React from 'react';
import { Link, match as RouterMatch } from 'react-router-dom';
import * as _ from 'lodash-es';
import { connect } from 'react-redux';
import * as classNames from 'classnames';
import { sortable } from '@patternfly/react-table';
import { Helmet } from 'react-helmet';
import { Alert } from '@patternfly/react-core';

import { ProvidedAPIsPage, ProvidedAPIPage } from './clusterserviceversion-resource';
import { DetailsPage, ListPage, Table, TableRow, TableData } from '../factory';
import { withFallback } from '../utils/error-boundary';
import { referenceForModel, referenceFor, GroupVersionKind, K8sKind } from '../../module/k8s';
import { ClusterServiceVersionModel } from '../../models';
import { FLAGS as featureFlags } from '../../const';
import { ResourceEventStream } from '../events';
import { Conditions } from '../conditions';
import {
  ClusterServiceVersionKind,
  ClusterServiceVersionLogo,
  ClusterServiceVersionPhase,
  CRDDescription,
  referenceForProvidedAPI,
  APIServiceDefinition,
  CSVConditionReason,
  providedAPIsFor,
} from './index';
import {
  Kebab,
  LoadingBox,
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
} from '../utils';
import { operatorGroupFor, operatorNamespaceFor } from './operator-group';

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
ClusterServiceVersionTableHeader.displayName = 'ClusterServiceVersionTableHeader';

const menuActions = [Kebab.factory.Edit];

export const ClusterServiceVersionTableRow = withFallback<ClusterServiceVersionTableRowProps>(({obj, index, key, style}) => {
  const route = `/k8s/ns/${obj.metadata.namespace}/${ClusterServiceVersionModel.plural}/${obj.metadata.name}`;

  const statusString = _.get(obj, 'status.reason', ClusterServiceVersionPhase.CSVPhaseUnknown);
  const showSuccessIcon = statusString === 'Copied' || statusString === 'InstallSucceeded';
  const installStatus = obj.status && obj.status.phase !== ClusterServiceVersionPhase.CSVPhaseFailed
    ? <span className={classNames(showSuccessIcon && 'co-icon-and-text')}>{showSuccessIcon &&
        <i aria-hidden="true" className="pficon pficon-ok co-icon-and-text__icon" />}{statusString}
    </span>
    : <span className="co-error co-icon-and-text"><i className="fa fa-times-circle co-icon-space-r co-icon-and-text__icon" /> Failed</span>;
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
        {obj.metadata.deletionTimestamp ? 'Disabling' : installStatus}
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

export const ClusterServiceVersionList: React.SFC<ClusterServiceVersionListProps> = (props) => {
  const EmptyMsg = () => <MsgBox title="No Cluster Service Versions Found" detail="" />;

  return <Table {...props} aria-label="Installed Operators" Header={ClusterServiceVersionTableHeader} Row={ClusterServiceVersionTableRow} EmptyMsg={EmptyMsg} virtualize />;
};

const stateToProps = ({k8s, FLAGS}) => ({
  loading: FLAGS.get(featureFlags.OPENSHIFT) === undefined || !k8s.getIn([FLAGS.get(featureFlags.OPENSHIFT) ? 'projects' : 'namespaces', 'loaded']),
});

export const ClusterServiceVersionsPage = connect(stateToProps)((props: ClusterServiceVersionsPageProps) => {
  // Wait for OpenShift feature detection to prevent flash of "disabled" UI
  if (props.loading) {
    return <LoadingBox />;
  }

  const title = 'Installed Operators';
  const helpText = <p className="co-help-text">
    Installed Operators are represented by Cluster Service Versions within this namespace. For more information, see the <ExternalLink href="https://github.com/operator-framework/operator-lifecycle-manager/blob/master/Documentation/design/architecture.md" text="Operator Lifecycle Manager documentation" />. Or create an Operator and Cluster Service Version using the <ExternalLink href="https://github.com/operator-framework/operator-sdk" text="Operator SDK" />.
  </p>;

  return <React.Fragment>
    <Helmet>
      <title>{title}</title>
    </Helmet>
    <PageHeading title={title} />
    <ListPage
      {...props}
      namespace={props.namespace}
      kind={referenceForModel(ClusterServiceVersionModel)}
      ListComponent={ClusterServiceVersionList}
      helpText={helpText}
      showTitle={false} />
  </React.Fragment>;
});

export const MarkdownView = (props: {content: string, styles?: string, exactHeight?: boolean}) => {
  return <AsyncComponent loader={() => import('./markdown-view').then(c => c.SyncMarkdownView)} {...props} />;
};

export const CRDCard: React.SFC<CRDCardProps> = (props) => {
  const {csv, crd, canCreate} = props;
  const createRoute = () => `/k8s/ns/${csv.metadata.namespace}/${ClusterServiceVersionModel.plural}/${csv.metadata.name}/${referenceForProvidedAPI(crd)}/~new`;

  return <div className="co-crd-card">
    <div className="co-crd-card__title">
      <div style={{display: 'flex', alignItems: 'center', fontWeight: 600}}>
        <ResourceLink kind={referenceForProvidedAPI(crd)} title={crd.name} linkTo={false} displayName={crd.displayName} />
      </div>
    </div>
    <div className="co-crd-card__body" style={{margin: '0'}}>
      <p>{crd.description}</p>
    </div>
    { canCreate && <div className="co-crd-card__footer">
      <Link className="co-crd-card__link" to={createRoute()}>
        <span className="pficon pficon-add-circle-o" aria-hidden="true"></span> Create New
      </Link>
    </div> }
  </div>;
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
          <div className="col-sm-9">
            {status.phase === ClusterServiceVersionPhase.CSVPhaseFailed && <Alert isInline className="co-alert" variant="danger" title={`${status.phase}: ${status.message}`} />}
            <SectionHeading text="Provided APIs" />
            <CRDCardRow csv={props.obj} crdDescs={providedAPIsFor(props.obj)} />
            <SectionHeading text="Description" />
            <MarkdownView content={spec.description || 'Not available'} />
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
      {/* FIXME(alecmerdler): Need to modify CSV conditions to follow standard conventions */}
      <SectionHeading text="Conditions" />
      <Conditions conditions={_.get(status, 'conditions', []).map(c => ({...c, type: c.phase, status: 'True'}))} />
    </div>
  </React.Fragment>;
};

export const ClusterServiceVersionsDetailsPage: React.StatelessComponent<ClusterServiceVersionsDetailsPageProps> = (props) => {
  const AllInstances: React.SFC<{obj: ClusterServiceVersionKind}> = ({obj}) => <ProvidedAPIsPage obj={obj} />;
  AllInstances.displayName = 'AllInstances';

  const instancePagesFor = (obj: ClusterServiceVersionKind) => {
    return (providedAPIsFor(obj).length > 1 ? [{href: 'instances', name: 'All Instances', component: AllInstances}] : [])
      .concat(providedAPIsFor(obj).map((desc: CRDDescription) => ({
        href: referenceForProvidedAPI(desc),
        name: desc.displayName,
        /* eslint-disable-next-line react/display-name */
        component: (instancesProps) => <ProvidedAPIPage {...instancesProps} csv={obj} kind={referenceForProvidedAPI(desc)} namespace={props.match.params.ns} />,
      })));
  };

  return <DetailsPage
    {...props}
    breadcrumbsFor={() => [
      {name: 'Installed Operators', path: `/k8s/ns/${props.match.params.ns}/${props.match.params.plural}`},
      {name: 'Operator Details', path: props.match.url},
    ]}
    namespace={props.match.params.ns}
    kind={referenceForModel(ClusterServiceVersionModel)}
    name={props.match.params.name}
    pagesFor={(obj: ClusterServiceVersionKind) => [
      navFactory.details(ClusterServiceVersionDetails),
      navFactory.editYaml(),
      navFactory.events(ResourceEventStream),
      ...instancePagesFor(obj),
    ]}
    menuActions={menuActions} />;
};

export type ClusterServiceVersionsPageProps = {
  kind: string;
  loading?: boolean;
  namespace: string;
  resourceDescriptions: CRDDescription[];
};

export type ClusterServiceVersionListProps = {
  loaded: boolean;
  loadError?: string;
  data: ClusterServiceVersionKind[];
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
  index: number;
  key?: string;
  style: object;
};

// TODO(alecmerdler): Find Webpack loader/plugin to add `displayName` to React components automagically
ClusterServiceVersionList.displayName = 'ClusterServiceVersionList';
ClusterServiceVersionsPage.displayName = 'ClusterServiceVersionsPage';
CRDCard.displayName = 'CRDCard';
ClusterServiceVersionsDetailsPage.displayName = 'ClusterServiceVersionsDetailsPage';
ClusterServiceVersionDetails.displayName = 'ClusterServiceVersionDetails';
