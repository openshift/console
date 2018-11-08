/* eslint-disable no-undef */

import * as React from 'react';
import { Link, match as RouterMatch } from 'react-router-dom';
import * as _ from 'lodash-es';
import { Map as ImmutableMap } from 'immutable';
import { connect } from 'react-redux';
import { Alert } from 'patternfly-react';

import { ProvidedAPIsPage, ProvidedAPIPage } from './clusterserviceversion-resource';
import { DetailsPage, ListHeader, ColHead, List, ListPage } from '../factory';
import { withFallback } from '../utils/error-boundary';
import { referenceForModel, referenceFor } from '../../module/k8s';
import { ClusterServiceVersionModel } from '../../models';
import { AsyncComponent } from '../utils/async';
import { FLAGS as featureFlags } from '../../features';
import { ResourceEventStream } from '../events';
import { Conditions } from '../conditions';
import {
  ClusterServiceVersionKind,
  ClusterServiceVersionLogo,
  ClusterServiceVersionPhase,
  CRDDescription,
  referenceForCRDDesc
} from './index';
import {
  Box,
  Cog,
  LoadingBox,
  MsgBox,
  navFactory,
  OverflowLink,
  PageHeading,
  ResourceCog,
  ResourceLink,
  Timestamp,
  SectionHeading,
  ResourceSummary,
  ScrollToTopOnMount,
} from '../utils';

import * as operatorLogo from '../../imgs/operator.svg';

export const ClusterServiceVersionHeader: React.SFC = () => <ListHeader>
  <ColHead className="col-lg-3 col-md-4 col-sm-4 col-xs-6" sortField="metadata.name">Name</ColHead>
  <ColHead className="col-lg-2 col-md-2 col-sm-4 col-xs-6">Namespace</ColHead>
  <ColHead className="col-lg-2 hidden-md hidden-sm hidden-xs">Deployment</ColHead>
  <ColHead className="col-lg-2 col-md-3 col-sm-4 hidden-xs">Status</ColHead>
  <ColHead className="col-lg-3 col-md-3 hidden-sm hidden-xs">Provided APIs</ColHead>
</ListHeader>;

const menuActions = [Cog.factory.Edit, Cog.factory.Delete];

export const ClusterServiceVersionRow = withFallback<ClusterServiceVersionRowProps>(({obj}) => {
  const route = `/k8s/ns/${obj.metadata.namespace}/${ClusterServiceVersionModel.plural}/${obj.metadata.name}`;

  const installStatus = obj.status && obj.status.phase === ClusterServiceVersionPhase.CSVPhaseSucceeded
    ? <span>Enabled</span>
    : <span className="co-error"><i className="fa fa-times-circle co-icon-space-r" /> {_.get(obj, 'status.reason', ClusterServiceVersionPhase.CSVPhaseUnknown)}</span>;

  return <div className="row co-resource-list__item">
    <div className="col-lg-3 col-md-4 col-sm-4 col-xs-6" style={{display: 'flex', alignItems: 'center'}}>
      <Link to={route}>
        <ClusterServiceVersionLogo icon={_.get(obj, 'spec.icon', [])[0]} displayName={obj.spec.displayName} version={obj.spec.version} provider={obj.spec.provider} />
      </Link>
    </div>
    <div className="col-lg-2 col-md-2 col-sm-4 col-xs-6">
      <ResourceLink kind="Namespace" title={obj.metadata.namespace} name={obj.metadata.namespace} />
    </div>
    <div className="col-lg-2 hidden-md hidden-sm hidden-xs">
      <ResourceLink kind="Deployment" name={obj.spec.install.spec.deployments[0].name} namespace={obj.metadata.namespace} title={obj.spec.install.spec.deployments[0].name} />
    </div>
    <div className="col-lg-2 col-md-3 col-sm-4 hidden-xs">{obj.metadata.deletionTimestamp ? 'Disabling' : installStatus}</div>
    <div className="col-lg-3 col-md-3 hidden-sm hidden-xs">
      { _.take(obj.spec.customresourcedefinitions.owned, 4).map(desc => <div key={desc.name}>
        <Link to={`${route}/${referenceForCRDDesc(desc)}`} title={desc.name}>{desc.displayName}</Link>
      </div>)}
      { obj.spec.customresourcedefinitions.owned.length > 4 && <Link to={`${route}/instances`} title={`View ${obj.spec.customresourcedefinitions.owned.length - 4} more...`}>{`View ${obj.spec.customresourcedefinitions.owned.length - 4} more...`}</Link>}
    </div>
    <div className="co-resource-kebab">
      <ResourceCog resource={obj} kind={referenceFor(obj)} actions={menuActions} />
    </div>
  </div>;
});

