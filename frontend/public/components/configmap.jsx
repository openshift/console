import React from 'react';
import moment from 'moment';

import {DetailsPage, ListPage, makeList} from './factory';
import ConfigMapAndSecretData from './configmap-and-secret-data';
import {Cog, navFactory, ResourceCog, ResourceLink, ResourceSummary} from './utils';

const menuActions = Cog.factory.common;

const ConfigMapHeader = () => <div className="row co-m-table-grid__head">
  <div className="col-xs-4">Config Map Name</div>
  <div className="col-xs-4">Config Map Data</div>
  <div className="col-xs-4">Config Map Age</div>
</div>;

const ConfigMapRow = ({obj: configMap}) => {
  const data = Object.keys(configMap.data || {}).length;
  const age = moment(configMap.metadata.creationTimestamp).fromNow();

  return <div className="row co-resource-list__item">
    <div className="col-xs-4">
      <ResourceCog actions={menuActions} kind="configmap" resource={configMap} />
      <ResourceLink kind="configmap" name={configMap.metadata.name} namespace={configMap.metadata.namespace} title={configMap.metadata.uid} />
    </div>
    <div className="col-xs-4">{data}</div>
    <div className="col-xs-4">{age}</div>
  </div>;
};

const ConfigMapDetails = (configMap) => {
  return <div className="row">
    <div className="col-md-12">
      <div className="co-m-pane">
        <div className="co-m-pane__body">
          <ResourceSummary resource={configMap} showPodSelector={false} showNodeSelector={false} />
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

const pages = [navFactory.details(ConfigMapDetails), navFactory.editYaml()];

const ConfigMaps = makeList('ConfigMaps', 'configmap', ConfigMapHeader, ConfigMapRow);
const ConfigMapsPage = props => <ListPage ListComponent={ConfigMaps} {...props} />;
const ConfigMapsDetailsPage = props => <DetailsPage pages={pages} menuActions={menuActions} {...props} />;

export {ConfigMaps, ConfigMapsPage, ConfigMapsDetailsPage};
