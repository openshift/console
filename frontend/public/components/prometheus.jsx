import * as React from 'react';

import { ColHead, List, ListHeader, ListPage, ResourceRow } from './factory';
import { Cog, LabelList, ResourceCog, ResourceLink, Selector } from './utils';
import { PrometheusModel } from '../models';
import { referenceForModel } from '../module/k8s';

const {Edit, Delete, ModifyCount} = Cog.factory;
const menuActions = [ModifyCount, Edit, Delete];

const PrometheusRow = ({obj: instance}) => {
  const {metadata, spec} = instance;

  return <ResourceRow obj={instance}>
    <div className="col-lg-3 col-md-3 col-sm-4 col-xs-6 co-resource-link-wrapper">
      <ResourceCog actions={menuActions} kind={referenceForModel(PrometheusModel)} resource={instance} />
      <ResourceLink kind={referenceForModel(PrometheusModel)} name={metadata.name} namespace={metadata.namespace} title={metadata.uid} />
    </div>
    <div className="col-lg-3 col-md-3 col-sm-4 col-xs-6">
      <ResourceLink kind="Namespace" name={metadata.namespace} title={metadata.namespace} />
    </div>
    <div className="col-lg-3 col-md-4 col-sm-4 hidden-xs">
      <LabelList kind={PrometheusModel.kind} labels={metadata.labels} />
    </div>
    <div className="col-lg-1 col-md-2 hidden-sm hidden-xs">{spec.version}</div>
    <div className="col-lg-2 hidden-md hidden-sm hidden-xs">
      <Selector selector={spec.serviceMonitorSelector} kind="ServiceMonitor" namespace={metadata.namespace} />
    </div>
  </ResourceRow>;
};

const PrometheusHeader = props => <ListHeader>
  <ColHead {...props} className="col-lg-3 col-md-3 col-sm-4 col-xs-6" sortField="metadata.name">Name</ColHead>
  <ColHead {...props} className="col-lg-3 col-md-3 col-sm-4 col-xs-6" sortField="metadata.namespace">Namespace</ColHead>
  <ColHead {...props} className="col-lg-3 col-md-4 col-sm-4 hidden-xs" sortField="metadata.labels">Labels</ColHead>
  <ColHead {...props} className="col-lg-1 col-md-2 hidden-sm hidden-xs" sortField="spec.version">Version</ColHead>
  <ColHead {...props} className="col-lg-2 hidden-md hidden-sm hidden-xs" sortField="spec.serviceMonitorSelector">
    Service Monitor Selector
  </ColHead>
</ListHeader>;

export const PrometheusInstancesList = props => <List {...props} Header={PrometheusHeader} Row={PrometheusRow} />;
export const PrometheusInstancesPage = props => <ListPage {...props} ListComponent={PrometheusInstancesList} canCreate={true} kind={referenceForModel(PrometheusModel)} />;