const helpText = <p className="co-help-text">
  Cluster Service Versions are installed per namespace from Catalog Sources. For more information, see the <a href="https://github.com/operator-framework/operator-lifecycle-manager/blob/master/Documentation/design/architecture.md" target="_blank" className="co-external-link" rel="noopener noreferrer">Operator Lifecycle Manager documentation</a>.

  Or create an Operator and Cluster Service Version using the <a href="https://github.com/operator-framework/operator-sdk" target="_blank" className="co-external-link" rel="noopener noreferrer">Operator SDK</a>.
</p>;

export const ClusterServiceVersionList: React.SFC<ClusterServiceVersionListProps> = (props) => {
  const EmptyMsg = () => <MsgBox title="No Cluster Service Versions Found" detail="" />;

  return <List {...props} Row={ClusterServiceVersionRow} Header={ClusterServiceVersionHeader} EmptyMsg={EmptyMsg} />;
};

const stateToProps = ({k8s, FLAGS}, {match}) => ({
  loading: FLAGS.get(featureFlags.OPENSHIFT) === undefined || !k8s.getIn([FLAGS.get(featureFlags.OPENSHIFT) ? 'projects' : 'namespaces', 'loaded']),
  namespaceEnabled: k8s.getIn([FLAGS.get(featureFlags.OPENSHIFT) ? 'projects' : 'namespaces', 'data'], ImmutableMap())
    .find((objMap) => objMap.getIn(['metadata', 'name']) === match.params.ns && objMap.getIn(['metadata', 'annotations', 'alm-manager'])) !== undefined,
});

export const ClusterServiceVersionsPage = connect(stateToProps)((props: ClusterServiceVersionsPageProps) => {
  // Wait for OpenShift feature detection to prevent flash of "disabled" UI
  if (props.loading) {
    return <LoadingBox />;
  }

  return props.match.params.ns && !props.namespaceEnabled
    ? <Box className="text-center">
      <img className="co-clusterserviceversion-list__disabled-icon" src={operatorLogo} />
      <MsgBox title="Operator Lifecycle Manager not enabled for this namespace" detail="Please contact a system administrator and ask them to enable Operator Lifecycle Manager to continue." />
    </Box>
    : <React.Fragment>
      <PageHeading title="Cluster Service Versions" />
      <ListPage
        {...props}
        namespace={props.match.params.ns}
        kind={referenceForModel(ClusterServiceVersionModel)}
        ListComponent={ClusterServiceVersionList}
        helpText={helpText}
        filterLabel="Cluster Service Versions by name"
        showTitle={false} />
    </React.Fragment>;
});

export const MarkdownView = (props: {content: string}) => {
  return <AsyncComponent loader={() => import('./markdown-view').then(c => c.SyncMarkdownView)} {...props} />;
};

export const CRDCard: React.SFC<CRDCardProps> = ({crd, csv}) => {
  const createRoute = `/k8s/ns/${csv.metadata.namespace}/${ClusterServiceVersionModel.plural}/${csv.metadata.name}/${referenceForCRDDesc(crd)}/new`;

  return <div className="co-crd-card">
    <div className="co-crd-card__title">
      <div style={{display: 'flex', alignItems: 'center', fontWeight: 600}}>
        <ResourceLink kind={referenceForCRDDesc(crd)} title={crd.name} linkTo={false} displayName={crd.displayName} />
      </div>
    </div>
    <div className="co-crd-card__body" style={{margin: '0'}}>
      <p>{crd.description}</p>
    </div>
    <div className="co-crd-card__footer">
      <Link className="co-crd-card__link" to={createRoute}>
        <span className="pficon pficon-add-circle-o" aria-hidden="true"></span> Create New
      </Link>
    </div>
  </div>;
};

