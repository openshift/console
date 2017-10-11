/* eslint-disable no-undef */

import * as React from 'react';
import { Link } from 'react-router-dom';
import * as Immutable from 'immutable';
import * as _ from 'lodash';

import { AppTypeKind, AppTypeLogo } from './index';
import { AppTypeResourcesPage } from './apptype-resource';
import { DetailsPage, ListPage, List, ListHeader, ColHead } from '../factory';
import { navFactory, FirehoseHoC, StatusBox, Timestamp, ResourceLink, Overflow } from '../utils';

const localCatalogName = 'local';

export const AppTypeListItem = (props: AppTypeListItemProps) => {
  const {appType} = props;
  const route = `/ns/${appType.metadata.namespace}/clusterserviceversion-v1s/${appType.metadata.name}`;

  return <div className="co-apptype-list-item">
    <div className="co-apptype-list-item__heading">
      <div className="co-apptype-list-item__heading__logo">
        <AppTypeLogo icon={_.get(appType, 'spec.icon', [])[0]} displayName={appType.spec.displayName} provider={appType.spec.provider} />
      </div>
    </div>
    <div className="co-apptype-list-item__actions">
      <Link to={`${route}/details`} title="View details" className="btn btn-default">View details</Link>
      <Link to={`${route}/resources`} title="View resources">View resources</Link>
    </div>
  </div>;
};

export const AppTypeHeader = () => <ListHeader>
  <ColHead className="col-xs-8">Name</ColHead>
  <ColHead className="col-xs-4">Actions</ColHead>
</ListHeader>;

export const AppTypeRow = ({obj: appType}) => {
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

const filterAppTypes = (data: AppTypeKind[] = [], filters = {}) => {
  return Object.keys(filters).reduce((filteredData, filterName) => {
    switch (filterName) {
      case 'name':
        return filteredData.filter((appType) => appType.spec.displayName.toLowerCase().includes(filters[filterName]));
      default:
        return filteredData;
    }
  }, data);
};

const appsByCatalog = (appTypes: AppTypeKind[]) => {
  return appTypes.reduce((acc, appType) => {
    const catalogName: string = appType.spec.labels['alm-catalog'];

    if (catalogName) {
      return acc.update(catalogName, (apps = []) => apps.concat([appType]));
    }

    return acc.update(localCatalogName, (apps = []) => apps.concat([appType]));
  }, Immutable.Map<string, AppTypeKind[]>());
};

export const AppTypeList = (props: AppTypeListProps) => {
  const {filters} = props;
  const data = filterAppTypes(props.data, filters);
  const apps = appsByCatalog(data);

  return props.loaded && data.length > 0
    ? <div className="co-apptype-list">
      { apps.filter((_, key) => key !== localCatalogName).map((appsForCatalog, key) => <div className="co-apptype-list__section co-apptype-list__section--catalog" key={key}>
        <div>
          <h1 className="co-section-title">{key}</h1>
        </div>
        <div className="co-apptype-list__section--catalog__items">
          { appsForCatalog.map((appType, i) => <div className="co-apptype-list__section--catalog__items__item" key={i}>
            <AppTypeListItem appType={appType} />
          </div>) }
        </div>
      </div>) }
      <div className="co-apptype-list__section">
        <div className="co-section-title">
          <h1>Local Applications</h1>
        </div>
        <List {...props} label="Local Applications" data={apps.get(localCatalogName)} Header={AppTypeHeader} Row={AppTypeRow} />
      </div>
    </div>
    : <StatusBox label="Applications" loaded={props.loaded} />;
};

export const AppTypesPage = (props: AppTypesPageProps) => (
  <ListPage {...props} ListComponent={AppTypeList} filterLabel="Applications by name" title="Installed Applications" showTitle={true} />
);

export const AppTypeDetails = (props: AppTypeDetailsProps) => {
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

export const AppTypesDetailsPage = (props: AppTypesDetailsPageProps) => <DetailsPage {...props} pages={pages} />;

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
};

export type AppTypesDetailsPageProps = {
  kind: string;
  name: string;
  namespace: string;
};

export type AppTypeDetailsProps = {
  obj: AppTypeKind;
};
