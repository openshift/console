import * as React from 'react';
import * as _ from 'lodash-es';

import { MachineModel } from '../models';
import { MachineDeploymentKind, MachineKind, MachineSetKind, referenceForModel } from '../module/k8s';
import { Conditions } from './conditions';
import { NodeIPList } from './node';
import { ColHead, DetailsPage, List, ListHeader, ListPage } from './factory';
import {
  Kebab,
  NodeLink,
  ResourceKebab,
  ResourceLink,
  ResourceSummary,
  SectionHeading,
  navFactory,
} from './utils';
import { breadcrumbsForOwnerRefs } from './utils/breadcrumbs';

const { common } = Kebab.factory;
const menuActions = [...common];
export const machineReference = referenceForModel(MachineModel);
const getAWSPlacement = (machine: MachineKind) => _.get(machine, 'spec.providerSpec.value.placement') || {};

export const getMachineRole = (obj: MachineKind | MachineSetKind | MachineDeploymentKind) => _.get(obj, ['metadata', 'labels', 'sigs.k8s.io/cluster-api-machine-role']);

const getNodeName = (obj) => _.get(obj, 'status.nodeRef.name');

const MachineHeader = props => <ListHeader>
  <ColHead {...props} className="col-lg-3 col-md-4 col-sm-4 col-xs-6" sortField="metadata.name">Name</ColHead>
  <ColHead {...props} className="col-lg-2 col-md-4 col-sm-4 col-xs-6" sortField="metadata.namespace">Namespace</ColHead>
  <ColHead {...props} className="col-lg-3 col-md-4 col-sm-4 hidden-xs" sortField="status.nodeRef.name">Node</ColHead>
  <ColHead {...props} className="col-lg-2 hidden-md hidden-sm hidden-xs" sortField="spec.providerSpec.value.placement.region">Region</ColHead>
  <ColHead {...props} className="col-lg-2 hidden-md hidden-sm hidden-xs" sortField="spec.providerSpec.value.placement.availabilityZone">Availability Zone</ColHead>
</ListHeader>;

const MachineRow: React.SFC<MachineRowProps> = ({obj}: {obj: MachineKind}) => {
  const { availabilityZone, region } = getAWSPlacement(obj);
  const nodeName = getNodeName(obj);

  return <div className="row co-resource-list__item">
    <div className="col-lg-3 col-md-4 col-sm-4 col-xs-6 co-break-word">
      <ResourceLink kind={machineReference} name={obj.metadata.name} namespace={obj.metadata.namespace} title={obj.metadata.name} />
    </div>
    <div className="col-lg-2 col-md-4 col-sm-4 col-xs-6 co-break-word">
      <ResourceLink kind="Namespace" name={obj.metadata.namespace} />
    </div>
    <div className="col-lg-3 col-md-4 col-sm-4 hidden-xs">
      {nodeName ? <NodeLink name={nodeName} /> : '-'}
    </div>
    <div className="col-lg-2 hidden-md hidden-sm hidden-xs">
      {region || '-'}
    </div>
    <div className="col-lg-2 hidden-md hidden-sm hidden-xs">
      {availabilityZone || '-'}
    </div>
    <div className="dropdown-kebab-pf">
      <ResourceKebab actions={menuActions} kind={machineReference} resource={obj} />
    </div>
  </div>;
};

const MachineDetails: React.SFC<MachineDetailsProps> = ({obj}: {obj: MachineKind}) => {
  const nodeName = getNodeName(obj);
  const machineRole = getMachineRole(obj);
  const { availabilityZone, region } = getAWSPlacement(obj);
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

export const MachineList: React.SFC = props =>
  <List
    {...props}
    Header={MachineHeader}
    Row={MachineRow}
  />;

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
    breadcrumbsFor={obj => breadcrumbsForOwnerRefs(obj).concat({
      name: 'Machine Details',
      path: props.match.url,
    })}
    kind={machineReference}
    menuActions={menuActions}
    pages={[navFactory.details(MachineDetails), navFactory.editYaml()]}
  />;

export type MachineRowProps = {
  obj: MachineKind;
};

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
