import * as _ from 'lodash-es';
import * as React from 'react';

import { ColHead, DetailsPage, List, ListHeader, ListPage, ResourceRow } from './factory';
import { Cog, CopyToClipboard, SectionHeading, ResourceCog, detailsPage, navFactory, ResourceLink, ResourceSummary } from './utils';
import { MaskedData } from './configmap-and-secret-data';
// eslint-disable-next-line no-unused-vars
import { K8sResourceKind, K8sResourceKindReference } from '../module/k8s';
import { SafetyFirst } from './safety-first';
import { Conditions, conditionProps } from './conditions';

const RoutesReference: K8sResourceKindReference = 'Route';
const menuActions = Cog.factory.common;

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

export const RouteLocation: React.SFC<RouteHostnameProps> = ({obj}) => <div>
  {isWebRoute(obj) ? <a href={getRouteWebURL(obj)} target="_blank" className="co-external-link co-external-link--block" rel="noopener noreferrer">
    {getRouteLabel(obj)}</a> : getRouteLabel(obj)
  }
</div>;
RouteLocation.displayName = 'RouteLocation';


export const routeStatus = (route) => {
  let atLeastOneAdmitted: boolean = false;

  if (!route.status || !route.status.ingress) {
    return 'Pending';
  }

  _.each(route.status.ingress, (ingress) => {
    const isAdmitted = _.some(ingress.conditions, {type: 'Admitted', status: 'True'});
    if (isAdmitted) {
      atLeastOneAdmitted = true;
    }
  });

  return atLeastOneAdmitted ? 'Accepted' : 'Rejected';
};

export const RouteStatus: React.SFC<RouteStatusProps> = ({obj: route}) => {
  const status: string = routeStatus(route);

  switch (status) {
    case 'Pending':
      return <span>
        <span className="fa fa-hourglass-half co-m-route-status-icon" aria-hidden="true"></span>
        Pending
      </span>;
    case 'Accepted':
      return <span className="route-accepted">
        <span className="fa fa-check co-m-route-status-icon" aria-hidden="true"></span>
        Accepted
      </span>;
    case 'Rejected':
      return <span className="route-rejected">
        <span className="fa fa-times-circle co-m-route-status-icon" aria-hidden="true"></span>
        Rejected
      </span>;
    default:
      break;
  }
};
RouteStatus.displayName = 'RouteStatus';

const RouteListHeader: React.SFC<RouteHeaderProps> = props => <ListHeader>
  <ColHead {...props} className="col-lg-3 col-md-3 col-sm-4 col-xs-6" sortField="metadata.name">Name</ColHead>
  <ColHead {...props} className="col-lg-2 col-md-3 col-sm-4 col-xs-6" sortField="metadata.namespace">Namespace</ColHead>
  <ColHead {...props} className="col-lg-3 col-md-3 col-sm-4 hidden-xs" sortField="spec.host">Location</ColHead>
  <ColHead {...props} className="col-lg-2 col-md-3 hidden-sm hidden-xs" sortField="spec.to.name">Service</ColHead>
  <ColHead {...props} className="col-lg-2 hidden-md hidden-sm hidden-xs">Status</ColHead>
</ListHeader>;

const RouteListRow: React.SFC<RoutesRowProps> = ({obj: route}) => <ResourceRow obj={route}>
  <div className="col-lg-3 col-md-3 col-sm-4 col-xs-6 co-resource-link-wrapper">
    <ResourceCog actions={menuActions} kind="Route" resource={route} />
    <ResourceLink kind="Route" name={route.metadata.name}
      namespace={route.metadata.namespace} title={route.metadata.uid} />
  </div>
  <div className="col-lg-2 col-md-3 col-sm-4 col-xs-6 co-break-word">
    <ResourceLink kind="Namespace" name={route.metadata.namespace} title={route.metadata.namespace} />
  </div>
  <div className="col-lg-3 col-md-3 col-sm-4 hidden-xs co-break-word">
    <RouteLocation obj={route} />
  </div>
  <div className="col-lg-2 col-md-3 hidden-sm hidden-xs">
    <ResourceLink kind="Service" name={route.spec.to.name} namespace={route.metadata.namespace} title={route.spec.to.name} />
  </div>
  <div className="col-lg-2 hidden-md hidden-sm hidden-xs"><RouteStatus obj={route} /></div>
</ResourceRow>;

class TLSSettings extends SafetyFirst<TLSDataProps, TLSDataState> {
  constructor(props) {
    super(props);
    this.state = { showPrivateKey: false };
    this.toggleKey = this.toggleKey.bind(this);
  }

  toggleKey() {
    this.setState({ showPrivateKey: !this.state.showPrivateKey });
  }

  render() {
    const { showPrivateKey } = this.state;
    const { tls } = this.props;
    const visibleKeyValue = showPrivateKey ? tls.key : <MaskedData /> ;

    return !tls ?
      'TLS is not enabled.' :
      <dl>
        <dt>Termination Type</dt>
        <dd>{tls.termination}</dd>
        <dt>Insecure Traffic</dt>
        <dd>{tls.insecureEdgeTerminationPolicy || '-'}</dd>
        <dt>Certificate</dt>
        <dd>{tls.certificate ? <CopyToClipboard value={tls.certificate} /> : '-'}</dd>
        <dt className="co-m-route-tls-reveal__title">Key {tls.key &&
          <button className="btn btn-link co-m-route-tls-reveal__btn" type="button" onClick={this.toggleKey}>
            {
              showPrivateKey
                ? <React.Fragment><i className="fa fa-eye-slash" aria-hidden="true"></i> Hide</React.Fragment>
                : <React.Fragment><i className="fa fa-eye" aria-hidden="true"></i> Reveal</React.Fragment>
            }
          </button>}
        </dt>
        <dd>{tls.key ? <CopyToClipboard value={tls.key} visibleValue={visibleKeyValue} /> : '-'}</dd>
        <dt>CA Certificate</dt>
        <dd>{tls.caCertificate ? <CopyToClipboard value={tls.caCertificate} /> : '-'}</dd>
        {tls.termination === 'reencrypt' && <React.Fragment>
          <dt>Destination CA Cert</dt>
          <dd>{tls.destinationCACertificate ? <CopyToClipboard value={tls.destinationCACertificate} /> : '-'}</dd>
        </React.Fragment>}
      </dl>;
  }
}

