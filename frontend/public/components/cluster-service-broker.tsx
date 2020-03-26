import * as React from 'react';
import * as classNames from 'classnames';
import { sortable } from '@patternfly/react-table';
import { DetailsPage, ListPage, Table, TableRow, TableData, RowFunction } from './factory';
import {
  Kebab,
  SectionHeading,
  detailsPage,
  navFactory,
  ResourceLink,
  ResourceKebab,
  ResourceSummary,
  StatusWithIcon,
  Timestamp,
  ExternalLink,
} from './utils';
import { K8sResourceKind, referenceForModel } from '../module/k8s';
import { ClusterServiceBrokerModel } from '../models';
import { Conditions } from './conditions';
import { ClusterServiceClassPage } from './cluster-service-class';

const menuActions = [
  ...Kebab.getExtensionsActionsForKind(ClusterServiceBrokerModel),
  ...Kebab.factory.common,
];

const tableColumnClasses = [
  classNames('col-sm-3', 'col-xs-6'),
  classNames('col-sm-3', 'col-xs-6'),
  classNames('col-sm-3', 'hidden-xs'),
  classNames('col-sm-3', 'hidden-xs'),
  Kebab.columnClass,
];

const ClusterServiceBrokerTableHeader = () => {
  return [
    {
      title: 'Name',
      sortField: 'metadata.name',
      transforms: [sortable],
      props: { className: tableColumnClasses[0] },
    },
    {
      title: 'Status',
      sortFunc: 'serviceCatalogStatus',
      transforms: [sortable],
      props: { className: tableColumnClasses[1] },
    },
    {
      title: 'Relist Behavior',
      sortField: 'spec.relistBehavior',
      transforms: [sortable],
      props: { className: tableColumnClasses[2] },
    },
    {
      title: 'Last Retrieved',
      sortField: 'status.lastCatalogRetrievalTime',
      transforms: [sortable],
      props: { className: tableColumnClasses[3] },
    },
    {
      title: '',
      props: { className: tableColumnClasses[4] },
    },
  ];
};
ClusterServiceBrokerTableHeader.displayName = 'ClusterServiceBrokerTableHeader';

const ClusterServiceBrokerTableRow: RowFunction<K8sResourceKind> = ({
  obj: serviceBroker,
  index,
  key,
  style,
}) => {
  return (
    <TableRow id={serviceBroker.metadata.uid} index={index} trKey={key} style={style}>
      <TableData className={tableColumnClasses[0]}>
        <ResourceLink
          kind={referenceForModel(ClusterServiceBrokerModel)}
          name={serviceBroker.metadata.name}
        />
      </TableData>
      <TableData className={classNames(tableColumnClasses[1], 'co-break-word')}>
        <StatusWithIcon obj={serviceBroker} />
      </TableData>
      <TableData className={tableColumnClasses[2]}>{serviceBroker.spec.relistBehavior}</TableData>
      <TableData className={tableColumnClasses[3]}>
        <Timestamp timestamp={serviceBroker.status.lastCatalogRetrievalTime} />
      </TableData>
      <TableData className={tableColumnClasses[4]}>
        <ResourceKebab
          actions={menuActions}
          kind={referenceForModel(ClusterServiceBrokerModel)}
          resource={serviceBroker}
        />
      </TableData>
    </TableRow>
  );
};

const ClusterServiceBrokerDetails: React.SFC<ClusterServiceBrokerDetailsProps> = ({
  obj: serviceBroker,
}) => {
  return (
    <>
      <div className="co-m-pane__body">
        <SectionHeading text="Service Broker Details" />
        <div className="row">
          <div className="col-md-6">
            <ResourceSummary resource={serviceBroker} />
            <dt>Last Catalog Retrieval Time</dt>
            <dd>
              <Timestamp timestamp={serviceBroker.status.lastCatalogRetrievalTime} />
            </dd>
            {serviceBroker.spec.insecureSkipTLSVerify && <dt>Insecure Skip TLS Verify</dt>}
            {serviceBroker.spec.insecureSkipTLSVerify && (
              <dd>{serviceBroker.spec.insecureSkipTLSVerify}</dd>
            )}
          </div>
          <div className="col-md-6">
            <dl className="co-m-pane__details">
              <dt>Status</dt>
              <dd>
                <StatusWithIcon obj={serviceBroker} />
              </dd>
              <dt>Broker URL</dt>
              <dd>
                <ExternalLink href={serviceBroker.spec.url} text={serviceBroker.spec.url} />
              </dd>
              <dt>Relist Behavior</dt>
              <dd>{serviceBroker.spec.relistBehavior}</dd>
              {serviceBroker.spec.relistBehavior === 'Duration' && (
                <>
                  <dt>Relist Duration</dt>
                  <dd>{serviceBroker.spec.relistDuration || '-'}</dd>
                </>
              )}
            </dl>
          </div>
        </div>
      </div>
      <div className="co-m-pane__body">
        <SectionHeading text="Conditions" />
        <Conditions conditions={serviceBroker.status.conditions} />
      </div>
    </>
  );
};

const ServiceClassTabPage = ({ obj }) => (
  <ClusterServiceClassPage
    showTitle={false}
    fieldSelector={`spec.clusterServiceBrokerName=${obj.metadata.name}`}
  />
);
export const ClusterServiceBrokerDetailsPage: React.SFC<ClusterServiceBrokerDetailsPageProps> = (
  props,
) => (
  <DetailsPage
    {...props}
    kind={referenceForModel(ClusterServiceBrokerModel)}
    menuActions={menuActions}
    pages={[
      navFactory.details(detailsPage(ClusterServiceBrokerDetails)),
      navFactory.editYaml(),
      navFactory.clusterServiceClasses(ServiceClassTabPage),
    ]}
  />
);
export const ClusterServiceBrokerList: React.SFC = (props) => (
  <Table
    {...props}
    aria-label="Cluster Service Brokers"
    Header={ClusterServiceBrokerTableHeader}
    Row={ClusterServiceBrokerTableRow}
    virtualize
  />
);

export const ClusterServiceBrokerPage: React.SFC<ClusterServiceBrokerPageProps> = (props) => (
  <ListPage
    {...props}
    ListComponent={ClusterServiceBrokerList}
    kind={referenceForModel(ClusterServiceBrokerModel)}
    canCreate={true}
    showTitle={false}
  />
);

export type ClusterServiceBrokerPageProps = {
  obj: K8sResourceKind;
};

export type ClusterServiceBrokerDetailsProps = {
  obj: K8sResourceKind;
};

export type ClusterServiceBrokerDetailsPageProps = {
  match: any;
};
