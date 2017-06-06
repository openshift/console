import React from 'react';
import moment from 'moment';

import { ColHead, DetailsPage, List, ListHeader, ListPage } from './factory';
import ConfigMapAndSecretData from './configmap-and-secret-data';
import { Cog, Heading, navFactory, ResourceCog, ResourceLink, ResourceSummary } from './utils';

const menuActions = Cog.factory.common;

const ConfigMapHeader = props => <ListHeader>
  <ColHead {...props} className="col-xs-4" sortField="metadata.name">Config Map Name</ColHead>
  <ColHead {...props} className="col-xs-4" sortFunc="dataSize">Config Map Data</ColHead>
  <ColHead {...props} className="col-xs-4" sortField="metadata.creationTimestamp">Config Map Age</ColHead>
</ListHeader>;

const ConfigMapRow = ({obj: configMap}) => <div className="row co-resource-list__item">
  <div className="col-xs-4">
    <ResourceCog actions={menuActions} kind="configmap" resource={configMap} />
    <ResourceLink kind="configmap" name={configMap.metadata.name} namespace={configMap.metadata.namespace} title={configMap.metadata.uid} />
  </div>
  <div className="col-xs-4">{_.size(configMap.data)}</div>
  <div className="col-xs-4">{moment(configMap.metadata.creationTimestamp).fromNow()}</div>
</div>;

const ConfigMapDetails = (configMap) => {
  return <div className="row">
    <div className="col-md-12">
      <div className="co-m-pane">
        <div className="co-m-pane__body">
          <ResourceSummary resource={configMap} showPodSelector={false} showNodeSelector={false} />
        </div>

        <Heading text="Data" />
        <div className="co-m-pane__body">
          <ConfigMapAndSecretData data={configMap.data} />
        </div>
      </div>
    </div>
  </div>;
};

const pages = [navFactory.details(ConfigMapDetails), navFactory.editYaml()];

const ConfigMaps = props => <List {...props} Header={ConfigMapHeader} Row={ConfigMapRow} />;
const ConfigMapsPage = props => <ListPage ListComponent={ConfigMaps} canCreate={true} {...props} />;
const ConfigMapsDetailsPage = props => <DetailsPage pages={pages} menuActions={menuActions} {...props} />;

export {ConfigMaps, ConfigMapsPage, ConfigMapsDetailsPage};
