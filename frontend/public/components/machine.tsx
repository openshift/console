import * as React from 'react';
import * as _ from 'lodash-es';
import { sortable } from '@patternfly/react-table';
import * as classNames from 'classnames';
import { getMachineRole, getMachineNodeName, getMachineAWSPlacement } from '@console/shared';
import { MachineModel } from '../models';
import { MachineKind, referenceForModel } from '../module/k8s';
import { Conditions } from './conditions';
import { NodeIPList } from './node';
import { DetailsPage, ListPage, Table, TableRow, TableData } from './factory';
import {
  Kebab,
  NodeLink,
  ResourceKebab,
  ResourceLink,
  ResourceSummary,
  SectionHeading,
  navFactory,
} from './utils';
import { ResourceEventStream } from './events';

const { common } = Kebab.factory;
const menuActions = [...common];
export const machineReference = referenceForModel(MachineModel);

const tableColumnClasses = [
  classNames('col-lg-3', 'col-md-4', 'col-sm-4', 'col-xs-6'),
  classNames('col-lg-2', 'col-md-4', 'col-sm-4', 'col-xs-6'),
  classNames('col-lg-3', 'col-md-4', 'col-sm-4', 'hidden-xs'),
  classNames('col-lg-2', 'hidden-md', 'hidden-sm', 'hidden-xs'),
  classNames('col-lg-2', 'hidden-md', 'hidden-sm', 'hidden-xs'),
  Kebab.columnClass,
];

const MachineTableHeader = () => {
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
      title: 'Node', sortField: 'status.nodeRef.name', transforms: [sortable],
      props: { className: tableColumnClasses[2] },
    },
    {
      title: 'Region', sortField: 'spec.providerSpec.value.placement.region',
      transforms: [sortable], props: { className: tableColumnClasses[3] },
    },
    {
      title: 'Availability Zone', sortField: 'spec.providerSpec.value.placement.availabilityZone',
      transforms: [sortable], props: { className: tableColumnClasses[4] },
    },
    {
      title: '', props: { className: tableColumnClasses[5] },
    },
  ];
};
MachineTableHeader.displayName = 'MachineTableHeader';

const MachineTableRow: React.FC<MachineTableRowProps> = ({obj, index, key, style}) => {
  const { availabilityZone, region } = getMachineAWSPlacement(obj);
  const nodeName = getMachineNodeName(obj);
  return (
    <TableRow id={obj.metadata.uid} index={index} trKey={key} style={style}>
      <TableData className={classNames(tableColumnClasses[0], 'co-break-word')}>
        <ResourceLink kind={machineReference} name={obj.metadata.name} namespace={obj.metadata.namespace} title={obj.metadata.name} />
      </TableData>
      <TableData className={classNames(tableColumnClasses[1], 'co-break-word')}>
        <ResourceLink kind="Namespace" name={obj.metadata.namespace} />
      </TableData>
      <TableData className={tableColumnClasses[2]}>
        {nodeName ? <NodeLink name={nodeName} /> : '-'}
      </TableData>
      <TableData className={tableColumnClasses[3]}>
        {region || '-'}
      </TableData>
      <TableData className={tableColumnClasses[4]}>
        {availabilityZone || '-'}
      </TableData>
      <TableData className={tableColumnClasses[5]}>
        <ResourceKebab actions={menuActions} kind={machineReference} resource={obj} />
      </TableData>
    </TableRow>
  );
};
MachineTableRow.displayName = 'MachineTableRow';
type MachineTableRowProps = {
  obj: MachineKind;
  index: number;
  key: string;
  style: object;
};

const MachineDetails: React.SFC<MachineDetailsProps> = ({obj}: {obj: MachineKind}) => {
  const nodeName = getMachineNodeName(obj);
  const machineRole = getMachineRole(obj);
  const { availabilityZone, region } = getMachineAWSPlacement(obj);
  return <React.Fragment>
    <div className="co-m-pane__body">
      <SectionHeading text="Machine Overview" />
      <ResourceSummary resource={obj}>
        {nodeName && <React.Fragment>
          <dt>Node</dt>
          <dd><NodeLink name={nodeName} /></dd>
        </React.Fragment>}
        {machineRole && <React.Fragment>
          <dt>Machine Role</dt>
          <dd>{machineRole}</dd>
        </React.Fragment>}
        {region && <React.Fragment>
          <dt>AWS Region</dt>
          <dd>{region}</dd>
        </React.Fragment>}
        {availabilityZone && <React.Fragment>
          <dt>AWS Availability Zone</dt>
          <dd>{availabilityZone}</dd>
        </React.Fragment>}
        <dt>Machine Addresses</dt>
        <dd><NodeIPList ips={_.get(obj, 'status.addresses')} expand={true} /></dd>
      </ResourceSummary>
    </div>
    <div className="co-m-pane__body">
      <SectionHeading text="Conditions" />
      <Conditions conditions={_.get(obj, 'status.providerStatus.conditions')} />
    </div>
  </React.Fragment>;
};

export const MachineList: React.SFC = props => <Table {...props} aria-label="Machines" Header={MachineTableHeader} Row={MachineTableRow} virtualize />;

export const MachinePage: React.SFC<MachinePageProps> = props =>
  <ListPage
    {...props}
    ListComponent={MachineList}
    kind={machineReference}
    canCreate
  />;

export const MachineDetailsPage: React.SFC<MachineDetailsPageProps> = props =>
  <DetailsPage
    {...props}
    kind={machineReference}
    menuActions={menuActions}
    pages={[
      navFactory.details(MachineDetails),
      navFactory.editYaml(),
      navFactory.events(ResourceEventStream),
    ]}
  />;

export type MachineDetailsProps = {
  obj: MachineKind;
};

export type MachinePageProps = {
  showTitle?: boolean;
  namespace?: string;
  selector?: any;
};

export type MachineDetailsPageProps = {
  match: any;
};
