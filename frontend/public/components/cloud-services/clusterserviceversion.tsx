import * as React from 'react';
import { Link, match as RouterMatch } from 'react-router-dom';
import * as _ from 'lodash';
import { Map as ImmutableMap } from 'immutable';
import { connect } from 'react-redux';

import { ClusterServiceVersionKind, ClusterServiceVersionLogo, CRDDescription, ClusterServiceVersionPhase } from './index';
import { ClusterServiceVersionResourcesPage } from './clusterserviceversion-resource';
import { DetailsPage, ListHeader, ColHead, MultiListPage } from '../factory';
import { navFactory, StatusBox, Timestamp, ResourceLink, OverflowLink, Dropdown, history, MsgBox, makeReduxID, makeQuery, Box } from '../utils';
import { K8sResourceKind, referenceForModel, K8sFullyQualifiedResourceReference, referenceFor } from '../../module/k8s';
import { ClusterServiceVersionModel } from '../../models';
import { AsyncComponent } from '../utils/async';

import * as appsLogo from '../../imgs/apps-logo.svg';

export const ClusterServiceVersionListItem: React.SFC<ClusterServiceVersionListItemProps> = (props) => {
  const {obj, namespaces = []} = props;
  const route = (namespace) => `/ns/${namespace}/clusterserviceversion-v1s/${obj.metadata.name}`;

  return <div className="co-clusterserviceversion-list-item">
    <div style={{cursor: namespaces.length === 1 ? 'pointer' : ''}} onClick={() => namespaces.length === 1 ? history.push(route(obj.metadata.namespace)) : null}>
      <ClusterServiceVersionLogo icon={_.get(obj, 'spec.icon', [])[0]} displayName={obj.spec.displayName} version={obj.spec.version} provider={obj.spec.provider} />
    </div>
    <div className="co-clusterserviceversion-list-item__description">{_.get(obj.spec, 'description', 'No description available')}</div>
    <div className="co-clusterserviceversion-list-item__actions">
      { namespaces.length > 1
        ? <Dropdown
          title="View namespace"
          items={namespaces.reduce((acc, ns) => ({...acc, [ns]: ns}), {})}
          onChange={(ns) => history.push(`${route(ns)}`)} />
        : <Link to={`${route(obj.metadata.namespace)}`} title="View details" className="btn btn-default">View details</Link> }
      { namespaces.length === 1 && <Link to={`${route(obj.metadata.namespace)}/instances`} title="View instances">View instances</Link> }
    </div>
  </div>;
};

export const ClusterServiceVersionHeader: React.SFC = () => <ListHeader>
  <ColHead className="col-xs-8">Name</ColHead>
  <ColHead className="col-xs-4">Actions</ColHead>
</ListHeader>;

export const ClusterServiceVersionRow: React.SFC<ClusterServiceVersionRowProps> = ({obj}) => {
  const route = `/ns/${obj.metadata.namespace}/clusterserviceversion-v1s/${obj.metadata.name}`;

  return <div className="row co-resource-list__item">
    <div className="col-xs-8">
      <ResourceLink kind={obj.kind} namespace={obj.metadata.namespace} title={obj.metadata.name} name={obj.metadata.name} />
    </div>
    <div className="col-xs-4">
      <Link to={`${route}`} title="View details" className="btn btn-default">View details</Link>
      <Link to={`${route}/instances`} title="View instances">View instances</Link>
    </div>
  </div>;
};

