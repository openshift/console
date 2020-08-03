import * as _ from 'lodash-es';
import * as React from 'react';
import * as classNames from 'classnames';
import { sortable } from '@patternfly/react-table';

import { DetailsPage, ListPage, Table, TableRow, TableData } from './factory';
import {
  DetailsItem,
  Kebab,
  LabelList,
  ResourceIcon,
  ResourceKebab,
  ResourceLink,
  ResourceSummary,
  SectionHeading,
  Selector,
  navFactory,
} from './utils';
import { ServiceModel } from '../models';

const menuActions = [
  Kebab.factory.ModifyPodSelector,
  ...Kebab.getExtensionsActionsForKind(ServiceModel),
  ...Kebab.factory.common,
];

const ServiceIP = ({ s }) => {
  const children = _.map(s.spec.ports, (portObj, i) => {
    const clusterIP = s.spec.clusterIP === 'None' ? 'None' : `${s.spec.clusterIP}:${portObj.port}`;
    return (
      <div key={i} className="co-truncate co-select-to-copy">
        {clusterIP}
      </div>
    );
  });

  return children;
};

const kind = 'Service';

const tableColumnClasses = [
  classNames('col-lg-3', 'col-md-3', 'col-sm-4', 'col-xs-6'),
  classNames('col-lg-2', 'col-md-3', 'col-sm-4', 'col-xs-6'),
  classNames('col-lg-3', 'col-md-3', 'col-sm-4', 'hidden-xs'),
  classNames('col-lg-2', 'col-md-3', 'hidden-sm', 'hidden-xs'),
  classNames('col-lg-2', 'hidden-md', 'hidden-sm', 'hidden-xs'),
  Kebab.columnClass,
];

const ServiceTableHeader = () => {
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
      title: 'Labels',
      sortField: 'metadata.labels',
      transforms: [sortable],
      props: { className: tableColumnClasses[2] },
    },
    {
      title: 'Pod Selector',
      sortField: 'spec.selector',
      transforms: [sortable],
      props: { className: tableColumnClasses[3] },
    },
    {
      title: 'Location',
      sortField: 'spec.clusterIP',
      transforms: [sortable],
      props: { className: tableColumnClasses[4] },
    },
    {
      title: '',
      props: { className: tableColumnClasses[5] },
    },
  ];
};
ServiceTableHeader.displayName = 'ServiceTableHeader';

const ServiceTableRow = ({ obj: s, index, key, style }) => {
  return (
    <TableRow id={s.metadata.uid} index={index} trKey={key} style={style}>
      <TableData className={tableColumnClasses[0]}>
        <ResourceLink
          kind={kind}
          name={s.metadata.name}
          namespace={s.metadata.namespace}
          title={s.metadata.uid}
        />
      </TableData>
      <TableData
        className={classNames(tableColumnClasses[1], 'co-break-word')}
        columnID="namespace"
      >
        <ResourceLink kind="Namespace" name={s.metadata.namespace} title={s.metadata.namespace} />
      </TableData>
      <TableData className={tableColumnClasses[2]}>
        <LabelList kind={kind} labels={s.metadata.labels} />
      </TableData>
      <TableData className={tableColumnClasses[3]}>
        <Selector selector={s.spec.selector} namespace={s.metadata.namespace} />
      </TableData>
      <TableData className={tableColumnClasses[4]}>
        <ServiceIP s={s} />
      </TableData>
      <TableData className={tableColumnClasses[5]}>
        <ResourceKebab actions={menuActions} kind={kind} resource={s} />
      </TableData>
    </TableRow>
  );
};

