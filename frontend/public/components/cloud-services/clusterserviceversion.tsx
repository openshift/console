import * as React from 'react';
import { Link, match as RouterMatch } from 'react-router-dom';
import * as _ from 'lodash-es';
import { Map as ImmutableMap } from 'immutable';
import { connect } from 'react-redux';

import { ClusterServiceVersionKind, ClusterServiceVersionLogo, CRDDescription, ClusterServiceVersionPhase, referenceForCRDDesc } from './index';
import { ClusterServiceVersionResourcesPage } from './clusterserviceversion-resource';
import { DetailsPage, ListHeader, ColHead, List, ListPage } from '../factory';
import { navFactory, Timestamp, ResourceLink, OverflowLink, Dropdown, history, MsgBox, Box, Cog, ResourceCog, NavTitle, LoadingBox } from '../utils';
import { withFallback } from '../utils/error-boundary';
import { referenceForModel, referenceFor } from '../../module/k8s';
import { ClusterServiceVersionModel } from '../../models';
import { AsyncComponent } from '../utils/async';
import { FLAGS as featureFlags } from '../../features';

import * as operatorLogo from '../../imgs/operator.svg';

export const ClusterServiceVersionHeader: React.SFC = () => <ListHeader>
  <ColHead className="col-xs-3" sortField="metadata.name">Name</ColHead>
  <ColHead className="col-xs-3">Namespace</ColHead>
  <ColHead className="col-xs-2">Deployment</ColHead>
  <ColHead className="col-xs-2">Status</ColHead>
  <ColHead className="col-xs-2" />
</ListHeader>;

const menuActions = [Cog.factory.Edit, Cog.factory.Delete];

export const ClusterServiceVersionRow = withFallback<ClusterServiceVersionRowProps>(({obj}) => {
  const route = `/k8s/ns/${obj.metadata.namespace}/${ClusterServiceVersionModel.plural}/${obj.metadata.name}`;

  const installStatus = obj.status && obj.status.phase === ClusterServiceVersionPhase.CSVPhaseSucceeded
    ? <span>Enabled</span>
    : <span className="co-error"><i className="fa fa-times-circle co-icon-space-r" /> {_.get(obj, 'status.reason', ClusterServiceVersionPhase.CSVPhaseUnknown)}</span>;

  return <div className="row co-resource-list__item" style={{display: 'flex', alignItems: 'center'}}>
    <div className="col-xs-3" style={{display: 'flex', alignItems: 'center'}}>
      <ResourceCog resource={obj} kind={referenceFor(obj)} actions={menuActions} />
      <Link to={route}>
        <ClusterServiceVersionLogo icon={_.get(obj, 'spec.icon', [])[0]} displayName={obj.spec.displayName} version={obj.spec.version} provider={obj.spec.provider} />
      </Link>
    </div>
    <div className="col-xs-3">
      <ResourceLink kind="Namespace" title={obj.metadata.namespace} name={obj.metadata.namespace} />
    </div>
    <div className="col-xs-2">
      <ResourceLink kind="Deployment" name={obj.spec.install.spec.deployments[0].name} namespace={obj.metadata.namespace} title={obj.spec.install.spec.deployments[0].name} />
    </div>
    <div className="col-xs-2">{obj.metadata.deletionTimestamp ? 'Disabling' : installStatus}</div>
    <div className="col-xs-2">
      <div style={{display: 'flex', justifyContent: 'flex-end', alignItems: 'center'}}>
        <Link to={`${route}/instances`} title="View instances">View instances</Link>
      </div>
    </div>
  </div>;
});

export const ClusterServiceVersionList: React.SFC<ClusterServiceVersionListProps> = (props) => {
  const EmptyMsg = () => <MsgBox
    title="No Cluster Service Versions Found"
    detail={<div>
      Cluster Service Versions are installed per namespace from Catalog Sources. For more information, see <a href="https://coreos.com/tectonic/docs/latest/alm/using-ocs.html" target="_blank" className="co-external-link" rel="noopener noreferrer">Using Open Cloud Services</a>.

      Or create an Operator and Cluster Service Version using the <a href="https://github.com/operator-framework/helm-app-operator-kit" target="_blank" className="co-external-link" rel="noopener noreferrer">Helm App Operator Kit</a>.
    </div>} />;

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
      <NavTitle title="Cluster Service Versions" />
      <ListPage
        {...props}
        namespace={props.match.params.ns}
        kind={referenceForModel(ClusterServiceVersionModel)}
        ListComponent={ClusterServiceVersionList}
        filterLabel="Cluster Service Versions by name"
        showTitle={false} />
    </React.Fragment>;
});