export const CRDCardRow: React.SFC<CRDCardRowProps> = (props) => <div className="co-crd-card-row">
  {props.crdDescs.map(desc => <CRDCard key={desc.name} crd={desc} csv={props.csv} />)}
</div>;

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
                  {link.name} <OverflowLink value={link.url} href={link.url} />
                </dd>)
                : <dd>Not available</dd> }
            </dl>
            <dl className="co-clusterserviceversion-details__field">
              <dt>Maintainers</dt>
              { spec.maintainers && spec.maintainers.length > 0
                ? spec.maintainers.map((maintainer, i) => <dd key={i} style={{display: 'flex', flexDirection: 'column'}}>
                  {maintainer.name} <OverflowLink value={maintainer.email} href={`mailto:${maintainer.email}`} />
                </dd>)
                : <dd>Not available</dd> }
            </dl>
          </div>
          <div className="col-sm-9">
            {status.phase !== ClusterServiceVersionPhase.CSVPhaseSucceeded && <Alert type="error"><strong>{status.phase}</strong>: {status.message}</Alert>}
            <SectionHeading text="Provided APIs" />
            <CRDCardRow csv={props.obj} crdDescs={spec.customresourcedefinitions.owned} />
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
            <ResourceSummary resource={props.obj} showNodeSelector={false} showPodSelector={false} />
          </div>
          <div className="col-sm-6">
            <dt>Status</dt>
            <dd>{status.phase}</dd>
            <dt>Status Reason</dt>
            <dd>{status.message}</dd>
            <dt>Operator Deployments</dt>
            {spec.install.spec.deployments.map(({name}, i) => <dd key={i}><ResourceLink name={name} kind="Deployment" namespace={metadata.namespace} /></dd>)}
            <dt>Operator Service Accounts</dt>
            {spec.install.spec.permissions.map(({serviceAccountName}, i) => <dd key={i}><ResourceLink name={serviceAccountName} kind="ServiceAccount" namespace={metadata.namespace} /></dd>)}
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
    const ownedCRDs = _.get(obj, 'spec.customresourcedefinitions.owned', []);

    return (ownedCRDs.length > 1 ? [{href: 'instances', name: 'All Instances', component: AllInstances}] : []).concat(ownedCRDs.map((desc: CRDDescription) => ({
      href: referenceForCRDDesc(desc),
      name: desc.displayName,
      /* eslint-disable-next-line react/display-name */
      component: (instancesProps) => <ProvidedAPIPage {...instancesProps} csv={obj} kind={referenceForCRDDesc(desc)} namespace={props.match.params.ns} />,
    })));
  };

  return <DetailsPage
    {...props}
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

/* eslint-disable no-undef */
export type ClusterServiceVersionsPageProps = {
  kind: string;
  loading?: boolean;
  namespaceEnabled: boolean;
  match: RouterMatch<{ns?: string}>;
  resourceDescriptions: CRDDescription[];
};

export type ClusterServiceVersionListProps = {
  loaded: boolean;
  loadError?: string;
  data: ClusterServiceVersionKind[];
};

export type CRDCardProps = {
  crd: CRDDescription;
  csv: ClusterServiceVersionKind;
};

export type CRDCardRowProps = {
  crdDescs: CRDDescription[];
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
};

export type ClusterServiceVersionRowProps = {
  obj: ClusterServiceVersionKind;
};
/* eslint-enable no-undef */

// TODO(alecmerdler): Find Webpack loader/plugin to add `displayName` to React components automagically
ClusterServiceVersionList.displayName = 'ClusterServiceVersionList';
ClusterServiceVersionsPage.displayName = 'ClusterServiceVersionsPage';
CRDCard.displayName = 'CRDCard';
ClusterServiceVersionsDetailsPage.displayName = 'ClusterServiceVersionsDetailsPage';
ClusterServiceVersionDetails.displayName = 'ClusterServiceVersionDetails';
ClusterServiceVersionRow.displayName = 'ClusterServiceVersionRow';
ClusterServiceVersionHeader.displayName = 'ClusterServiceVersionHeader';
