/* eslint-disable no-undef */

import * as React from 'react';

import { ListPage } from '../factory';
import { StatusBox } from '../utils';

export const AppTypeLogo = (props: AppTypeLogoProps) => {
  const {icon, displayName, provider} = props;
  
  return <div className="co-apptype-logo">
    <div>
      <img src={`data:${icon.mediatype};base64,${icon.base64data}`} height="40" width="40" />
    </div>
    <div className="co-apptype-logo__name">
      <h1 style={{margin: 0}}>{displayName}</h1>
      <span className="co-apptype-logo__provider">{`by ${provider.name}`}</span>
    </div>
  </div>;
};

export const AppTypeListItem = (props: AppTypeListItemProps) => {
  const {appType} = props;
  const icon = appType.spec.icon ? appType.spec.icon[0] : {};

  return <div className="co-apptype-list-item">
    <div className="co-apptype-list-item__heading">
      <div className="co-apptype-list-item__logo">
        <AppTypeLogo icon={icon} displayName={appType.spec.displayName} provider={appType.spec.provider} />
      </div>
      <div className="co-apptype-list-item__info">
        <dt>Description</dt>
        <dd>{appType.spec.description}</dd>
      </div>
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

export const AppTypeList = (props: AppTypeListProps) => {
  const data = filterAppTypes(props.data, props.filters);

  return props.loaded && data.length > 0 
    ? <div className="co-apptype-list">
      { data.map((appType, i) => <AppTypeListItem key={i} appType={appType} />) } 
    </div> 
    : <StatusBox label="Applications" loaded={props.loaded} />;
};

export const AppTypesPage = (props: AppTypesPageProps) => {
  return <ListPage 
    {...props} 
    ListComponent={AppTypeList} 
    filterLabel="Applications by name" 
    title="Installed Applications"
    showTitle={true}
  />;
};

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
  key: number;
};

export type AppTypeLogoProps = {
  displayName: string;
  icon: {base64data: string; mediatype: string};
  provider: {name: string; website: string}
};

// FIXME(alecmerdler): Update with full AppType schema
export type AppTypeKind = {
  apiVersion: string;
  kind: string;
  metadata: {[key: string]: any};
  spec: {[key: string]: any};
};
