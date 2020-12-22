import * as React from 'react';
import * as _ from 'lodash-es';
import * as classNames from 'classnames';
import { sortable } from '@patternfly/react-table';
import { ClusterServicePlanKind, K8sResourceKindReference } from '../../module/k8s';
import { DetailsPage, ListPage, Table, TableData, TableRow } from '../factory';
import { navFactory, SectionHeading, ResourceSummary, ResourceLink, Timestamp } from '../utils';

const clusterServicePlanReference: K8sResourceKindReference = 'ClusterServicePlan';

const ClusterServicePlanDetails: React.FC<ClusterServicePlanDetailsProps> = ({ obj: clusterServicePlan }) => {
  return (
    <>
      <div className="co-m-pane__body">
        <SectionHeading text="Cluster Service Plan Details" />
        <div className="row">
          <div className="col-md-6">
            <ResourceSummary resource={clusterServicePlan} showPodSelector showNodeSelector></ResourceSummary>
          </div>
          <div className="col-md-6">
            <dl className="co-m-pane__details">
              <dt>BINDABLE</dt>
              <dd>{clusterServicePlan.spec.bindable ? 'True' : 'False'}</dd>
              <dt>EXTERNAL NAME</dt>
              <dd>{clusterServicePlan.spec.externalName}</dd>
              <dt> SERVICE BROKER</dt>
              <dd>{clusterServicePlan.spec.clusterServiceBrokerName}</dd>
              <dt> SERVICE CLASS</dt>
              <dd>{clusterServicePlan.spec.clusterServiceClassRef.name}</dd>
            </dl>
          </div>
        </div>
      </div>
    </>
  );
};

type ClusterServicePlanDetailsProps = {
  obj: ClusterServicePlanKind;
};

const { details } = navFactory;
const ClusterServicePlansDetailsPage: React.FC<ClusterServicePlansDetailsPageProps> = props => <DetailsPage {...props} kind={clusterServicePlanReference} pages={[details(ClusterServicePlanDetails)]} />;
ClusterServicePlansDetailsPage.displayName = 'ClusterServicePlansDetailsPage';

const tableColumnClasses = [
  '', // NAME
  classNames('pf-m-hidden', 'pf-m-visible-on-sm', 'pf-u-w-16-on-lg'), // BINDABLE
  classNames('pf-m-hidden', 'pf-m-visible-on-lg'), // EXTERNAL NAME
  classNames('pf-m-hidden', 'pf-m-visible-on-sm', 'pf-u-w-16-on-lg'), // CLUSTER SERVICE BROKER
  classNames('pf-m-hidden', 'pf-m-visible-on-xl'), // CLUSTER SERVICE CLASS
  classNames('pf-m-hidden', 'pf-m-visible-on-xl'), // CREATED
];

const ClusterServicePlanTableRow = ({ obj, index, key, style }) => {
  return (
    <TableRow id={obj.metadata.uid} index={index} trKey={key} style={style}>
      <TableData className={tableColumnClasses[0]}>
        <ResourceLink kind={clusterServicePlanReference} name={obj.metadata.name} title={obj.metadata.name} />
      </TableData>
      <TableData className={tableColumnClasses[1]}>{obj.spec.bindable ? 'True' : 'False'}</TableData>
      <TableData className={tableColumnClasses[2]}>{obj.spec.externalName}</TableData>
      <TableData className={tableColumnClasses[3]}>
        <ResourceLink kind="ClusterServiceBroker" name={obj.spec.clusterServiceBrokerName} title={obj.spec.clusterServiceBrokerName} />
      </TableData>
      <TableData className={tableColumnClasses[4]}>
        <ResourceLink kind="ClusterServiceClass" name={obj.spec.clusterServiceClassRef.name} title={obj.spec.clusterServiceClassRef.name} />
      </TableData>
      <TableData className={tableColumnClasses[5]}>
        <Timestamp timestamp={obj.metadata.creationTimestamp} />
      </TableData>
    </TableRow>
  );
};

const ClusterServicePlanTableHeader = () => {
  return [
    {
      title: 'Name',
      sortField: 'metadata.name',
      transforms: [sortable],
      props: { className: tableColumnClasses[0] },
    },
    {
      title: 'Bindable',
      sortField: 'spec.bindable',
      transforms: [sortable],
      props: { className: tableColumnClasses[1] },
    },
    {
      title: 'External Name',
      sortField: 'spec.externalName',
      transforms: [sortable],
      props: { className: tableColumnClasses[2] },
    },
    {
      title: 'Cluster Service Broker',
      sortField: 'spec.clusterServiceBrokerName',
      transforms: [sortable],
      props: { className: tableColumnClasses[3] },
    },
    {
      title: 'Cluster Service Class',
      sortField: 'spec.clusterServiceClassRef.name',
      transforms: [sortable],
      props: { className: tableColumnClasses[4] },
    },
    {
      title: 'Created',
      sortField: 'metadata.creationTimestamp',
      transforms: [sortable],
      props: { className: tableColumnClasses[5] },
    },
  ];
};
ClusterServicePlanTableHeader.displayName = 'ClusterServicePlanTableHeader';

const ClusterServicePlansList: React.FC = props => <Table {...props} aria-label="Cluster Service Plan" Header={ClusterServicePlanTableHeader} Row={ClusterServicePlanTableRow} />;
ClusterServicePlansList.displayName = 'ClusterServicePlansList';

const ClusterServicePlansPage: React.FC<ClusterServicePlansPageProps> = props => {
  return <ListPage canCreate={true} kind={clusterServicePlanReference} ListComponent={ClusterServicePlansList} {...props} />;
};
ClusterServicePlansPage.displayName = 'ClusterServicePlansPage';

export { ClusterServicePlansList, ClusterServicePlansPage, ClusterServicePlansDetailsPage };

type ClusterServicePlansPageProps = {};

type ClusterServicePlansDetailsPageProps = {
  match: any;
};
