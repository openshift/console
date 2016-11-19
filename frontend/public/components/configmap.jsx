import React from 'react';

import {angulars} from './react-wrapper';
import {makeDetailsPage, makeListPage, makeList} from './factory';
import ConfigMapAndSecretData from './configmap-and-secret-data';
import {Cog, LabelList, ResourceIcon, Timestamp} from './utils';

const ConfigMapCog = ({configMap}) => {
  const kind = angulars.kinds.CONFIGMAP;
  const {factory: {ModifyLabels, Delete}} = Cog;
  return <Cog options={[ModifyLabels, Delete].map(f => f(kind, configMap))} size="small" anchor="left" />;
};

const ConfigMapHeader = () => <div className="row co-m-table-grid__head">
  <div className="col-md-4">Config Map Name</div>
  <div className="col-md-4">Config Map Data</div>
  <div className="col-md-4">Config Map Age</div>
</div>;

const ConfigMapRow = ({obj: configMap}) => {
  const data = Object.keys(configMap.data || {}).length;
  const age = moment(configMap.metadata.creationTimestamp).fromNow();

  return <div className="row co-resource-list__item">
    <div className="col-md-4">
      <ConfigMapCog configMap={configMap} />
      <ResourceIcon kind="configmap" />
      <a href={`ns/${configMap.metadata.namespace}/configmaps/${configMap.metadata.name}/details`} title={configMap.metadata.uid}>{configMap.metadata.name}</a>
    </div>
    <div className="col-md-4">{data}</div>
    <div className="col-md-4">{age}</div>
  </div>;
};

const ConfigMapDetails = (configMap) => {
  return <div className="row">
    <div className="col-md-12">
      <div className="co-m-pane">
        <div className="co-m-pane__body">
          <dl>
            <dt>Name</dt>
            <dd>{configMap.metadata.name}</dd>
            <dt>Labels</dt>
            <dd><LabelList kind="configmap" labels={configMap.metadata.labels} /></dd>
            <dt>Created At</dt>
            <dd><Timestamp timestamp={configMap.metadata.creationTimestamp} /></dd>
          </dl>
        </div>

        <div></div>

        <div className="co-m-pane__heading">
          <h1 className="co-m-pane__title">Data</h1>
        </div>
        <div className="co-m-pane__body">
          <ConfigMapAndSecretData data={configMap.data} />
        </div>
      </div>
    </div>
  </div>;
};

const pages = [{href: 'details', name: 'Overview', component: ConfigMapDetails}];

const ConfigMaps = makeList('ConfigMaps', 'CONFIGMAP', ConfigMapHeader, ConfigMapRow);
const ConfigMapsPage = makeListPage('ConfigMapsPage', 'CONFIGMAP', ConfigMaps);
const ConfigMapsDetailsPage = makeDetailsPage('ConfigMapsDetailsPage', 'CONFIGMAP', pages);

export {ConfigMaps, ConfigMapsPage, ConfigMapsDetailsPage};
