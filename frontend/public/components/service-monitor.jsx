import React from 'react';

import { ColHead, List, ListHeader, ListPage, ResourceRow, DetailsPage } from './factory';
import { Cog, LabelList, navFactory, ResourceCog, ResourceLink, Selector, ResourceIcon } from './utils';
import { registerTemplate } from '../yaml-templates';

registerTemplate('v1alpha1.ServiceMonitor', `apiVersion: monitoring.coreos.com/v1alpha1
kind: ServiceMonitor
metadata:
  name: prometheus
  labels:
    k8s-app: prometheus
spec:
  selector:
    matchLabels:
      prometheus: k8s
  namespaceSelector:
    matchNames:
    - monitoring
  endpoints:
  - port: web
    interval: 30s`);

const {Edit, Delete} = Cog.factory;
const menuActions = [Edit, Delete];

const EndpointRow = ({endpoint}) => <div>
  <div className="row co-ip-header">
    <div className="col-xs-4">Port</div>
    <div className="col-xs-4">Interval</div>
    <div className="col-xs-4">Scheme</div>
  </div>
  <div className="rows">
    <div className="co-ip-row">
      <div className="row">
        <div className="col-xs-4">
          <p><ResourceIcon kind="Service" />{endpoint.port || '--'}</p>
        </div>
        <div className="col-xs-4">
          <p>{endpoint.interval || '--'}</p>
        </div>
        <div className="col-xs-4">
          <p>{endpoint.scheme || '--'}</p>
        </div>
      </div>
    </div>
  </div>

  {endpoint.tlsConfig && <div>
    <div className="row co-ip-header">
      <div className="col-xs-8">caFile</div>
      <div className="col-xs-4">serverName</div>
    </div>
    <div className="rows">
      <div className="co-ip-row">
        <div className="row">
          <div className="col-xs-8">
            <p>{endpoint.tlsConfig.caFile}</p>
          </div>
          <div className="col-xs-4">
            <p>{endpoint.tlsConfig.serverName}</p>
          </div>
        </div>
      </div>
    </div>
  </div>}

  {endpoint.bearerTokenFile && <div>
    <div className="row co-ip-header">
      <div className="col-xs-12">bearerTokenFile</div>
    </div>
    <div className="rows">
      <div className="co-ip-row">
        <div className="row">
          <div className="col-xs-12">
            <p>{endpoint.bearerTokenFile}</p>
          </div>
        </div>
      </div>
    </div>
  </div>}

</div>;

const Details = (sm) => {
  const {metadata, spec} = sm;
  return <div>
    <div className="co-m-pane__body">
      <div className="co-m-pane__body-section--bordered">
        <h1 className="co-section-title">Service Monitor Overview</h1>

        <div className="row no-gutter">
          <div className="col-sm-12 col-xs-12">
            <div className="row">
              <div className="col-sm-6 col-xs-12">
                <dl>
                  <dt>Name</dt>
                  <dd>{metadata.name}</dd>
                  <dt>Labels</dt>
                  <dd><LabelList kind="ServiceMonitor" labels={metadata.labels} /></dd>
                  <dt>Service Selector</dt>
                  <dd><Selector selector={spec.selector} kind="Service" /></dd>
                  <dt>Namespace Selector</dt>
                  <dd><Selector selector={spec.namespaceSelector} /></dd>
                </dl>
              </div>
              <div className="col-sm-6 col-xs-12">
                <dl>
                  <dt>Job Label</dt>
                  <dd>{spec.jobLabel || '--'}</dd>
                  <dt>Endpoints</dt>
                  <dd className="service-ips">{_.map(spec.endpoints, (e, i) => <EndpointRow e={e} key={i} />)}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  </div>;
};

const ServiceMonitorRow = ({obj: sm}) => {
  const {metadata, spec} = sm;
  const kind = 'ServiceMonitor';

  return <ResourceRow obj={sm}>
    <div className="col-md-3 col-sm-3 col-xs-6">
      <ResourceCog actions={menuActions} kind={kind} resource={sm} />
      <ResourceLink kind={kind} name={metadata.name} namespace={metadata.namespace} title={metadata.uid} />
    </div>
    <div className="col-md-3 col-sm-5 hidden-xs">
      <Selector selector={spec.selector} kind="Service" />
    </div>
    <div className="col-md-3 hidden-sm hidden-xs">
      {_.map(spec.endpoints, (e, i) =>
        <p key={i}>
          <span className="text-muted">Port:</span> {e.port}&nbsp;&nbsp;<span className="text-muted">Interval:</span> {e.interval}
        </p>)}
    </div>
    <div className="col-md-3 col-sm-4 col-xs-6">
      <Selector selector={spec.namespaceSelector} kind="Namespace"/>
    </div>
  </ResourceRow>;
};

const ServiceMonitorHeader = props => <ListHeader>
  <ColHead {...props} className="col-md-3 col-sm-3 col-xs-6" sortField="metadata.name">Name</ColHead>
  <ColHead {...props} className="col-md-3 col-sm-5 hidden-xs" sortField="spec.selector">Service Selector</ColHead>
  <ColHead {...props} className="col-md-3 hidden-sm hidden-xs" sortField="spec.endpoints">Endpoints</ColHead>
  <ColHead {...props} className="col-md-3 col-sm-4 col-xs-6" sortField="spec.namespaceSelector">
    Namespace Selector
  </ColHead>
</ListHeader>;

export const ServiceMonitorsList = props => <List {...props} Header={ServiceMonitorHeader} Row={ServiceMonitorRow} />;

export const ServiceMonitorsPage = props => <ListPage
  {...props}
  canCreate={true}
  kind="ServiceMonitor"
  ListComponent={ServiceMonitorsList}
/>;

const {details, editYaml} = navFactory;
export const ServiceMonitorsDetailsPage = props => <DetailsPage
  {...props}
  menuActions={menuActions}
  pages={[
    details(Details),
    editYaml(),
  ]}
/>;
