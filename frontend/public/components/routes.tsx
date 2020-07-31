import * as _ from 'lodash-es';
import * as React from 'react';
import * as classNames from 'classnames';
import { Button, Popover } from '@patternfly/react-core';
import { sortable } from '@patternfly/react-table';
import { EyeIcon, EyeSlashIcon, QuestionCircleIcon } from '@patternfly/react-icons';

import { Status } from '@console/shared';
import { DetailsPage, ListPage, Table, TableRow, TableData, RowFunction } from './factory';
import {
  CopyToClipboard,
  DetailsItem,
  ExternalLink,
  Kebab,
  ResourceKebab,
  ResourceLink,
  ResourceSummary,
  SectionHeading,
  detailsPage,
  navFactory,
} from './utils';
import { MaskedData } from './configmap-and-secret-data';
import {
  K8sResourceKindReference,
  RouteKind,
  RouteIngress,
  RouteTarget,
  K8sResourceCondition,
} from '../module/k8s';
import { RouteModel } from '../models';
import { Conditions } from './conditions';
import { RouteCharts } from './routes/route-charts';

const RoutesReference: K8sResourceKindReference = 'Route';
const menuActions = [...Kebab.getExtensionsActionsForKind(RouteModel), ...Kebab.factory.common];

export type IngressStatusProps = {
  host: string;
  routerName: string;
  conditions: K8sResourceCondition[];
  wildcardPolicy: string;
  routerCanonicalHostname: string;
};

const getRouteHost = (route: RouteKind, onlyAdmitted: boolean): string => {
  let oldestAdmittedIngress: RouteIngress;
  let oldestTransitionTime: string;
  _.each(route.status.ingress, (ingress) => {
    const admittedCondition = _.find(ingress.conditions, { type: 'Admitted', status: 'True' });
    if (
      admittedCondition &&
      (!oldestTransitionTime || oldestTransitionTime > admittedCondition.lastTransitionTime)
    ) {
      oldestAdmittedIngress = ingress;
      oldestTransitionTime = admittedCondition.lastTransitionTime;
    }
  });

  if (oldestAdmittedIngress) {
    return oldestAdmittedIngress.host;
  }

  return onlyAdmitted ? null : route.spec.host;
};

const isWebRoute = (route: RouteKind): boolean => {
  return !!getRouteHost(route, true) && _.get(route, 'spec.wildcardPolicy') !== 'Subdomain';
};

export const getRouteWebURL = (route: RouteKind): string => {
  const scheme = _.get(route, 'spec.tls.termination') ? 'https' : 'http';
  let url = `${scheme}://${getRouteHost(route, false)}`;
  if (route.spec.path) {
    url += route.spec.path;
  }
  return url;
};

const getSubdomain = (route: RouteKind): string => {
  const hostname = _.get(route, 'spec.host', '');
  return hostname.replace(/^[a-z0-9]([-a-z0-9]*[a-z0-9])\./, '');
};

const getRouteLabel = (route: RouteKind): string => {
  if (isWebRoute(route)) {
    return getRouteWebURL(route);
  }

  let label = getRouteHost(route, false);
  if (!label) {
    return '<unknown host>';
  }

  if (_.get(route, 'spec.wildcardPolicy') === 'Subdomain') {
    label = `*.${getSubdomain(route)}`;
  }

  if (route.spec.path) {
    label += route.spec.path;
  }
  return label;
};

export const RouteLocation: React.FC<RouteHostnameProps> = ({ obj }) => (
  <div>
    {isWebRoute(obj) ? (
      <ExternalLink
        href={getRouteWebURL(obj)}
        additionalClassName="co-external-link--block"
        text={getRouteLabel(obj)}
      />
    ) : (
      getRouteLabel(obj)
    )}
  </div>
);
RouteLocation.displayName = 'RouteLocation';

export const routeStatus = (route: RouteKind): string => {
  let atLeastOneAdmitted: boolean = false;

  if (!route.status || !route.status.ingress) {
    return 'Pending';
  }

  _.each(route.status.ingress, (ingress) => {
    const isAdmitted = _.some(ingress.conditions, { type: 'Admitted', status: 'True' });
    if (isAdmitted) {
      atLeastOneAdmitted = true;
    }
  });

  return atLeastOneAdmitted ? 'Accepted' : 'Rejected';
};