export const ClusterServiceVersionList: React.SFC<ClusterServiceVersionListProps> = (props) => {
  const {loaded, loadError, filters} = props;
  const EmptyMsg = () => <MsgBox title="No Applications Found" detail="Applications are installed per namespace from the Open Cloud Catalog." />;
  const clusterServiceVersions = (props.data.filter(res => referenceFor(res) === referenceForModel(ClusterServiceVersionModel)) as ClusterServiceVersionKind[])
    .filter(csv => csv.status && csv.status.phase === ClusterServiceVersionPhase.CSVPhaseSucceeded);

  const apps = Object.keys(filters).reduce((filteredData, filterName) => {
    // TODO(alecmerdler): Make these cases into TypeScript `enum` values
    switch (filterName) {
      case 'name':
        return filteredData.filter((csv) => csv.spec.displayName.toLowerCase().includes(filters[filterName].toLowerCase()));
      case 'clusterserviceversion-status':
        if (filters[filterName] === 'running') {
          return filteredData.filter(({metadata, spec}) => spec.customresourcedefinitions.owned.some(({kind}) => props.data.some(res => res.kind === kind && res.metadata.namespace === metadata.namespace)));
        } else if (filters[filterName] === 'notRunning') {
          return filteredData.filter(({metadata, spec}) => !spec.customresourcedefinitions.owned.some(({kind}) => props.data.some(res => res.kind === kind && res.metadata.namespace === metadata.namespace)));
        }
        return filteredData;
      case 'clusterserviceversion-catalog':
        return filteredData.filter((csv) => filters[filterName] === 'all' || csv.spec.labels['alm-catalog'] === filters[filterName]);
      default:
        return filteredData;
    }
  }, clusterServiceVersions);

  const namespacesForApp = (name) => apps.filter(({metadata}) => metadata.name === name).map(({metadata}) => metadata.namespace);
  const hasDeployment = (csvUID: string) => props.data.some(obj => _.get(obj.metadata, 'ownerReferences', []).some(({uid}) => uid === csvUID));

  return <div>{ apps.length > 0
    ? <div className="co-clusterserviceversion-list">
      <div className="co-clusterserviceversion-list__section co-clusterserviceversion-list__section--catalog">
        <h1 className="co-section-title">Open Cloud Services</h1>
        <div className="co-clusterserviceversion-list__section--catalog__items">
          { apps.filter(({metadata}, i, allCSVs) => i === _.findIndex(allCSVs, (csv => csv.metadata.name === metadata.name)))
            .filter((csv) => hasDeployment(csv.metadata.uid))
            .map((csv, i) => <div className="co-clusterserviceversion-list__section--catalog__items__item" key={i}>
              <ClusterServiceVersionListItem obj={csv} namespaces={namespacesForApp(csv.metadata.name)} />
            </div>) }
        </div>
      </div>
    </div>
    : <StatusBox label="Applications" loaded={loaded} loadError={loadError} EmptyMsg={EmptyMsg} /> }
  </div>;
};

const stateToProps = ({k8s}, {match, namespace}) => ({
  resourceDescriptions: _.values(k8s.getIn([makeReduxID(ClusterServiceVersionModel, makeQuery(match.params.ns)), 'data'], ImmutableMap()).toJS())
    .map((csv: ClusterServiceVersionKind) => _.get(csv.spec.customresourcedefinitions, 'owned', []))
    .reduce((descriptions, crdDesc) => descriptions.concat(crdDesc), [])
    .filter((crdDesc, i, allDescriptions) => i === _.findIndex(allDescriptions, ({name}) => name === crdDesc.name)),
  namespaceEnabled: _.values<K8sResourceKind>(k8s.getIn(['namespaces', 'data'], ImmutableMap()).toJS())
    .filter((ns) => ns.metadata.name === namespace && _.get(ns, ['metadata', 'annotations', 'alm-manager']))
    .length === 1,
});

export const ClusterServiceVersionsPage = connect(stateToProps)(
  class ClusterServiceVersionsPage extends React.Component<ClusterServiceVersionsPageProps, ClusterServiceVersionsPageState> {
    constructor(props) {
      super(props);
      this.state = {resourceDescriptions: []};
    }

    render() {
      const flatten = (resources: {[kind: string]: {data: K8sResourceKind[]}}) => _.flatMap(resources, (resource) => _.map(resource.data, item => item));
      const dropdownFilters = [{
        type: 'clusterserviceversion-status',
        items: {
          all: 'Status: All',
          running: 'Status: Running',
          notRunning: 'Status: Not Running',
        },
        title: 'Running Status',
      }, {
        type: 'clusterserviceversion-catalog',
        items: {
          all: 'Catalog: All',
        },
        title: 'Catalog',
      }];
      const resources = [
        {kind: referenceForModel(ClusterServiceVersionModel), namespaced: true, prop: 'ClusterServiceVersion-v1'},
        {kind: 'Deployment', namespaced: true, isList: true, prop: 'Deployment'},
      ].concat(this.state.resourceDescriptions.map(crdDesc => ({
        kind: `${crdDesc.kind}:${crdDesc.name.slice(crdDesc.name.indexOf('.') + 1)}:${crdDesc.version}` as K8sFullyQualifiedResourceReference,
        namespaced: true,
        optional: true,
        prop: crdDesc.kind,
      })));

      return this.props.namespace && !this.props.namespaceEnabled
        ? <Box className="cos-text-center">
          <img className="co-clusterserviceversion-list__disabled-icon" src={appsLogo} />
          <MsgBox title="Open Cloud Services not enabled for this namespace" detail="Please contact a system administrator and ask them to enable OCS to continue." />
        </Box>
        : <MultiListPage
          {...this.props}
          resources={resources}
          flatten={flatten}
          dropdownFilters={dropdownFilters}
          ListComponent={ClusterServiceVersionList}
          filterLabel="Applications by name"
          title="Available Applications"
          showTitle={true} />;
    }

    componentWillReceiveProps(nextProps) {
      if (this.state.resourceDescriptions.length === 0 && nextProps.resourceDescriptions.length > 0) {
        this.setState({resourceDescriptions: nextProps.resourceDescriptions});
      }
    }

    shouldComponentUpdate(nextProps) {
      return !_.isEqual(_.omit(nextProps, ['resourceDescriptions']), _.omit(this.props, ['resourceDescriptions']))
        || nextProps.resourceDescriptions.length > 0 && this.state.resourceDescriptions.length === 0;
    }
  });

