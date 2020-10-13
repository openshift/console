import * as _ from 'lodash-es';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
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
          t('network-service~Node port'),
          t('network-service~Accessible outside the cluster'),
          _.map(s.spec.ports, 'nodePort'),
          t('network-service~(all nodes): '),
        );
      case 'LoadBalancer':
        return ServiceIPsRow(
          t('network-service~External load balancer'),
          t('network-service~Ingress points of load balancer'),
          _.map(s.status.loadBalancer.ingress, (i) => i.hostname || i.ip || '-'),
        );
      case 'ExternalName':
        return ServiceIPsRow(
          t('network-service~External service name'),
          t('network-service~Location of the resource that backs the service'),
          [s.spec.externalName],
        );
      default:
        return ServiceIPsRow(
          t('network-service~Cluster IP'),
          t('network-service~Accessible within the cluster only'),
          [s.spec.clusterIP],
        );
    }
  };

  return (
    <div>
      <div className="row co-ip-header">
        <div className="col-xs-6">{t('network-service~Type')}</div>
        <div className="col-xs-6">{t('network-service~Location')}</div>
      </div>
      <div className="rows">
        {ServiceType(s.spec.type)}
        {s.spec.externalIPs &&
          ServiceIPsRow(
            t('network-service~External IP'),
            t('network-service~IP Addresses accepting traffic for service'),
            s.spec.externalIPs,
          )}
      </div>
    </div>
  );
};

const ServicePortMapping = ({ ports }) => {
  const { t } = useTranslation();
  return (
    <div>
      <div className="row co-ip-header">
        <div className="col-xs-3">{t('network-service~Name')}</div>
        <div className="col-xs-3">{t('network-service~Port')}</div>
        <div className="col-xs-3">{t('network-service~Protocol')}</div>
        <div className="col-xs-3">{t('network-service~Pod port or name')}</div>
      </div>
      <div className="rows">
        {ports.map((portObj, i) => {
          return (
            <div className="co-ip-row" key={i}>
              <div className="row">
                <div className="col-xs-3 co-text-service">
                  <p>{portObj.name || '-'}</p>
                  {portObj.nodePort && (
                    <p className="co-text-node">{t('network-service~Node port')}</p>
                  )}
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
};

const Details = ({ obj: s }) => {
  const { t } = useTranslation();
  return (
    <div className="co-m-pane__body">
      <div className="row">
        <div className="col-sm-6">
          <SectionHeading text={t('network-service~Service details')} />
          <ResourceSummary resource={s} showPodSelector>
            <DetailsItem
              label={t('network-service~Session affinity')}
              obj={s}
              path="spec.sessionAffinity"
            />
          </ResourceSummary>
        </div>
        <div className="col-sm-6">
          <SectionHeading text={t('network-service~Service routing')} />
          <dl>
            <dt>{t('network-service~Service address')}</dt>
            <dd className="service-ips">
              <ServiceAddress s={s} />
            </dd>
            <DetailsItem
              label={t('network-service~Service port mapping')}
              obj={s}
              path="spec.ports"
            >
              <div className="service-ips">
                {s.spec.ports ? <ServicePortMapping ports={s.spec.ports} /> : '-'}
              </div>
            </DetailsItem>
          </dl>
        </div>
      </div>
    </div>
  );
};

const { details, pods, editYaml } = navFactory;
const ServicesDetailsPage = (props) => (
  <DetailsPage
    {...props}
    menuActions={menuActions}
    pages={[details(Details), editYaml(), pods()]}
  />
);

const ServicesList = (props) => {
  const { t } = useTranslation();
  const ServiceTableHeader = () => {
    return [
      {
        title: t('network-service~Name'),
        sortField: 'metadata.name',
        transforms: [sortable],
        props: { className: tableColumnClasses[0] },
      },
      {
        title: t('network-service~Namespace'),
        sortField: 'metadata.namespace',
        transforms: [sortable],
        props: { className: tableColumnClasses[1] },
        id: 'namespace',
      },
      {
        title: t('network-service~Labels'),
        sortField: 'metadata.labels',
        transforms: [sortable],
        props: { className: tableColumnClasses[2] },
      },
      {
        title: t('network-service~Pod selector'),
        sortField: 'spec.selector',
        transforms: [sortable],
        props: { className: tableColumnClasses[3] },
      },
      {
        title: t('network-service~Location'),
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
  return (
    <Table
      {...props}
      aria-label={t('network-service~Services')}
      Header={ServiceTableHeader}
      Row={ServiceTableRow}
      virtualize
    />
  );
};

const ServicesPage = (props) => (
  <ListPage canCreate={true} ListComponent={ServicesList} {...props} />
);

export { ServicesList, ServicesPage, ServicesDetailsPage };