export const MarkdownView = (props: {content: string}) => {
  return <AsyncComponent loader={() => import('./markdown-view').then(c => c.SyncMarkdownView)} {...props} />;
};

export const ClusterServiceVersionDetails: React.SFC<ClusterServiceVersionDetailsProps> = (props) => {
  const {spec, metadata, status = {} as ClusterServiceVersionKind['status']} = props.obj;
  const ownedCRDs = spec.customresourcedefinitions.owned || [];
  const route = (name: string) => `/k8s/ns/${metadata.namespace}/${ClusterServiceVersionModel.plural}/${metadata.name}/${referenceForCRDDesc(_.find(ownedCRDs, {name}))}/new`;

  return <div className="co-clusterserviceversion-details co-m-pane__body">
    <div className="co-clusterserviceversion-details__section co-clusterserviceversion-details__section--info">
      <div style={{marginBottom: '15px'}}>
        { status.phase !== ClusterServiceVersionPhase.CSVPhaseSucceeded && <button disabled={true} className="btn btn-primary">Create New</button> }
        { status.phase === ClusterServiceVersionPhase.CSVPhaseSucceeded && ownedCRDs.length > 1 && <Dropdown
          buttonClassName="btn-primary"
          title="Create New"
          items={ownedCRDs.reduce((acc, crd) => ({...acc, [crd.name]: crd.displayName}), {})}
          onChange={(name) => history.push(route(name))} /> }
        { status.phase === ClusterServiceVersionPhase.CSVPhaseSucceeded && ownedCRDs.length === 1 && <Link to={route(ownedCRDs[0].name)} className="btn btn-primary">{`Create ${ownedCRDs[0].displayName}`}</Link> }
      </div>
      <dl className="co-clusterserviceversion-details__section--info__item">
        <dt>Provider</dt>
        <dd>{spec.provider && spec.provider.name ? spec.provider.name : 'Not available'}</dd>
        <dt>Created At</dt>
        <dd><Timestamp timestamp={metadata.creationTimestamp} /></dd>
      </dl>
      <dl className="co-clusterserviceversion-details__section--info__item">
        <dt>Links</dt>
        { spec.links && spec.links.length > 0
          ? spec.links.map((link, i) => <dd key={i} style={{display: 'flex', flexDirection: 'column'}}>
            {link.name} <OverflowLink value={link.url} href={link.url} />
          </dd>)
          : <dd>Not available</dd> }
      </dl>
      <dl className="co-clusterserviceversion-details__section--info__item">
        <dt>Maintainers</dt>
        { spec.maintainers && spec.maintainers.length > 0
          ? spec.maintainers.map((maintainer, i) => <dd key={i} style={{display: 'flex', flexDirection: 'column'}}>
            {maintainer.name} <OverflowLink value={maintainer.email} href={`mailto:${maintainer.email}`} />
          </dd>)
          : <dd>Not available</dd> }
      </dl>
    </div>
    <div className="co-clusterserviceversion-details__section co-clusterserviceversion-details__section--description">
      { status.phase !== ClusterServiceVersionPhase.CSVPhaseSucceeded && <div className="co-clusterserviceversion-detail__error-box">
        <strong>{status.phase}</strong>: {status.message}
      </div> }
      <h1>Description</h1>
      <MarkdownView content={spec.description || 'Not available'} />
    </div>
  </div>;
};

export const ClusterServiceVersionsDetailsPage: React.StatelessComponent<ClusterServiceVersionsDetailsPageProps> = (props) => {
  const Instances: React.SFC<{obj: ClusterServiceVersionKind}> = ({obj}) => <ClusterServiceVersionResourcesPage obj={obj} />;
  Instances.displayName = 'Instances';

  return <DetailsPage
    {...props}
    namespace={props.match.params.ns}
    kind={referenceForModel(ClusterServiceVersionModel)}
    name={props.match.params.name}
    pages={[
      navFactory.details(ClusterServiceVersionDetails),
      navFactory.editYaml(),
      {href: 'instances', name: 'Instances', component: Instances}
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
ClusterServiceVersionsDetailsPage.displayName = 'ClusterServiceVersionsDetailsPage';
ClusterServiceVersionRow.displayName = 'ClusterServiceVersionRow';
ClusterServiceVersionHeader.displayName = 'ClusterServiceVersionHeader';