const calcTrafficPercentage = (weight: number, route: any) => {
  if (!weight) {
    return '-';
  }

  const totalWeight = _.reduce(route.spec.alternateBackends, (result, alternate) => {
    return result += alternate.weight;
  }, route.spec.to.weight);

  const percentage = (weight / totalWeight) * 100;

  return `${percentage.toFixed(1)}%`;
};

const RouteTargetRow = ({route, target}) => <tr>
  <td><ResourceLink kind={target.kind} name={target.name} namespace={route.metadata.namespace} title={target.name} /></td>
  <td>{target.weight}</td>
  <td>{calcTrafficPercentage(target.weight, route)}</td>
</tr>;

const RouteIngressStatus: React.SFC<RouteIngressStatusProps> = ({ingresses}) =>
  <React.Fragment>
    {_.map(ingresses, (ingress) =>
      <div key={ingress.routerName} className="co-m-route-ingress-status">
        <SectionHeading text={`Router: ${ingress.routerName}`} />
        <dl>
          <dt>Hostname</dt>
          <dd>{ingress.host}</dd>
          <dt>Wildcard Policy</dt>
          <dd>{ingress.wildcardPolicy}</dd>
        </dl>
        <h3 className="co-section-heading-secondary">Conditions</h3>
        <Conditions conditions={ingress.conditions} />
      </div>)}
  </React.Fragment>;

const RouteDetails: React.SFC<RoutesDetailsProps> = ({obj: route}) => <React.Fragment>
  <div className="co-m-pane__body">
    <SectionHeading text="Route Overview" />
    <div className="row">
      <div className="col-sm-6">
        <ResourceSummary resource={route} showPodSelector={false} showNodeSelector={false}>
          <dt>{route.spec.to.kind}</dt>
          <dd><ResourceLink kind={route.spec.to.kind} name={route.spec.to.name} namespace={route.metadata.namespace}
            title={route.spec.to.name} />
          </dd>
          <dt>Target Port</dt>
          <dd>{_.get(route, 'spec.port.targetPort', '-')}</dd>
        </ResourceSummary>
      </div>
      <div className="col-sm-6">
        <dt>Location</dt>
        <dd><RouteLocation obj={route} /></dd>
        <dt>Status</dt>
        <dd>
          <RouteStatus obj={route} />
        </dd>
        <dt>Hostname</dt>
        <dd>{route.spec.host}</dd>
        <dt>Path</dt>
        <dd>{route.spec.path || '-'}</dd>
      </div>
    </div>
  </div>
  <div className="co-m-pane__body">
    <SectionHeading text="TLS Settings" />
    <TLSSettings tls={route.spec.tls} />
  </div>
  { !_.isEmpty(route.spec.alternateBackends) && <div className="co-m-pane__body">
    <SectionHeading text="Traffic" />
    <p className="co-m-pane__explanation">
      This route splits traffic across multiple services.
    </p>
    <div className="co-table-container">
      <table className="table">
        <thead>
          <tr>
            <th>Service</th>
            <th>Weight</th>
            <th>Percent</th>
          </tr>
        </thead>
        <tbody>
          <RouteTargetRow route={route} target={route.spec.to} />
          {_.map(route.spec.alternateBackends, (alternate, i) => <RouteTargetRow key={i} route={route} target={alternate} />)}
        </tbody>
      </table>
    </div>
  </div> }
  {_.isEmpty(route.status.ingress)
    ? <div className="cos-status-box">
      <div className="text-center">No Route Status</div>
    </div>
    : <div className="co-m-pane__body">
      <RouteIngressStatus ingresses={route.status.ingress} />
    </div>}
</React.Fragment>;

export const RoutesDetailsPage: React.SFC<RoutesDetailsPageProps> = props => <DetailsPage
  {...props}
  kind={RoutesReference}
  menuActions={menuActions}
  pages={[navFactory.details(detailsPage(RouteDetails)), navFactory.editYaml()]}
/>;
export const RoutesList: React.SFC = props => <List {...props} Header={RouteListHeader} Row={RouteListRow} />;

const filters = [{
  type: 'route-status',
  selected: ['Accepted', 'Rejected', 'Pending'],
  reducer: routeStatus,
  items: [
    {id: 'Accepted', title: 'Accepted'},
    {id: 'Rejected', title: 'Rejected'},
    {id: 'Pending', title: 'Pending'}
  ],
}];

export const RoutesPage: React.SFC<RoutesPageProps> = props =>
  <ListPage
    ListComponent={RoutesList}
    kind={RoutesReference}
    canCreate={true}
    rowFilters={filters}
    {...props}
  />;

/* eslint-disable no-undef */
export type RouteHostnameProps = {
  obj: K8sResourceKind
};

export type RouteStatusProps = {
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

export type TLSDataProps = {
  tls: any
};

export type TLSDataState = {
  showPrivateKey: boolean
};

export type IngressStatusProps = {
  host: string,
  routerName: string,
  conditions: conditionProps[],
  wildcardPolicy: string
};

export type RouteIngressStatusProps = {
  ingresses: IngressStatusProps[]
};
/* eslint-enable no-undef */
