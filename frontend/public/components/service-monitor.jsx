import * as React from 'react';

import { ColHead, List, ListHeader, ListPage, ResourceRow, DetailsPage } from './factory';
import { Cog, LabelList, navFactory, ResourceCog, ResourceLink, Selector, ResourceIcon } from './utils';
import { registerTemplate } from '../yaml-templates';

const template = `kind: ServiceMonitor
metadata:
  name: example
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
    interval: 30s`;

registerTemplate('v1.ServiceMonitor', `apiVersion: monitoring.coreos.com/v1
${template}`);

const {Edit, Delete} = Cog.factory;
const menuActions = [Edit, Delete];

const EndpointRow = ({endpoint}) => {
  let detail = <span className="text-muted">--</span>;

  if (_.has(endpoint, 'scheme')) {
    detail = <span><span className="text-muted">scheme:</span>{endpoint.scheme}</span>;
  } else if (_.has(endpoint, 'honorLabels')) {
    detail = <span><span className="text-muted">honorLabels:</span>{endpoint.honorLabels}</span>;
  } else if (_.has(endpoint, 'targetPort')) {
    detail = <span><span className="text-muted">targetPort:</span>{endpoint.targetPort}</span>;
  }

  return <div>
    <div className="row co-ip-header">
      <div className="col-xs-6">Port</div>
      <div className="col-xs-2">Interval</div>
      <div className="col-xs-4"></div>
    </div>
    <div className="rows">
      <div className="co-ip-row">
        <div className="row">
          <div className="col-xs-6">
            <p><ResourceIcon kind="Service" />{endpoint.port || '--'}</p>
          </div>
          <div className="col-xs-2">
            <p>{endpoint.interval || '--'}</p>
          </div>
          <div className="col-xs-4">
            {detail}
          </div>
        </div>
      </div>
    </div>
  </div>;
};

const namespaceSelectorLinks = ({spec}) => {
  const namespaces = _.get(spec, 'namespaceSelector.matchNames', []);
  if (namespaces.length) {
    return _.map(namespaces, n => <span><ResourceLink key={n} kind="Namespace" name={n} title={n} />&nbsp;&nbsp;</span>);
  }
  return <span className="text-muted">--</span>;
};

const serviceSelectorLinks = ({spec}) => {
  const namespaces = _.get(spec, 'namespaceSelector.matchNames', []);
  if (namespaces.length) {
    return _.map(namespaces, n => <span><Selector key={n} selector={spec.selector} kind="Service" namespace={n} />&nbsp;&nbsp;</span>);
  }
  return <Selector selector={spec.selector} kind="Service" />;
};


const Details = ({obj: sm}) => {
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
                  <dd>{ serviceSelectorLinks(sm) }</dd>
                  <dt>Monitoring Namespaces</dt>
                  <dd>{ namespaceSelectorLinks(sm) }</dd>
                </dl>
              </div>
              <div className="col-sm-6 col-xs-12">
                <dl>
                  <dt>Job Label</dt>
                  <dd>{spec.jobLabel || '--'}</dd>
                  <dt>Endpoints</dt>
                  <dd className="service-ips">{_.map(spec.endpoints, (e, i) => <EndpointRow endpoint={e} key={i} />)}</dd>
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
  const {metadata} = sm;
  const kind = 'ServiceMonitor';

  return <ResourceRow obj={sm}>
    <div className="col-md-3 col-sm-3 col-xs-6">
      <ResourceCog actions={menuActions} kind={kind} resource={sm} />
      <ResourceLink kind={kind} name={metadata.name} namespace={metadata.namespace} title={metadata.uid} />
    </div>
    <div className="col-md-3 col-sm-3 col-xs-6">
      <ResourceLink kind="Namespace" name={metadata.namespace} title={metadata.namespace} />
    </div>
    <div className="col-md-3 col-sm-6 hidden-xs">
      { serviceSelectorLinks(sm) }
    </div>
    <div className="col-md-3 hidden-sm">
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
  <ColHead {...props} className="col-md-3 hidden-sm" sortField="spec.namespaceSelector">
    Monitoring Namespace
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
