/* eslint-disable no-undef, no-unused-vars */

import * as React from 'react';
import { Link } from 'react-router-dom';
import * as _ from 'lodash';
import { Map as ImmutableMap } from 'immutable';
import { connect } from 'react-redux';

import { ClusterServiceVersionKind, ClusterServiceVersionLogo, CustomResourceDefinitionKind, ClusterServiceVersionResourceKind } from './index';
import { ClusterServiceVersionResourcesPage } from './clusterserviceversion-resource';
import { DetailsPage, ListPage, ListHeader, ColHead } from '../factory';
import { navFactory, Firehose, StatusBox, Timestamp, ResourceLink, Overflow, Dropdown, history, MsgBox } from '../utils';

export const ClusterServiceVersionListItem: React.StatelessComponent<ClusterServiceVersionListItemProps> = (props) => {
  const {appType, namespaces = []} = props;
  const route = (name, namespace) => `/ns/${namespace}/clusterserviceversion-v1s/${name}`;

  return <div className="co-clusterserviceversion-list-item">
    <div className="co-clusterserviceversion-list-item__heading">
      <div className="co-clusterserviceversion-list-item__heading__logo">
        <ClusterServiceVersionLogo icon={_.get(appType, 'spec.icon', [])[0]} displayName={appType.spec.displayName} version={appType.spec.version} provider={appType.spec.provider} />
      </div>
    </div>
    <div className="co-clusterserviceversion-list-item__description">{_.get(appType.spec, 'description', 'No description available')}</div>
    <div className="co-clusterserviceversion-list-item__actions">
      { namespaces.length > 1
        ? <Dropdown
          title="View namespace"
          items={namespaces.reduce((acc, ns) => ({...acc, [ns]: ns}), {})}
          onChange={(ns) => history.push(`${route(appType.metadata.name, ns)}/details`)} />
        : <Link to={`${route(appType.metadata.name, appType.metadata.namespace)}/details`} title="View details" className="btn btn-default">View details</Link> }
      { namespaces.length === 1 && <Link to={`${route(appType.metadata.name, appType.metadata.namespace)}/resources`} title="View resources">View resources</Link> }
    </div>
  </div>;
};

export const ClusterServiceVersionHeader: React.StatelessComponent = () => <ListHeader>
  <ColHead className="col-xs-8">Name</ColHead>
  <ColHead className="col-xs-4">Actions</ColHead>
</ListHeader>;

export const ClusterServiceVersionRow: React.StatelessComponent<ClusterServiceVersionRowProps> = ({obj: appType}) => {
  const route = `/ns/${appType.metadata.namespace}/clusterserviceversion-v1s/${appType.metadata.name}`;

  return <div className="row co-resource-list__item">
    <div className="col-xs-8">
      <ResourceLink kind={appType.kind} namespace={appType.metadata.namespace} title={appType.metadata.name} name={appType.metadata.name} />
    </div>
    <div className="col-xs-4">
      <Link to={`${route}/details`} title="View details" className="btn btn-default">View details</Link>
      <Link to={`${route}/resources`} title="View resources">View resources</Link>
    </div>
  </div>;
};

const stateToProps = ({k8s}, {data}) => {
  const appCRDs = _.values<CustomResourceDefinitionKind>(k8s.getIn(['customresourcedefinitions', 'data'], ImmutableMap()).toJS())
    .filter((crd: CustomResourceDefinitionKind) => {
      const owned = data.reduce((names, csv) => names.concat(csv.spec.customresourcedefinitions.owned.map(crd => crd.name)), []);
      return owned.indexOf(crd.metadata.name) > -1;
    });

  const appCRs = appCRDs.map(crd => ({name: crd.metadata.name, data: _.values<any>(k8s.getIn([crd.metadata.name.split('.')[0], 'data'], ImmutableMap()).toJS())}))
    .reduce((allCRs, resource) => allCRs.set(resource.name, resource.data), new Map<string, ClusterServiceVersionResourceKind[]>());

  return {appCRDs, appCRs};
};

export const ClusterServiceVersionList = connect(stateToProps)((props: ClusterServiceVersionListProps) => {
  const {loaded, loadError, filters, appCRs} = props;

  const apps = Object.keys(filters).reduce((filteredData, filterName) => {
    // FIXME(alecmerdler): Make these cases into TypeScript `enum` values
    switch (filterName) {
      case 'name':
        return filteredData.filter((appType) => appType.spec.displayName.toLowerCase().includes(filters[filterName].toLowerCase()));
      case 'clusterserviceversion-status':
        if (filters[filterName] === 'running') {
          return filteredData.filter(({spec}) => spec.customresourcedefinitions.owned.map(({name}) => (appCRs.get(name) || []).length > 0).reduce((running, cur) => running || cur, false));
        } else if (filters[filterName] === 'notRunning') {
          return filteredData.filter(({spec}) => {
            const owned = spec.customresourcedefinitions.owned.map(({name}) => (appCRs.get(name) || []).length === 0);
            return owned.reduce((notRunning, cur) => notRunning && cur, true);
          });
        }
        return filteredData;
      case 'clusterserviceversion-catalog':
        return filteredData.filter((appType) => filters[filterName] === 'all' || appType.spec.labels['alm-catalog'] === filters[filterName]);
      default:
        return filteredData;
    }
  }, props.data || []);

  const namespacesForApp = apps.reduce((namespaces, app) => {
    return namespaces.set(app.metadata.name, (namespaces.get(app.metadata.name) || []).concat([app.metadata.namespace]));
  }, new Map<string, string[]>());

  const EmptyMsg = () => <MsgBox title="No Applications Found" detail="Applications are installed per namespace from the Open Cloud Catalog." />;

  return <div>
    {/* Retrieve list of instances for each app resource to determine if app is running */}
    { props.appCRDs.map((crd, i) => <Firehose kind={crd.spec.names.kind} isList={true} key={i} />) }
    { loaded && apps.length > 0
      ? <div className="co-clusterserviceversion-list">
        <div className="co-clusterserviceversion-list__section co-clusterserviceversion-list__section--catalog">
          <h1 className="co-section-title">Open Cloud Services</h1>
          <div className="co-clusterserviceversion-list__section--catalog__items">
            { apps.reduce((visibleApps: ClusterServiceVersionKind[], app) => {
              return (visibleApps.find(csv => csv.metadata.name === app.metadata.name) === undefined) ? visibleApps.concat([app]) : visibleApps;
            }, []).map((appType, i) => <div className="co-clusterserviceversion-list__section--catalog__items__item" key={i}>
              <ClusterServiceVersionListItem appType={appType} namespaces={namespacesForApp.get(appType.metadata.name)} />
            </div>) }
          </div>
        </div>
      </div>
      : <StatusBox label="Applications" loaded={loaded} loadError={loadError} EmptyMsg={EmptyMsg} /> }
  </div>;
});

