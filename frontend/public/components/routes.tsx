import * as _ from 'lodash-es';
import * as React from 'react';
import * as classNames from 'classnames';
import { Popover } from '@patternfly/react-core';
import { sortable } from '@patternfly/react-table';
import { QuestionCircleIcon } from '@patternfly/react-icons';
import { DetailsPage,ListPage, Table, TableRow, TableData } from './factory';
import { Kebab, CopyToClipboard, SectionHeading, ResourceKebab, detailsPage, navFactory, ResourceLink, ResourceSummary, StatusIconAndText, ExternalLink } from './utils';
import { MaskedData } from './configmap-and-secret-data';
import { K8sResourceKind, K8sResourceKindReference } from '../module/k8s';
import { Conditions, conditionProps } from './conditions';

const RoutesReference: K8sResourceKindReference = 'Route';
const menuActions = Kebab.factory.common;

export type IngressStatusProps = {
  host: string;
  routerName: string;
  conditions: conditionProps[];
  wildcardPolicy: string;
  routerCanonicalHostname: string;
};

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
  const hostname = _.get(route, 'spec.host', '');
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
  {isWebRoute(obj)
    ? <ExternalLink href={getRouteWebURL(obj)} additionalClassName="co-external-link--block" text={getRouteLabel(obj)} />
    : getRouteLabel(obj)
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
  return <StatusIconAndText status={status} />;
};
RouteStatus.displayName = 'RouteStatus';

const tableColumnClasses = [
  classNames('col-lg-3', 'col-md-3', 'col-sm-4', 'col-xs-6'),
  classNames('col-lg-2', 'col-md-3', 'col-sm-4', 'col-xs-6'),
  classNames('col-lg-3', 'col-md-3', 'col-sm-4', 'hidden-xs'),
  classNames('col-lg-2', 'col-md-3', 'hidden-sm', 'hidden-xs'),
  classNames('col-lg-2', 'hidden-md', 'hidden-sm', 'hidden-xs'),
  Kebab.columnClass,
];

const kind = 'Route';

const RouteTableHeader = () => {
  return [
    {
      title: 'Name', sortField: 'metadata.name', transforms: [sortable],
      props: { className: tableColumnClasses[0] },
    },
    {
      title: 'Namespace', sortField: 'metadata.namespace', transforms: [sortable],
      props: { className: tableColumnClasses[1] },
    },
    {
      title: 'Location', sortField: 'spec.host', transforms: [sortable],
      props: { className: tableColumnClasses[2] },
    },
    {
      title: 'Service', sortField: 'spec.to.name', transforms: [sortable],
      props: { className: tableColumnClasses[3] },
    },
    {
      title: 'Status',
      props: { className: tableColumnClasses[4] },
    },
    {
      title: '', props: { className: tableColumnClasses[5] },
    },
  ];
};
RouteTableHeader.displayName = 'RouteTableHeader';

const RouteTableRow: React.FC<RouteTableRowProps> = ({obj: route, index, key, style}) => {
  return (
    <TableRow id={route.metadata.uid} index={index} trKey={key} style={style}>
      <TableData className={tableColumnClasses[0]}>
        <ResourceLink kind={kind} name={route.metadata.name}
          namespace={route.metadata.namespace} title={route.metadata.uid} />
      </TableData>
      <TableData className={classNames(tableColumnClasses[1], 'co-break-word')}>
        <ResourceLink kind="Namespace" name={route.metadata.namespace} title={route.metadata.namespace} />
      </TableData>
      <TableData className={classNames(tableColumnClasses[2], 'co-break-word')}>
        <RouteLocation obj={route} />
      </TableData>
      <TableData className={tableColumnClasses[3]}>
        <ResourceLink kind="Service" name={route.spec.to.name} namespace={route.metadata.namespace} title={route.spec.to.name} />
      </TableData>
      <TableData className={tableColumnClasses[4]}>
        <RouteStatus obj={route} />
      </TableData>
      <TableData className={tableColumnClasses[5]}>
        <ResourceKebab actions={menuActions} kind={kind} resource={route} />
      </TableData>
    </TableRow>
  );
};
RouteTableRow.displayName = 'RouteTableRow';
type RouteTableRowProps = {
  obj: K8sResourceKind;
  index: number;
  key?: string;
  style: object;
};

