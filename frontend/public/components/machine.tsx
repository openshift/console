import * as React from 'react';
import { sortable } from '@patternfly/react-table';
import * as classNames from 'classnames';
import {
  getMachineAddresses,
  getMachineInstanceType,
  getMachineNodeName,
  getMachineRegion,
  getMachineRole,
  getMachineZone,
  Status,
  getMachinePhase,
} from '@console/shared';
import { MachineModel } from '../models';
import { MachineKind, referenceForModel } from '../module/k8s';
import { Conditions } from './conditions';
import NodeIPList from '@console/app/src/components/nodes/NodeIPList';
import { DetailsPage, ListPage, Table, TableRow, TableData, RowFunction } from './factory';
import {
  DetailsItem,
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
const menuActions = [...Kebab.getExtensionsActionsForKind(MachineModel), ...common];
export const machineReference = referenceForModel(MachineModel);

const tableColumnClasses = [
  '',
  '',
  classNames('pf-m-hidden', 'pf-m-visible-on-sm'),
  classNames('pf-m-hidden', 'pf-m-visible-on-md'),
  classNames('pf-m-hidden', 'pf-m-visible-on-lg'),
  classNames('pf-m-hidden', 'pf-m-visible-on-xl'),
  classNames('pf-m-hidden', 'pf-m-visible-on-xl'),
  Kebab.columnClass,
];

const MachineTableHeader = () => {
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
    },
    {
      title: 'Node',
      sortField: 'status.nodeRef.name',
      transforms: [sortable],
      props: { className: tableColumnClasses[2] },
    },
    {
      title: 'Phase',
      sortFunc: 'machinePhase',
      transforms: [sortable],
      props: { className: tableColumnClasses[3] },
    },
    {
      title: 'Provider State',
      sortField: 'status.providerStatus.instanceState',
      transforms: [sortable],
      props: { className: tableColumnClasses[4] },
    },
    {
      title: 'Region',
      sortField: "metadata.labels['machine.openshift.io/region']",
      transforms: [sortable],
      props: { className: tableColumnClasses[5] },
    },
    {
      title: 'Availability Zone',
      sortField: "metadata.labels['machine.openshift.io/zone']",
      transforms: [sortable],
      props: { className: tableColumnClasses[6] },
    },
    {
      title: '',
      props: { className: tableColumnClasses[7] },
    },
  ];
};
MachineTableHeader.displayName = 'MachineTableHeader';

const getMachineProviderState = (obj: MachineKind): string =>
  obj?.status?.providerStatus?.instanceState;

const MachineTableRow: RowFunction<MachineKind> = ({ obj, index, key, style }) => {
  const nodeName = getMachineNodeName(obj);
  const region = getMachineRegion(obj);
  const zone = getMachineZone(obj);
  const providerState = getMachineProviderState(obj);
  return (
    <TableRow id={obj.metadata.uid} index={index} trKey={key} style={style}>
      <TableData className={classNames(tableColumnClasses[0], 'co-break-word')}>
        <ResourceLink
          kind={machineReference}
          name={obj.metadata.name}
          namespace={obj.metadata.namespace}
          title={obj.metadata.name}
        />
      </TableData>
      <TableData className={classNames(tableColumnClasses[1], 'co-break-word')}>
        <ResourceLink kind="Namespace" name={obj.metadata.namespace} />
      </TableData>
      <TableData className={tableColumnClasses[2]}>
        {nodeName ? <NodeLink name={nodeName} /> : '-'}
      </TableData>
      <TableData className={tableColumnClasses[3]}>
        <Status status={getMachinePhase(obj)} />
      </TableData>
      <TableData className={tableColumnClasses[4]}>{providerState ?? '-'}</TableData>
      <TableData className={tableColumnClasses[5]}>{region || '-'}</TableData>
      <TableData className={tableColumnClasses[6]}>{zone || '-'}</TableData>
      <TableData className={tableColumnClasses[7]}>
        <ResourceKebab actions={menuActions} kind={machineReference} resource={obj} />
      </TableData>
    </TableRow>
  );
};

const MachineDetails: React.SFC<MachineDetailsProps> = ({ obj }: { obj: MachineKind }) => {
  const nodeName = getMachineNodeName(obj);
  const machineRole = getMachineRole(obj);
  const instanceType = getMachineInstanceType(obj);
  const region = getMachineRegion(obj);
  const zone = getMachineZone(obj);
  const providerState = getMachineProviderState(obj);
  return (
    <>
      <div className="co-m-pane__body">
        <SectionHeading text="Machine Details" />
        <div className="co-m-pane__body-group">
          <div className="row">
            <div className="col-sm-6">
              <ResourceSummary resource={obj} />
            </div>
            <div className="col-sm-6">
              <DetailsItem label="Phase" obj={obj} path="status.phase">
                <Status status={getMachinePhase(obj)} />
              </DetailsItem>
              <DetailsItem
                label="Provider State"
                obj={obj}
                path="status.providerStatus.instanceState"
              >
                {providerState}
              </DetailsItem>
              {nodeName && (
                <>
                  <dt>Node</dt>
                  <dd>
                    <NodeLink name={nodeName} />
                  </dd>
                </>
              )}
              {machineRole && (
                <>
                  <dt>Machine Role</dt>
                  <dd>{machineRole}</dd>
                </>
              )}
              {instanceType && (
                <>
                  <dt>Instance Type</dt>
                  <dd>{instanceType}</dd>
                </>
              )}
              {region && (
                <>
                  <dt>Region</dt>
                  <dd>{region}</dd>
                </>
              )}
              {zone && (
                <>
                  <dt>Availability Zone</dt>
                  <dd>{zone}</dd>
                </>
              )}
              <dt>Machine Addresses</dt>
              <dd>
                <NodeIPList ips={getMachineAddresses(obj)} expand />
              </dd>
            </div>
          </div>
        </div>
      </div>
      <div className="co-m-pane__body">
        <SectionHeading text="Conditions" />
        <Conditions conditions={obj.status?.providerStatus?.conditions} />
      </div>
    </>
  );
};

export const MachineList: React.SFC = (props) => (
  <Table
    {...props}
    aria-label="Machines"
    Header={MachineTableHeader}
    Row={MachineTableRow}
    virtualize
  />
);

export const MachinePage: React.SFC<MachinePageProps> = (props) => (
  <ListPage
    {...props}
    ListComponent={MachineList}
    kind={machineReference}
    textFilter="machine"
    filterLabel="by machine or node name"
    canCreate
  />
);

export const MachineDetailsPage: React.SFC<MachineDetailsPageProps> = (props) => (
  <DetailsPage
    {...props}
    kind={machineReference}
    menuActions={menuActions}
    pages={[
      navFactory.details(MachineDetails),
      navFactory.editYaml(),
      navFactory.events(ResourceEventStream),
    ]}
    getResourceStatus={getMachinePhase}
  />
);

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