export const MarkdownView = (props: {content: string}) => {
  return <AsyncComponent loader={() => import('./markdown-view').then(c => c.SyncMarkdownView)} {...props} />;
};

export const ClusterServiceVersionDetails: React.SFC<ClusterServiceVersionDetailsProps> = (props) => {
  const {spec, metadata} = props.obj;
  const route = (name: string) => `/ns/${metadata.namespace}/clusterserviceversion-v1s/${metadata.name}/${name.split('.')[0]}/new`;

  return <div className="co-clusterserviceversion-details co-m-pane__body">
    <div className="co-clusterserviceversion-details__section co-clusterserviceversion-details__section--info">
      <div style={{marginBottom: '15px'}}>
        { spec.customresourcedefinitions.owned.length > 1
          ? <Dropdown
            noButton={true}
            className="btn btn-primary"
            title="Create New"
            items={spec.customresourcedefinitions.owned.reduce((acc, crd) => ({...acc, [crd.name]: crd.displayName}), {})}
            onChange={(name) => history.push(route(name))} />
          : <Link to={route(spec.customresourcedefinitions.owned[0].name)} className="btn btn-primary">{`Create ${spec.customresourcedefinitions.owned[0].displayName}`}</Link> }
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
      <h1>Description</h1>
      <MarkdownView content={spec.description || 'Not available'} />
    </div>
  </div>;
};

export const ClusterServiceVersionsDetailsPage: React.SFC<ClusterServiceVersionsDetailsPageProps> = (props) => {
  const Instances: React.SFC<{obj: ClusterServiceVersionKind}> = ({obj}) => <div>
    <ClusterServiceVersionResourcesPage obj={obj} />
  </div>;
  Instances.displayName = 'Instances';

  return <DetailsPage
    {...props}
    pages={[navFactory.details(ClusterServiceVersionDetails), {href: 'instances', name: 'Instances', component: Instances}]}
    menuActions={[() => ({label: 'Edit Application Definition...', href: `/ns/${props.namespace}/clusterserviceversion-v1s/${props.name}/edit`})]} />;
};

/* eslint-disable no-undef */
export type ClusterServiceVersionsPageProps = {
  kind: string;
  namespace: string;
  namespaceEnabled: boolean;
  match: RouterMatch<any>;
  resourceDescriptions: CRDDescription[];
};

export type ClusterServiceVersionsPageState = {
  resourceDescriptions: CRDDescription[];
};

export type ClusterServiceVersionListProps = {
  loaded: boolean;
  loadError?: string;
  data: (ClusterServiceVersionKind | K8sResourceKind)[];
  filters: {[key: string]: any};
};

export type ClusterServiceVersionListItemProps = {
  obj: ClusterServiceVersionKind;
  namespaces: string[];
};

export type ClusterServiceVersionsDetailsPageProps = {
  kind: string;
  name: string;
  namespace: string;
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
ClusterServiceVersionListItem.displayName = 'ClusterServiceVersionListItem';
ClusterServiceVersionsPage.displayName = 'ClusterServiceVersionsPage';
ClusterServiceVersionsDetailsPage.displayName = 'ClusterServiceVersionsDetailsPage';
ClusterServiceVersionRow.displayName = 'ClusterServiceVersionRow';
ClusterServiceVersionHeader.displayName = 'ClusterServiceVersionHeader';