export const RouteStatus: React.FC<RouteStatusProps> = ({ obj: route }) => {
  const status: string = routeStatus(route);
  return <Status status={status} />;
};
RouteStatus.displayName = 'RouteStatus';

const tableColumnClasses = [
  '',
  '',
  classNames('pf-m-hidden', 'pf-m-visible-on-sm', 'pf-u-w-16-on-lg'),
  classNames('pf-m-hidden', 'pf-m-visible-on-lg'),
  classNames('pf-m-hidden', 'pf-m-visible-on-lg'),
  Kebab.columnClass,
];

const kind = 'Route';

const RouteTableHeader = () => {
  return [
    {
      title: 'Name',
      sortField: 'metadata.name',
      transforms: [sortable],
      props: { className: tableColumnClasses[0] },
    },
    {
      title: 'Namespace',
      sortField: 'metadata.namespace',
      transforms: [sortable],
      props: { className: tableColumnClasses[1] },
      id: 'namespace',
    },
    {
      title: 'Status',
      props: { className: tableColumnClasses[2] },
    },
    {
      title: 'Location',
      sortField: 'spec.host',
      transforms: [sortable],
      props: { className: tableColumnClasses[3] },
    },
    {
      title: 'Service',
      sortField: 'spec.to.name',
      transforms: [sortable],
      props: { className: tableColumnClasses[4] },
    },
    {
      title: '',
      props: { className: tableColumnClasses[5] },
    },
  ];
};
RouteTableHeader.displayName = 'RouteTableHeader';

const RouteTableRow: RowFunction<RouteKind> = ({ obj: route, index, key, style }) => {
  return (
    <TableRow id={route.metadata.uid} index={index} trKey={key} style={style}>
      <TableData className={tableColumnClasses[0]}>
        <ResourceLink
          kind={kind}
          name={route.metadata.name}
          namespace={route.metadata.namespace}
          title={route.metadata.uid}
        />
      </TableData>
      <TableData
        className={classNames(tableColumnClasses[1], 'co-break-word')}
        columnID="namespace"
      >
        <ResourceLink
          kind="Namespace"
          name={route.metadata.namespace}
          title={route.metadata.namespace}
        />
      </TableData>
      <TableData className={tableColumnClasses[2]}>
        <RouteStatus obj={route} />
      </TableData>
      <TableData className={classNames(tableColumnClasses[3], 'co-break-word')}>
        <RouteLocation obj={route} />
      </TableData>
      <TableData className={tableColumnClasses[4]}>
        <ResourceLink
          kind="Service"
          name={route.spec.to.name}
          namespace={route.metadata.namespace}
          title={route.spec.to.name}
        />
      </TableData>
      <TableData className={tableColumnClasses[5]}>
        <ResourceKebab actions={menuActions} kind={kind} resource={route} />
      </TableData>
    </TableRow>
  );
};

const TLSSettings: React.FC<TLSSettingsProps> = ({ route }) => {
  const [showKey, setShowKey] = React.useState(false);
  const { tls } = route.spec;
  if (!tls) {
    return <>TLS is not enabled.</>;
  }

  const visibleKeyValue = showKey ? tls.key : <MaskedData />;
  return (
    <dl>
      <DetailsItem label="Termination Type" obj={route} path="spec.tls.termination" />
      <DetailsItem
        label="Insecure Traffic"
        obj={route}
        path="spec.tls.insecureEdgeTerminationPolicy"
      />
      <DetailsItem label="Certificate" obj={route} path="spec.tls.certificate">
        {tls.certificate ? <CopyToClipboard value={tls.certificate} /> : '-'}
      </DetailsItem>
      <dt className="co-m-route-tls-reveal__title">
        Key{' '}
        {tls.key && (
          <Button
            className="pf-m-link--align-left"
            type="button"
            onClick={() => setShowKey(!showKey)}
            variant="link"
          >
            {showKey ? (
              <>
                <EyeSlashIcon className="co-icon-space-r" />
                Hide
              </>
            ) : (
              <>
                <EyeIcon className="co-icon-space-r" />
                Reveal
              </>
            )}
          </Button>
        )}
      </dt>
      <dd>{tls.key ? <CopyToClipboard value={tls.key} visibleValue={visibleKeyValue} /> : '-'}</dd>
      <DetailsItem label="CA Certificate" obj={route} path="spec.tls.caCertificate">
        {tls.certificate ? <CopyToClipboard value={tls.caCertificate} /> : '-'}
      </DetailsItem>
      {tls.termination === 'reencrypt' && (
        <DetailsItem
          label="Destination CA Certificate"
          obj={route}
          path="spec.tls.destinationCACertificate"
        >
          {tls.destinationCACertificate ? (
            <CopyToClipboard value={tls.destinationCACertificate} />
          ) : (
            '-'
          )}
        </DetailsItem>
      )}
    </dl>
  );
};

