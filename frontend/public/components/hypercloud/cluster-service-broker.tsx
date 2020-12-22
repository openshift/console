import * as React from 'react';
import * as _ from 'lodash-es';
import { Status } from '@console/shared';
import { sortable } from '@patternfly/react-table';
import { ClusterServiceBrokerModel } from '../../models';
import { ClusterServiceBrokerKind, K8sResourceKindReference } from '../../module/k8s';
import { DetailsPage, ListPage, Table, TableData, TableRow } from '../factory';
import { DetailsItem, Kebab, navFactory, SectionHeading, ResourceSummary, ResourceLink, ResourceKebab, Timestamp } from '../utils';

const clusterServiceBrokerReference: K8sResourceKindReference = 'ClusterServiceBroker';
const { common } = Kebab.factory;

export const clusterServiceBrokerMenuActions = [...Kebab.getExtensionsActionsForKind(ClusterServiceBrokerModel), ...common];
const ClusterServiceBrokerDetails: React.FC<ClusterServiceBrokerDetailsProps> = ({ obj: clusterServiceBroker }) => {
  return (
    <>
      <div className="co-m-pane__body">
        <SectionHeading text="Cluster Service Broker Details" />
        <div className="row">
          <div className="col-md-6">
            <ResourceSummary resource={clusterServiceBroker} showPodSelector showNodeSelector></ResourceSummary>
          </div>
          <div className="col-md-6">
            <dl className="co-m-pane__details">
              <DetailsItem label="Status" obj={clusterServiceBroker} path="status.phase">
                <Status status={ClusterServiceBrokerPhase(clusterServiceBroker)} />
              </DetailsItem>
              <dt>URL</dt>
              <dd>{clusterServiceBroker.spec.url}</dd>
            </dl>
          </div>
        </div>
      </div>
    </>
  );
};

type ClusterServiceBrokerDetailsProps = {
  obj: ClusterServiceBrokerKind;
};

const { details, editYaml } = navFactory;
const ClusterServiceBrokersDetailsPage: React.FC<ClusterServiceBrokersDetailsPageProps> = props => <DetailsPage {...props} kind={clusterServiceBrokerReference} menuActions={clusterServiceBrokerMenuActions} pages={[details(ClusterServiceBrokerDetails), editYaml()]} />;
ClusterServiceBrokersDetailsPage.displayName = 'ClusterServiceBrokersDetailsPage';

const kind = 'ClusterServiceBroker';
const tableColumnClasses = ['', '', '', '', ''];

const ClusterServiceBrokerPhase = instance => {
  let phase = '';
  if (instance.status) {
    instance.status.conditions.forEach(cur => {
      if (cur.type === 'Ready') {
        if (cur.status === 'True') {
          phase = 'Running';
        } else {
          phase = 'Error';
        }
      }
    });
    return phase;
  }
};

const ClusterServiceBrokerTableRow = ({ obj, index, key, style }) => {
  let phase = ClusterServiceBrokerPhase(obj);
  return (
    <TableRow id={obj.metadata.uid} index={index} trKey={key} style={style}>
      <TableData className={tableColumnClasses[0]}>
        <ResourceLink kind={clusterServiceBrokerReference} name={obj.metadata.name} title={obj.metadata.name} />
      </TableData>
      <TableData className={tableColumnClasses[1]}>{obj.spec.url}</TableData>
      <TableData className={tableColumnClasses[2]}>
        <Status status={phase} />
      </TableData>
      <TableData className={tableColumnClasses[3]}>
        <Timestamp timestamp={obj.metadata.creationTimestamp} />
      </TableData>
      <TableData className={tableColumnClasses[4]}>
        <ResourceKebab actions={clusterServiceBrokerMenuActions} kind={kind} resource={obj} />
      </TableData>
    </TableRow>
  );
};

const ClusterServiceBrokerTableHeader = () => {
  return [
    {
      title: 'Name',
      sortField: 'metadata.name',
      transforms: [sortable],
      props: { className: tableColumnClasses[0] },
    },
    {
      title: 'Url',
      sortField: 'spec.url',
      transforms: [sortable],
      props: { className: tableColumnClasses[1] },
    },
    {
      title: 'Status',
      sortFunc: 'ServiceBrokerPhase',
      transforms: [sortable],
      props: { className: tableColumnClasses[2] },
    },
    {
      title: 'Created',
      sortField: 'metadata.creationTimestamp',
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

const ClusterServiceBrokersList: React.FC = props => <Table {...props} aria-label="Cluster Service Broker" Header={ClusterServiceBrokerTableHeader} Row={ClusterServiceBrokerTableRow} virtualize />;
ClusterServiceBrokersList.displayName = 'ClusterServiceBrokersList';

const ClusterServiceBrokersPage: React.FC<ClusterServiceBrokersPage> = props => {
  return <ListPage canCreate={true} kind={clusterServiceBrokerReference} ListComponent={ClusterServiceBrokersList} {...props} />;
};
ClusterServiceBrokersPage.displayName = 'ClusterServiceBrokersPage';

export { ClusterServiceBrokersList, ClusterServiceBrokersPage, ClusterServiceBrokersDetailsPage };

type ClusterServiceBrokersPage = {};

type ClusterServiceBrokersDetailsPageProps = {
  match: any;
};