class TLSSettings extends React.Component<TLSDataProps, TLSDataState> {
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

const getIngressStatusForHost = (hostname, ingresses): IngressStatusProps => {
  return _.find(ingresses, {host: hostname}) as IngressStatusProps;
};

const showCustomRouteHelp = (ingress, annotations) => {
  if (!ingress || !_.some(ingress.conditions, {type: 'Admitted', status: 'True'})) {
    return false;
  }

  if (_.get(annotations, 'openshift.io/host.generated') === 'true') {
    return false;
  }

  if (!ingress.host || !ingress.routerCanonicalHostname) {
    return false;
  }

  return true;
};

const RouteTargetRow = ({route, target}) => <tr>
  <td><ResourceLink kind={target.kind} name={target.name} namespace={route.metadata.namespace} title={target.name} /></td>
  <td>{target.weight}</td>
  <td>{calcTrafficPercentage(target.weight, route)}</td>
</tr>;

const CustomRouteHelp: React.SFC<CustomRouteHelpProps> = ({host, routerCanonicalHostname}) =>
  <Popover
    headerContent={<React.Fragment>Custom Route</React.Fragment>}
    bodyContent={
      <div>
        <p>To use a custom route, you must update your DNS provider by creating a canonical name (CNAME) record. Your
        CNAME record should point to your custom domain <strong>{host}</strong>, to the OpenShift canonical router
        hostname, <strong>{routerCanonicalHostname}</strong>,
        as the alias.</p>
      </div>
    }>
    <button className="btn btn-link btn-link--no-btn-default-values" type="button"><QuestionCircleIcon /> Do you need to set up custom DNS?</button>
  </Popover>;

const RouteIngressStatus: React.SFC<RouteIngressStatusProps> = ({ingresses, annotations}) =>
  <React.Fragment>
    {_.map(ingresses, (ingress) =>
      <div key={ingress.routerName} className="co-m-route-ingress-status">
        <SectionHeading text={`Router: ${ingress.routerName}`} />
        <dl>
          <dt>Hostname</dt>
          <dd>{ingress.host}</dd>
          <dt>Wildcard Policy</dt>
          <dd>{ingress.wildcardPolicy}</dd>
          <dt>Canonical Router Hostname</dt>
          <dd>{ingress.routerCanonicalHostname || '-'}</dd>
          {showCustomRouteHelp(ingress, annotations) &&
          <CustomRouteHelp host={ingress.host} routerCanonicalHostname={ingress.routerCanonicalHostname}
          />}
        </dl>
        <h3 className="co-section-heading-secondary">Conditions</h3>
        <Conditions conditions={ingress.conditions} />
      </div>)}
  </React.Fragment>;

const RouteDetails: React.SFC<RoutesDetailsProps> = ({obj: route}) => {
  const primaryIngressStatus:IngressStatusProps = getIngressStatusForHost(route.spec.host, route.status.ingress);
  return <React.Fragment>
    <div className="co-m-pane__body">
      <SectionHeading text="Route Overview" />
      <div className="row">
        <div className="col-sm-6">
          <ResourceSummary resource={route}>
            <dt>{route.spec.to.kind}</dt>
            <dd><ResourceLink kind={route.spec.to.kind} name={route.spec.to.name} namespace={route.metadata.namespace}
              title={route.spec.to.name} />
            </dd>
            <dt>Target Port</dt>
            <dd>{_.get(route, 'spec.port.targetPort', '-')}</dd>
          </ResourceSummary>
        </div>
        <div className="col-sm-6">
          <dl className="co-m-pane__details">
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
            {primaryIngressStatus && <React.Fragment>
              <dt>Canonical Router Hostname</dt>
              <dd>{primaryIngressStatus.routerCanonicalHostname || '-'}</dd>
            </React.Fragment>
            }
            {showCustomRouteHelp(primaryIngressStatus, route.metadata.annotations) &&
            <dd><CustomRouteHelp host={primaryIngressStatus.host}
              routerCanonicalHostname={primaryIngressStatus.routerCanonicalHostname} />
            </dd>}
          </dl>
        </div>
      </div>
    </div>
    <div className="co-m-pane__body">
      <SectionHeading text="TLS Settings" />
      <TLSSettings tls={route.spec.tls} />
    </div>
    {!_.isEmpty(route.spec.alternateBackends) && <div className="co-m-pane__body">
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
            {_.map(route.spec.alternateBackends, (alternate, i) => <RouteTargetRow key={i} route={route}
              target={alternate} />)}
          </tbody>
        </table>
      </div>
    </div>}
    {_.isEmpty(route.status.ingress)
      ? <div className="cos-status-box">
        <div className="text-center">No Route Status</div>
      </div>
      : <div className="co-m-pane__body">
        <RouteIngressStatus ingresses={route.status.ingress} annotations={route.metadata.annotations} />
      </div>}
  </React.Fragment>;
};

export const RoutesDetailsPage: React.SFC<RoutesDetailsPageProps> = props => <DetailsPage
  {...props}
  kind={RoutesReference}
  menuActions={menuActions}
  pages={[navFactory.details(detailsPage(RouteDetails)), navFactory.editYaml()]}
/>;
export const RoutesList: React.SFC = props => <Table {...props} aria-label="Routes" Header={RouteTableHeader} Row={RouteTableRow} virtualize />;

const filters = [{
  type: 'route-status',
  selected: ['Accepted', 'Rejected', 'Pending'],
  reducer: routeStatus,
  items: [
    {id: 'Accepted', title: 'Accepted'},
    {id: 'Rejected', title: 'Rejected'},
    {id: 'Pending', title: 'Pending'},
  ],
}];

export const RoutesPage: React.SFC<RoutesPageProps> = props => {

  const createProps = {
    to: `/k8s/ns/${props.namespace || 'default'}/routes/~new/form`,
  };

  return <ListPage
    ListComponent={RoutesList}
    kind={RoutesReference}
    canCreate={true}
    createProps={createProps}
    rowFilters={filters}
    {...props}
  />;
};

export type RouteHostnameProps = {
  obj: K8sResourceKind;
};

export type RouteStatusProps = {
  obj: K8sResourceKind;
};

export type RouteHeaderProps = {
  obj: K8sResourceKind;
};

export type RoutesPageProps = {
  obj: K8sResourceKind;
  namespace: string;
};

export type RoutesDetailsProps = {
  obj: K8sResourceKind;
};

export type RoutesDetailsPageProps = {
  match: any;
};

export type TLSDataProps = {
  tls: any;
};

export type TLSDataState = {
  showPrivateKey: boolean;
};

export type RouteIngressStatusProps = {
  ingresses: IngressStatusProps[];
  annotations: {[key: string]: string};
};

export type CustomRouteHelpProps = {
  host: string;
  routerCanonicalHostname: string;
};