const calcTrafficPercentage = (weight: number, route: any) => {
  if (!weight) {
    return '-';
  }

  const totalWeight = _.reduce(
    route.spec.alternateBackends,
    (result, alternate) => {
      return (result += alternate.weight);
    },
    route.spec.to.weight,
  );

  const percentage = (weight / totalWeight) * 100;

  return `${percentage.toFixed(1)}%`;
};

const getIngressStatusForHost = (
  hostname: string,
  ingresses: RouteIngress[],
): IngressStatusProps => {
  return _.find(ingresses, { host: hostname }) as IngressStatusProps;
};

const showCustomRouteHelp = (
  ingress: RouteIngress,
  annotations: RouteKind['metadata']['annotations'],
) => {
  if (!ingress || !_.some(ingress.conditions, { type: 'Admitted', status: 'True' })) {
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

const RouteTargetRow: React.FC<RouteTargetRowProps> = ({ route, target }) => (
  <tr>
    <td>
      <ResourceLink
        kind={target.kind}
        name={target.name}
        namespace={route.metadata.namespace}
        title={target.name}
      />
    </td>
    <td>{target.weight}</td>
    <td>{calcTrafficPercentage(target.weight, route)}</td>
  </tr>
);

const CustomRouteHelp: React.FC<CustomRouteHelpProps> = ({ host, routerCanonicalHostname }) => (
  <Popover
    headerContent={<>Custom Route</>}
    bodyContent={
      <div>
        <p>
          To use a custom route, you must update your DNS provider by creating a canonical name
          (CNAME) record. Your CNAME record should point to your custom domain{' '}
          <strong>{host}</strong>, to the OpenShift canonical router hostname,{' '}
          <strong>{routerCanonicalHostname}</strong>, as the alias.
        </p>
      </div>
    }
  >
    <Button className="pf-m-link--align-left" type="button" variant="link">
      <QuestionCircleIcon /> Do you need to set up custom DNS?
    </Button>
  </Popover>
);

const RouteIngressStatus: React.FC<RouteIngressStatusProps> = ({ route }) => (
  <>
    {_.map(route.status.ingress, (ingress: RouteIngress) => (
      <div key={ingress.routerName} className="co-m-route-ingress-status">
        <SectionHeading text={`Router: ${ingress.routerName}`} />
        <dl>
          <DetailsItem label="Host" obj={route} path="status.ingress.host">
            {ingress.host}
          </DetailsItem>
          <DetailsItem label="Wildcard Policy" obj={route} path="status.ingress.wildcardPolicy">
            {ingress.wildcardPolicy}
          </DetailsItem>
          <DetailsItem
            label="Router Canonical Hostname"
            obj={route}
            path="status.ingress.routerCanonicalHostname"
          >
            {ingress.routerCanonicalHostname || '-'}
            {showCustomRouteHelp(ingress, route.metadata.annotations) && (
              <CustomRouteHelp
                host={ingress.host}
                routerCanonicalHostname={ingress.routerCanonicalHostname}
              />
            )}
          </DetailsItem>
        </dl>
        <h3 className="co-section-heading-secondary">Conditions</h3>
        <Conditions conditions={ingress.conditions} />
      </div>
    ))}
  </>
);

const RouteDetails: React.FC<RoutesDetailsProps> = ({ obj: route }) => {
  const primaryIngressStatus: IngressStatusProps = getIngressStatusForHost(
    route.spec.host,
    route.status.ingress,
  );
  return (
    <>
      <div className="co-m-pane__body">
        <SectionHeading text="Route Details" />
        <RouteCharts namespace={route.metadata.namespace} route={route.metadata.name} />
        <div className="row">
          <div className="col-sm-6">
            <ResourceSummary resource={route}>
              <DetailsItem label={route.spec.to.kind} obj={route} path="spec.to.name">
                <ResourceLink
                  kind={route.spec.to.kind}
                  name={route.spec.to.name}
                  namespace={route.metadata.namespace}
                  title={route.spec.to.name}
                />
              </DetailsItem>
              <DetailsItem label="Target Port" obj={route} path="spec.port.targetPort" />
            </ResourceSummary>
          </div>
          <div className="col-sm-6">
            <dl className="co-m-pane__details">
              <dt>Location</dt>
              <dd>
                <RouteLocation obj={route} />
              </dd>
              <dt>Status</dt>
              <dd>
                <RouteStatus obj={route} />
              </dd>
              <DetailsItem label="Host" obj={route} path="spec.host" />
              <DetailsItem label="Path" obj={route} path="spec.path" />
              {primaryIngressStatus && (
                <DetailsItem
                  label="Router Canonical Hostname"
                  obj={route}
                  path="status.ingress.routerCanonicalHostname"
                >
                  {primaryIngressStatus.routerCanonicalHostname || '-'}
                </DetailsItem>
              )}
              {showCustomRouteHelp(primaryIngressStatus, route.metadata.annotations) && (
                <dd>
                  <CustomRouteHelp
                    host={primaryIngressStatus.host}
                    routerCanonicalHostname={primaryIngressStatus.routerCanonicalHostname}
                  />
                </dd>
              )}
            </dl>
          </div>
        </div>
      </div>
      <div className="co-m-pane__body">
        <SectionHeading text="TLS Settings" />
        <TLSSettings route={route} />
      </div>
      {!_.isEmpty(route.spec.alternateBackends) && (
        <div className="co-m-pane__body">
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
                {_.map(route.spec.alternateBackends, (alternate, i) => (
                  <RouteTargetRow key={i} route={route} target={alternate} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {_.isEmpty(route.status.ingress) ? (
        <div className="cos-status-box">
          <div className="text-center">No Route Status</div>
        </div>
      ) : (
        <div className="co-m-pane__body">
          <RouteIngressStatus route={route} />
        </div>
      )}
    </>
  );
};

export const RoutesDetailsPage: React.FC<RoutesDetailsPageProps> = (props) => (
  <DetailsPage
    {...props}
    getResourceStatus={routeStatus}
    kind={RoutesReference}
    menuActions={menuActions}
    pages={[navFactory.details(detailsPage(RouteDetails)), navFactory.editYaml()]}
  />
);
export const RoutesList: React.FC = (props) => (
  <Table {...props} aria-label="Routes" Header={RouteTableHeader} Row={RouteTableRow} virtualize />
);

const filters = [
  {
    filterGroupName: 'Status',
    type: 'route-status',
    reducer: routeStatus,
    items: [
      { id: 'Accepted', title: 'Accepted' },
      { id: 'Rejected', title: 'Rejected' },
      { id: 'Pending', title: 'Pending' },
    ],
  },
];

export const RoutesPage: React.FC<RoutesPageProps> = (props) => {
  const createProps = {
    to: `/k8s/ns/${props.namespace || 'default'}/routes/~new/form`,
  };

  return (
    <ListPage
      ListComponent={RoutesList}
      kind={RoutesReference}
      canCreate={true}
      createProps={createProps}
      rowFilters={filters}
      {...props}
    />
  );
};

export type RouteHostnameProps = {
  obj: RouteKind;
};

export type RouteStatusProps = {
  obj: RouteKind;
};

export type RouteTargetRowProps = {
  route: RouteKind;
  target: RouteTarget;
};

export type TLSSettingsProps = {
  route: RouteKind;
};

export type RouteHeaderProps = {
  obj: RouteKind;
};

export type RoutesPageProps = {
  obj: RouteKind;
  namespace: string;
};

export type RoutesDetailsProps = {
  obj: RouteKind;
};

export type RoutesDetailsPageProps = {
  match: any;
};

export type RouteIngressStatusProps = {
  route: RouteKind;
};

export type CustomRouteHelpProps = {
  host: string;
  routerCanonicalHostname: string;
};
