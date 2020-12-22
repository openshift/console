import * as _ from 'lodash-es';
import * as React from 'react';
import * as classNames from 'classnames';
import { sortable } from '@patternfly/react-table';

import { K8sResourceKind } from '../../module/k8s';
import { DetailsPage, ListPage, Table, TableRow, TableData, RowFunction } from '../factory';
import { Kebab, KebabAction, detailsPage, Timestamp, navFactory, ResourceKebab, ResourceLink, ResourceSummary, SectionHeading } from '../utils';
import { Status } from '@console/shared';
import { GatewayModel } from '../../models';

export const menuActions: KebabAction[] = [...Kebab.getExtensionsActionsForKind(GatewayModel), ...Kebab.factory.common];

const kind = GatewayModel.kind;

const tableColumnClasses = ['', '', classNames('pf-m-hidden', 'pf-m-visible-on-sm', 'pf-u-w-16-on-lg'), Kebab.columnClass];

const GatewayTableHeader = () => {
  return [
    {
      title: 'Name',
      sortField: 'metadata.name',
      transforms: [sortable],
      props: { className: tableColumnClasses[0] },
    },
    {
      title: 'Namespace',
      sortFunc: 'metadata.namespace',
      transforms: [sortable],
      props: { className: tableColumnClasses[1] },
    },
    {
      title: 'Created',
      sortField: 'metadata.creationTimestamp',
      transforms: [sortable],
      props: { className: tableColumnClasses[2] },
    },
    {
      title: '',
      props: { className: tableColumnClasses[3] },
    },
  ];
};
GatewayTableHeader.displayName = 'GatewayTableHeader';

const GatewayTableRow: RowFunction<K8sResourceKind> = ({ obj: gateway, index, key, style }) => {
  return (
    <TableRow id={gateway.metadata.uid} index={index} trKey={key} style={style}>
      <TableData className={tableColumnClasses[0]}>
        <ResourceLink kind={kind} name={gateway.metadata.name} namespace={gateway.metadata.namespace} title={gateway.metadata.uid} />
      </TableData>
      <TableData className={tableColumnClasses[1]}>
        <Status status={gateway.metadata.namespace} />
      </TableData>
      <TableData className={tableColumnClasses[2]}>
        <Timestamp timestamp={gateway.metadata.creationTimestamp} />
      </TableData>
      <TableData className={tableColumnClasses[3]}>
        <ResourceKebab actions={menuActions} kind={kind} resource={gateway} />
      </TableData>
    </TableRow>
  );
};

const GatewayDetails: React.FC<GatewayDetailsProps> = ({ obj: gateway }) => (
  <>
    <div className="co-m-pane__body">
      <SectionHeading text="Gateway Details" />
      <div className="row">
        <div className="col-lg-6">
          <ResourceSummary resource={gateway} />
        </div>
      </div>
    </div>
    <div className="co-m-pane__body">
    </div>
  </>
);

const { details, editYaml } = navFactory;
export const Gateways: React.FC = props => <Table {...props} aria-label="Gateways" Header={GatewayTableHeader} Row={GatewayTableRow} virtualize />;

export const GatewaysPage: React.FC<GatewaysPageProps> = props => <ListPage canCreate={true} ListComponent={Gateways} kind={kind} {...props} />;

export const GatewaysDetailsPage: React.FC<GatewaysDetailsPageProps> = props => <DetailsPage {...props} kind={kind} menuActions={menuActions} pages={[details(detailsPage(GatewayDetails)), editYaml()]} />;

type GatewayDetailsProps = {
  obj: K8sResourceKind;
};

type GatewaysPageProps = {
  showTitle?: boolean;
  namespace?: string;
  selector?: any;
};

type GatewaysDetailsPageProps = {
  match: any;
};