import * as _ from 'lodash-es';
import * as React from 'react';

import { ColHead, DetailsPage, List, ListHeader, ListPage, ResourceRow } from './factory';
import { ConfigMapData } from './configmap-and-secret-data';
import { Cog, Heading, navFactory, ResourceCog, ResourceLink, ResourceSummary } from './utils';
import { registerTemplate } from '../yaml-templates';
import { fromNow } from './utils/datetime';

registerTemplate('v1.ConfigMap', `apiVersion: v1
kind: ConfigMap
metadata:
  name: example
  namespace: default
data:
  example.property.1: hello
  example.property.2: world
  example.property.file: |-
    property.1=value-1
    property.2=value-2
    property.3=value-3`);


const menuActions = Cog.factory.common;

const ConfigMapHeader = props => <ListHeader>
  <ColHead {...props} className="col-sm-4 col-xs-6" sortField="metadata.name">Name</ColHead>
  <ColHead {...props} className="col-sm-4 col-xs-6" sortField="metadata.namespace">Namespace</ColHead>
  <ColHead {...props} className="col-sm-2 hidden-xs" sortFunc="dataSize">Size</ColHead>
  <ColHead {...props} className="col-sm-2 hidden-xs" sortField="metadata.creationTimestamp">Created</ColHead>
</ListHeader>;

const ConfigMapRow = ({obj: configMap}) => <ResourceRow obj={configMap}>
  <div className="col-sm-4 col-xs-6">
    <ResourceCog actions={menuActions} kind="ConfigMap" resource={configMap} />
    <ResourceLink kind="ConfigMap" name={configMap.metadata.name} namespace={configMap.metadata.namespace} title={configMap.metadata.uid} />
  </div>
  <div className="col-sm-4 col-xs-6">
    <ResourceLink kind="Namespace" name={configMap.metadata.namespace} title={configMap.metadata.namespace} />
  </div>
  <div className="col-sm-2 hidden-xs">{_.size(configMap.data)}</div>
  <div className="col-sm-2 hidden-xs">{fromNow(configMap.metadata.creationTimestamp)}</div>
</ResourceRow>;

const ConfigMapDetails = ({obj: configMap}) => {
  return <React.Fragment>
    <div className="co-m-pane__body">
      <ResourceSummary resource={configMap} showPodSelector={false} showNodeSelector={false} />
    </div>
    <div className="co-m-pane__body">
      <Heading text="Data" />
      <ConfigMapData data={configMap.data} />
    </div>
  </React.Fragment>;
};

const ConfigMaps = props => <List {...props} Header={ConfigMapHeader} Row={ConfigMapRow} />;
const ConfigMapsPage = props => <ListPage ListComponent={ConfigMaps} canCreate={true} {...props} />;
const ConfigMapsDetailsPage = props => <DetailsPage
  {...props}
  menuActions={menuActions}
  pages={[navFactory.details(ConfigMapDetails), navFactory.editYaml()]}
/>;

export {ConfigMaps, ConfigMapsPage, ConfigMapsDetailsPage};