const ServiceAddress = ({ s }) => {
  const ServiceIPsRow = (name, desc, ips, note = null) => (
    <div className="co-ip-row">
      <div className="row">
        <div className="col-xs-6">
          <p className="ip-name">{name}</p>
          <p className="ip-desc">{desc}</p>
        </div>
        <div className="col-xs-6">
          {note && <span className="text-muted">{note}</span>}
          {ips.join(', ')}
        </div>
      </div>
    </div>
  );

  const ServiceType = (type) => {
    switch (type) {
      case 'NodePort':
        return ServiceIPsRow(
          'Node Port',
          'Accessible outside the cluster',
          _.map(s.spec.ports, 'nodePort'),
          '(all nodes): ',
        );
      case 'LoadBalancer':
        return ServiceIPsRow(
          'External Load Balancer',
          'Ingress point(s) of load balancer',
          _.map(s.status.loadBalancer.ingress, (i) => i.hostname || i.ip || '-'),
        );
      case 'ExternalName':
        return ServiceIPsRow(
          'External Service Name',
          'Location of the resource that backs the service',
          [s.spec.externalName],
        );
      default:
        return ServiceIPsRow('Cluster IP', 'Accessible within the cluster only', [
          s.spec.clusterIP,
        ]);
    }
  };

  return (
    <div>
      <div className="row co-ip-header">
        <div className="col-xs-6">Type</div>
        <div className="col-xs-6">Location</div>
      </div>
      <div className="rows">
        {ServiceType(s.spec.type)}
        {s.spec.externalIPs &&
          ServiceIPsRow(
            'External IP',
            'IP Address(es) accepting traffic for service',
            s.spec.externalIPs,
          )}
      </div>
    </div>
  );
};

const ServicePortMapping = ({ ports }) => (
  <div>
    <div className="row co-ip-header">
      <div className="col-xs-3">Name</div>
      <div className="col-xs-3">Port</div>
      <div className="col-xs-3">Protocol</div>
      <div className="col-xs-3">Pod Port or Name</div>
    </div>
    <div className="rows">
      {ports.map((portObj, i) => {
        return (
          <div className="co-ip-row" key={i}>
            <div className="row">
              <div className="col-xs-3 co-text-service">
                <p>{portObj.name || '-'}</p>
                {portObj.nodePort && <p className="co-text-node">Node Port</p>}
              </div>
              <div className="col-xs-3 co-text-service">
                <p>
                  <ResourceIcon kind="Service" />
                  <span>{portObj.port}</span>
                </p>
                {portObj.nodePort && (
                  <p className="co-text-node">
                    <ResourceIcon kind="Node" />
                    <span>{portObj.nodePort}</span>
                  </p>
                )}
              </div>
              <div className="col-xs-3">
                <p>{portObj.protocol}</p>
              </div>
              <div className="col-xs-3 co-text-pod">
                <p>
                  <ResourceIcon kind="Pod" />
                  <span>{portObj.targetPort}</span>
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  </div>
);

const Details = ({ obj: s }) => (
  <div className="co-m-pane__body">
    <div className="row">
      <div className="col-sm-6">
        <SectionHeading text="Service Details" />
        <ResourceSummary resource={s} showPodSelector>
          <DetailsItem label="Session Affinity" obj={s} path="spec.sessionAffinity" />
        </ResourceSummary>
      </div>
      <div className="col-sm-6">
        <SectionHeading text="Service Routing" />
        <dl>
          <dt>Service Address</dt>
          <dd className="service-ips">
            <ServiceAddress s={s} />
          </dd>
          <DetailsItem label="Service Port Mapping" obj={s} path="spec.ports">
            <div className="service-ips">
              {s.spec.ports ? <ServicePortMapping ports={s.spec.ports} /> : '-'}
            </div>
          </DetailsItem>
        </dl>
      </div>
    </div>
  </div>
);

const { details, pods, editYaml } = navFactory;
const ServicesDetailsPage = (props) => (
  <DetailsPage
    {...props}
    menuActions={menuActions}
    pages={[details(Details), editYaml(), pods()]}
  />
);

const ServicesList = (props) => (
  <Table
    {...props}
    aria-label="Services"
    Header={ServiceTableHeader}
    Row={ServiceTableRow}
    virtualize
  />
);
const ServicesPage = (props) => (
  <ListPage canCreate={true} ListComponent={ServicesList} {...props} />
);

export { ServicesList, ServicesPage, ServicesDetailsPage };
