/* eslint-disable no-undef */

import * as React from 'react';
import { Link } from 'react-router-dom';
import * as _ from 'lodash';

import { AppTypeKind, AppTypeLogo } from './index';
import { AppTypeResourcesPage } from './apptype-resource';
import { DetailsPage, ListPage, ListHeader, ColHead } from '../factory';
import { navFactory, FirehoseHoC, StatusBox, Timestamp, ResourceLink, Overflow, Dropdown, history } from '../utils';

export const AppTypeListItem: React.StatelessComponent<AppTypeListItemProps> = (props) => {
  const {appType, namespaces = []} = props;
  const route = (name, namespace) => `/ns/${namespace}/clusterserviceversion-v1s/${name}`;

  return <div className="co-apptype-list-item">
    <div className="co-apptype-list-item__heading">
      <div className="co-apptype-list-item__heading__logo">
        <AppTypeLogo icon={_.get(appType, 'spec.icon', [])[0]} displayName={appType.spec.displayName} provider={appType.spec.provider} />
      </div>
    </div>
    <div className="co-apptype-list-item__actions">
      { namespaces.length > 1
        ? <Dropdown
          title="View namespace"
          items={namespaces.reduce((acc, ns) => ({...acc, [ns]: ns}), {})} onChange={(ns) => history.push(`${route(appType.metadata.name, ns)}/details`)} />
        : <Link to={`${route(appType.metadata.name, appType.metadata.namespace)}/details`} title="View details" className="btn btn-default">View details</Link> }
      { namespaces.length === 1 && <Link to={`${route(appType.metadata.name, appType.metadata.namespace)}/resources`} title="View resources">View resources</Link> }
    </div>
  </div>;
};

export const AppTypeHeader: React.StatelessComponent = () => <ListHeader>
  <ColHead className="col-xs-8">Name</ColHead>
  <ColHead className="col-xs-4">Actions</ColHead>
</ListHeader>;

export const AppTypeRow: React.StatelessComponent<AppTypeRowProps> = ({obj: appType}) => {
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

export const AppTypeList: React.StatelessComponent<AppTypeListProps> = (props) => {
  const apps = Object.keys(props.filters).reduce((filteredData, filterName) => {
    switch (filterName) {
      case 'name':
        return filteredData.filter((appType) => appType.spec.displayName.toLowerCase().includes(props.filters[filterName].toLowerCase()));
      default:
        return filteredData;
    }
  }, props.data || []);

  const namespacesForApp = apps.reduce((namespaces, app) => {
    return namespaces.set(app.metadata.name, (namespaces.get(app.metadata.name) || []).concat([app.metadata.namespace]));
  }, new Map<string, string[]>());

  return props.loaded && apps.length > 0
    ? <div className="co-apptype-list">
      <div className="co-apptype-list__section co-apptype-list__section--catalog">
        <div>
          <h1 className="co-section-title">Open Cloud Services</h1>
        </div>
        <div className="co-apptype-list__section--catalog__items">
          { apps.reduce((visibleApps: AppTypeKind[], app) => {
            return (visibleApps.find(csv => csv.metadata.name === app.metadata.name) === undefined) ? visibleApps.concat([app]) : visibleApps;
          }, []).map((appType, i) => <div className="co-apptype-list__section--catalog__items__item" key={i}>
            <AppTypeListItem appType={appType} namespaces={namespacesForApp.get(appType.metadata.name)} />
          </div>) }
        </div>
      </div>
    </div>
    : <StatusBox label="Applications" loaded={props.loaded} />;
};

export const AppTypesPage: React.StatelessComponent<AppTypesPageProps> = (props) => (
  <ListPage {...props} ListComponent={AppTypeList} filterLabel="Applications by name" title="Installed Applications" showTitle={true} />
);

export const AppTypeDetails: React.StatelessComponent<AppTypeDetailsProps> = (props) => {
  const {spec, metadata} = props.obj;

  return <div className="co-apptype-details co-m-pane__body">
    <div className="co-apptype-details__section co-apptype-details__section--info">
      <dl className="co-apptype-details__section--info__item">
        <dt>Provider</dt>
        <dd>{spec.provider && spec.provider.name ? spec.provider.name : 'Not available'}</dd>
        <dt>Created At</dt>
        <dd><Timestamp timestamp={metadata.creationTimestamp} /></dd>
      </dl>
      <dl className="co-apptype-details__section--info__item">
        <dt>Links</dt>
        { spec.links && spec.links.length > 0
          ? spec.links.map((link, i) => <dd key={i} style={{display: 'flex', flexDirection: 'column'}}>
            {link.name} <a href={link.url}>{link.url}</a>
          </dd>)
          : <dd>Not available</dd> }
      </dl>
      <dl className="co-apptype-details__section--info__item">
        <dt>Maintainers</dt>
        { spec.maintainers && spec.maintainers.length > 0
          ? spec.maintainers.map((maintainer, i) => <dd key={i} style={{display: 'flex', flexDirection: 'column'}}>
            {maintainer.name} <a href={`mailto:${maintainer.email}`}><Overflow value={maintainer.email} /></a>
          </dd>)
          : <dd>Not available</dd> }
      </dl>
    </div>
    <div className="co-apptype-details__section co-apptype-details__section--description">
      <h1>Description</h1>
      <span style={{color: spec.description ? '' : '#999'}}>
        {spec.description || 'Not available'}
      </span>
    </div>
  </div>;
};

const Resources = ({obj}) => <FirehoseHoC Component={AppTypeResourcesPage} kind="CustomResourceDefinition" selector={obj.spec.selector} isList={true} />;

const pages = [
  navFactory.details(AppTypeDetails),
  navFactory.editYaml(),
  {href: 'resources', name: 'Resources', component: Resources},
];

export const AppTypesDetailsPage: React.StatelessComponent<AppTypesDetailsPageProps> = (props) => <DetailsPage {...props} pages={pages} />;

export type AppTypesPageProps = {
  kind: string;
};

export type AppTypeListProps = {
  loaded: boolean;
  data: AppTypeKind[];
  filters: {[key: string]: any};
};

export type AppTypeListItemProps = {
  appType: AppTypeKind;
  namespaces: string[];
};

export type AppTypesDetailsPageProps = {
  kind: string;
  name: string;
  namespace: string;
};

export type AppTypeDetailsProps = {
  obj: AppTypeKind;
};

export type AppTypeRowProps = {
  obj: AppTypeKind;
};

AppTypeListItem.displayName = 'AppTypeListItem';
AppTypesPage.displayName = 'AppTypesPage';
AppTypeList.displayName = 'AppTypeList';
AppTypesDetailsPage.displayName = 'AppTypesDetailsPage';
AppTypeRow.displayName = 'AppTypeRow';
AppTypeHeader.displayName = 'AppTypeHeader';
