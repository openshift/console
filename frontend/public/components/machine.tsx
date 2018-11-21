/* eslint-disable no-undef, no-unused-vars */
import * as React from 'react';
import * as _ from 'lodash-es';

import { MachineModel } from '../models';
import { MachineKind, MachineSetKind, referenceForModel } from '../module/k8s';
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
const machineReference = referenceForModel(MachineModel);
const getAWSPlacement = (machine: MachineKind) => _.get(machine, 'spec.providerConfig.value.placement') || {};

export const getMachineRole = (obj: MachineKind | MachineSetKind) => _.get(obj, ['metadata', 'labels', 'sigs.k8s.io/cluster-api-machine-role']);

const MachineHeader = props => <ListHeader>
  <ColHead {...props} className="col-sm-4 col-xs-6" sortField="metadata.name">Name</ColHead>
  <ColHead {...props} className="col-sm-4 col-xs-6" sortField="metadata.namespace">Namespace</ColHead>
  <ColHead {...props} className="col-sm-2 hidden-xs" sortField="spec.providerConfig.value.placement.region">Region</ColHead>
  <ColHead {...props} className="col-sm-2 hidden-xs" sortField="spec.providerConfig.value.placement.availabilityZone">Availability Zone</ColHead>
</ListHeader>;

const MachineRow: React.SFC<MachineRowProps> = ({obj}: {obj: MachineKind}) => {
  const { availabilityZone, region } = getAWSPlacement(obj);
  return <div className="row co-resource-list__item">
    <div className="col-sm-4 col-xs-6 co-break-word">
      <ResourceLink kind={machineReference} name={obj.metadata.name} namespace={obj.metadata.namespace} title={obj.metadata.name} />
    </div>
    <div className="col-sm-4 col-xs-6 co-break-word">
      <ResourceLink kind="Namespace" name={obj.metadata.namespace} />
    </div>
    <div className="col-sm-2 hidden-xs">
      {region || '-'}
    </div>
    <div className="col-sm-2 hidden-xs">
      {availabilityZone || '-'}
    </div>
    <div className="dropdown-kebab-pf">
      <ResourceKebab actions={menuActions} kind={machineReference} resource={obj} />
    </div>
  </div>;
};

const MachineDetails: React.SFC<MachineDetailsProps> = ({obj}: {obj: MachineKind}) => {
  const nodeName = _.get(obj, 'status.nodeRef.name');
  const machineRole = getMachineRole(obj);
  const { availabilityZone, region } = getAWSPlacement(obj);
  return <React.Fragment>
    <div className="co-m-pane__body">
      <SectionHeading text="Machine Overview" />
      <ResourceSummary resource={obj} showPodSelector={false} showNodeSelector={false}>
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
    canCreate={false}
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
  obj: MachineKind,
};

export type MachineDetailsProps = {
  obj: MachineKind,
};

export type MachinePageProps = {
  showTitle?: boolean,
  namespace?: string,
  selector?: any,
};

export type MachineDetailsPageProps = {
  match: any,
};