export const ClusterServiceVersionsPage: React.StatelessComponent<ClusterServiceVersionsPageProps> = (props) => {
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

  return <div>
    <Firehose kind="CustomResourceDefinition" isList={true} />
    <ListPage {...props} dropdownFilters={dropdownFilters} ListComponent={ClusterServiceVersionList} filterLabel="Applications by name" title="Installed Applications" showTitle={true} />
  </div>;
};

export const ClusterServiceVersionDetails: React.StatelessComponent<ClusterServiceVersionDetailsProps> = (props) => {
  const {spec, metadata} = props.obj;
  const createLink = (name: string) => `/ns/${metadata.namespace}/clusterserviceversion-v1s/${metadata.name}/${name.split('.')[0]}/new`;

  return <div className="co-clusterserviceversion-details co-m-pane__body">
    <div className="co-clusterserviceversion-details__section co-clusterserviceversion-details__section--info">
      <div style={{marginBottom: '15px'}}>
        { spec.customresourcedefinitions.owned.length > 1
          ? <Dropdown
            noButton={true}
            className="btn btn-primary"
            title="Create New"
            items={spec.customresourcedefinitions.owned.reduce((acc, crd) => ({...acc, [crd.name]: crd.displayName}), {})}
            onChange={(name) => history.push(createLink(name))} />
          : <Link to={createLink(spec.customresourcedefinitions.owned[0].name)} className="btn btn-primary">{`Create ${spec.customresourcedefinitions.owned[0].displayName}`}</Link> }
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
            {link.name} <a href={link.url}>{link.url}</a>
          </dd>)
          : <dd>Not available</dd> }
      </dl>
      <dl className="co-clusterserviceversion-details__section--info__item">
        <dt>Maintainers</dt>
        { spec.maintainers && spec.maintainers.length > 0
          ? spec.maintainers.map((maintainer, i) => <dd key={i} style={{display: 'flex', flexDirection: 'column'}}>
            {maintainer.name} <a href={`mailto:${maintainer.email}`}><Overflow value={maintainer.email} /></a>
          </dd>)
          : <dd>Not available</dd> }
      </dl>
    </div>
    <div className="co-clusterserviceversion-details__section co-clusterserviceversion-details__section--description">
      <h1>Description</h1>
      <span style={{color: spec.description ? '' : '#999'}}>
        {spec.description || 'Not available'}
      </span>
    </div>
  </div>;
};

export const ClusterServiceVersionsDetailsPage: React.StatelessComponent<ClusterServiceVersionsDetailsPageProps> = (props) => {
  const {details, editYaml} = navFactory;

  const Resources = ({obj}) => <div>
    <Firehose kind="CustomResourceDefinition" isList={true} />
    <ClusterServiceVersionResourcesPage loaded={true} obj={obj} />
  </div>;

  return <DetailsPage {...props} pages={[details(ClusterServiceVersionDetails), editYaml(), {href: 'resources', name: 'Resources', component: Resources}]} />;
};

export type ClusterServiceVersionsPageProps = {
  kind: string;
};

export type ClusterServiceVersionListProps = {
  loaded: boolean;
  loadError?: string;
  data: ClusterServiceVersionKind[];
  filters: {[key: string]: any};
  appCRDs: CustomResourceDefinitionKind[];
  appCRs: Map<string, ClusterServiceVersionResourceKind[]>;
};

export type ClusterServiceVersionListItemProps = {
  appType: ClusterServiceVersionKind;
  namespaces: string[];
};

export type ClusterServiceVersionsDetailsPageProps = {
  kind: string;
  name: string;
  namespace: string;
};

export type ClusterServiceVersionDetailsProps = {
  obj: ClusterServiceVersionKind;
};

export type ClusterServiceVersionRowProps = {
  obj: ClusterServiceVersionKind;
};

// TODO(alecmerdler): Find Webpack loader/plugin to add `displayName` to React components automagically
ClusterServiceVersionList.displayName = 'ClusterServiceVersionList';
ClusterServiceVersionListItem.displayName = 'ClusterServiceVersionListItem';
ClusterServiceVersionsPage.displayName = 'ClusterServiceVersionsPage';
ClusterServiceVersionsDetailsPage.displayName = 'ClusterServiceVersionsDetailsPage';
ClusterServiceVersionRow.displayName = 'ClusterServiceVersionRow';
ClusterServiceVersionHeader.displayName = 'ClusterServiceVersionHeader';
