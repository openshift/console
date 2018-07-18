import * as _ from 'lodash-es';
import * as React from 'react';

import { ColHead, List, ListHeader, ListPage, ResourceRow } from './factory';
import { Cog, ResourceCog, ResourceLink, Selector } from './utils';
import { ServiceMonitorModel } from '../models';
import { referenceForModel } from '../module/k8s';

const {Edit, Delete} = Cog.factory;
const menuActions = [Edit, Delete];

const namespaceSelectorLinks = ({spec}) => {
  const namespaces = _.get(spec, 'namespaceSelector.matchNames', []);
  if (namespaces.length) {
    return _.map(namespaces, n => <span key={n}><ResourceLink kind="Namespace" name={n} title={n} />&nbsp;&nbsp;</span>);
  }
  return <span className="text-muted">--</span>;
};

const serviceSelectorLinks = ({spec}) => {
  const namespaces = _.get(spec, 'namespaceSelector.matchNames', []);
  if (namespaces.length) {
    return _.map(namespaces, n => <span key={n}><Selector selector={spec.selector} kind="Service" namespace={n} />&nbsp;&nbsp;</span>);
  }
  return <Selector selector={spec.selector} kind="Service" />;
};

const ServiceMonitorRow = ({obj: sm}) => {
  const {metadata} = sm;

  return <ResourceRow obj={sm}>
    <div className="col-md-3 col-sm-3 col-xs-6 co-resource-link-wrapper">
      <ResourceCog actions={menuActions} kind={referenceForModel(ServiceMonitorModel)} resource={sm} />
      <ResourceLink kind={referenceForModel(ServiceMonitorModel)} name={metadata.name} namespace={metadata.namespace} title={metadata.uid} />
    </div>
    <div className="col-md-3 col-sm-3 col-xs-6">
      <ResourceLink kind="Namespace" name={metadata.namespace} title={metadata.namespace} />
    </div>
    <div className="col-md-3 col-sm-6 hidden-xs">
      { serviceSelectorLinks(sm) }
    </div>
    <div className="col-md-3 hidden-sm hidden-xs">
      <p>
        { namespaceSelectorLinks(sm) }
      </p>
    </div>
  </ResourceRow>;
};

const ServiceMonitorHeader = props => <ListHeader>
  <ColHead {...props} className="col-md-3 col-sm-3 col-xs-6" sortField="metadata.name">Name</ColHead>
  <ColHead {...props} className="col-md-3 col-sm-3 col-xs-6" sortField="metadata.namespace">Namespace</ColHead>
  <ColHead {...props} className="col-md-3 col-sm-6 hidden-xs" sortField="spec.selector">Service Selector</ColHead>
  <ColHead {...props} className="col-md-3 hidden-sm hidden-xs" sortField="spec.namespaceSelector">
    Monitoring Namespace
  </ColHead>
</ListHeader>;

export const ServiceMonitorsList = props => <List {...props} Header={ServiceMonitorHeader} Row={ServiceMonitorRow} />;

export const ServiceMonitorsPage = props => <ListPage
  {...props}
  canCreate={true}
  kind={referenceForModel(ServiceMonitorModel)}
  ListComponent={ServiceMonitorsList}
/>;
