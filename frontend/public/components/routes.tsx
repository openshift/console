import * as _ from 'lodash-es';
import * as React from 'react';

import { ColHead, DetailsPage, List, ListHeader, ListPage, ResourceRow } from './factory';
import { Cog, ResourceCog, detailsPage, navFactory, ResourceLink, ResourceSummary } from './utils';
import { registerTemplate } from '../yaml-templates';
// eslint-disable-next-line no-unused-vars
import {K8sResourceKind, K8sResourceKindReference} from '../module/k8s';

const RoutesReference: K8sResourceKindReference = 'Route';
const menuActions = Cog.factory.common;

registerTemplate('route.openshift.io/v1.Route', `apiVersion: route.openshift.io/v1
kind: Route
metadata:
  name: example
spec:
  path: /
  to:
    kind: Service
    name: example
  port:
    targetPort: 80`);

const getRouteHost = (route, onlyAdmitted) => {
  let oldestAdmittedIngress = null;
  _.each(route.status.ingress, (ingress) => {
    if (_.some(ingress.conditions, { type: 'Admitted', status: 'True' }) &&
      (!oldestAdmittedIngress || oldestAdmittedIngress.lastTransitionTime > ingress.lastTransitionTime)) {
      oldestAdmittedIngress = ingress;
    }
  });

  if (oldestAdmittedIngress) {
    return oldestAdmittedIngress.host;
  }

  return onlyAdmitted ? null : route.spec.host;
};

const isWebRoute = (route) => {
  return !!getRouteHost(route, true) &&
    _.get(route, 'spec.wildcardPolicy') !== 'Subdomain';
};

const getRouteWebURL = (route) => {
  const scheme = _.get(route, 'spec.tls.termination') ? 'https' : 'http';
  let url = `${scheme }://${getRouteHost(route, false)}`;
  if (route.spec.path) {
    url += route.spec.path;
  }
  return url;
};

const getSubdomain = (route) => {
  let hostname = _.get(route, 'spec.host', '');
  return hostname.replace(/^[a-z0-9]([-a-z0-9]*[a-z0-9])\./, '');
};

const getRouteLabel = (route) => {
  if (isWebRoute(route)) {
    return getRouteWebURL(route);
  }

  let label = getRouteHost(route, false);
  if (!label) {
    return '<unknown host>';
  }

  if (_.get(route, 'spec.wildcardPolicy') === 'Subdomain') {
    label = `*.${ getSubdomain(route)}`;
  }

  if (route.spec.path) {
    label += route.spec.path;
  }
  return label;
};

export const RouteHostname: React.SFC<RouteHostnameProps> = ({obj}) => <div>
  {isWebRoute(obj) ? <a href={getRouteWebURL(obj)} target="_blank" rel="noopener noreferrer">
    {getRouteLabel(obj)}
    <i className="fa fa-external-link" style={{paddingLeft: '4px'}} aria-hidden="true"/>
  </a> : getRouteLabel(obj)
  }
</div>;

const RouteListHeader: React.SFC<RouteHeaderProps> = props => <ListHeader>
  <ColHead {...props} className="col-md-3 col-sm-4 col-xs-6" sortField="metadata.name">Name</ColHead>
  <ColHead {...props} className="col-md-3 col-sm-4 col-xs-6" sortField="spec.host">Hostname</ColHead>
  <ColHead {...props} className="col-md-2 col-sm-4 hidden-xs" sortField="spec.to.name">Service</ColHead>
  <ColHead {...props} className="col-md-2 hidden-sm hidden-xs" sortField="spec.port.targetPort">Target Port</ColHead>
  <ColHead {...props} className="col-md-2 hidden-sm hidden-xs" sortField="spec.tls.termination">TLS Termination</ColHead>
</ListHeader>;

const RouteListRow: React.SFC<RoutesRowProps> = ({obj: route}) => <ResourceRow obj={route}>
  <div className="col-md-3 col-sm-4 col-xs-6">
    <ResourceCog actions={menuActions} kind="Route" resource={route} />
    <ResourceLink kind="Route" name={route.metadata.name}
      namespace={route.metadata.namespace} title={route.metadata.uid} />
  </div>
  <div className="col-md-3 col-sm-4 col-xs-6">
    <RouteHostname obj={route} />
  </div>
  <div className="col-md-2 col-sm-4 hidden-xs">
    <ResourceLink kind="Service" name={route.spec.to.name} title={route.spec.to.name} />
  </div>
  <div className="col-md-2 hidden-sm hidden-xs">{_.get(route, 'spec.port.targetPort', '')}</div>
  <div className="col-md-2 hidden-sm hidden-xs">{_.get(route, 'spec.tls.termination', '')}</div>
</ResourceRow>;

const TLSSettings = props => <span>
  {!props.tls && 'TLS is not enabled.'}
  {props.tls && <dl>
    <dt>Termination Type</dt>
    <dd>{props.tls.termination}</dd>
    <dt>Insecure Traffic</dt>
    <dd>{props.tls.insecureEdgeTerminationPolicy || '-'}</dd>
    <dt>Certificate</dt>
    <dd>{props.tls.certificate || '-'}</dd>
    <dt>Key</dt>
    <dd>{props.tls.key || '-'}</dd>
    <dt>CA Certificate</dt>
    <dd>{props.tls.caCertificate || '-'}</dd>
    {_.get(props.tls, 'termination') === 'reencrypt' && <span>
      <dt>Destination CA Cert</dt>
      <dd>{props.tls.destinationCACertificate || '-'}</dd>
    </span>}
  </dl>
  }
</span>;

const RouteDetails: React.SFC<RoutesDetailsProps> = ({obj: route}) => <React.Fragment>
  <div className="co-m-pane__body">
    <ResourceSummary resource={route} showPodSelector={false} showNodeSelector={false}>
      <dt>Path</dt>
      <dd>{route.spec.path || '-'}</dd>
      <dt>{route.spec.to.kind || 'Routes To'}</dt>
      <dd><ResourceLink kind="Service" name={route.spec.to.name} title={route.spec.to.name} /></dd>
      <dt>Target Port</dt>
      <dd>{_.get(route, 'spec.port.targetPort') ? _.get(route, 'spec.port.targetPort') : <em>any</em>}</dd>
    </ResourceSummary>
  </div>
  <div className="co-m-pane__body">
    <h1 className="co-section-title">TLS Settings</h1>
    <TLSSettings tls={route.spec.tls} />
  </div>
</React.Fragment>;

export const RoutesDetailsPage: React.SFC<RoutesDetailsPageProps> = props => <DetailsPage
  {...props}
  kind={RoutesReference}
  menuActions={menuActions}
  pages={[navFactory.details(detailsPage(RouteDetails)), navFactory.editYaml()]}
/>;
export const RoutesList: React.SFC = props => <List {...props} Header={RouteListHeader} Row={RouteListRow} />;
export const RoutesPage: React.SFC<RoutesPageProps> = props =>
  <ListPage
    ListComponent={RoutesList}
    kind={RoutesReference}
    canCreate={true}
    {...props}
  />;

/* eslint-disable no-undef */
export type RouteHostnameProps = {
  obj: K8sResourceKind
};

export type RoutesRowProps = {
  obj: K8sResourceKind
};

export type RouteHeaderProps = {
  obj: K8sResourceKind
};

export type RoutesPageProps = {
  obj: K8sResourceKind
};

export type RoutesDetailsProps = {
  obj: K8sResourceKind
};

export type RoutesDetailsPageProps = {
  match: any
};
/* eslint-enable no-undef */
