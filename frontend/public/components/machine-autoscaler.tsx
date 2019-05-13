/* eslint-disable no-undef, no-unused-vars */
import * as React from 'react';
import * as _ from 'lodash-es';

import { MachineAutoscalerModel } from '../models';
import { groupVersionFor, K8sResourceKind, referenceForGroupVersionKind, referenceForModel } from '../module/k8s';
import { ColHead, DetailsPage, List, ListHeader, ListPage } from './factory';
import {
  Kebab,
  navFactory,
  ResourceKebab,
  ResourceLink,
  ResourceSummary,
  SectionHeading,
} from './utils';

const { common } = Kebab.factory;
const menuActions = [...common];
const machineAutoscalerReference = referenceForModel(MachineAutoscalerModel);

const MachineAutoscalerTargetLink: React.FC<MachineAutoscalerTargetLinkProps> = ({obj}) => {
  const targetAPIVersion: string = _.get(obj, 'spec.scaleTargetRef.apiVersion');
  const targetKind: string = _.get(obj, 'spec.scaleTargetRef.kind');
  const targetName: string = _.get(obj, 'spec.scaleTargetRef.name');
  if (!targetAPIVersion || !targetKind || !targetName) {
    return <React.Fragment>-</React.Fragment>;
  }

  const groupVersion = groupVersionFor(targetAPIVersion);
  const reference = referenceForGroupVersionKind(groupVersion.group)(groupVersion.version)(targetKind);
  return <ResourceLink kind={reference} name={targetName} namespace={obj.metadata.namespace} />;
};

const MachineAutoscalerHeader: React.FC = props => <ListHeader>
  <ColHead {...props} className="col-md-4 col-sm-4 col-xs-6" sortField="metadata.name">Name</ColHead>
  <ColHead {...props} className="col-md-3 col-sm-4 col-xs-6" sortField="metadata.namespace">Namespace</ColHead>
  <ColHead {...props} className="col-md-3 col-sm-4 hidden-xs" sortField="spec.scaleTargetRef.name">Scale Target</ColHead>
  <ColHead {...props} className="col-md-1 hidden-sm hidden-xs" sortField="spec.minReplicas">Min</ColHead>
  <ColHead {...props} className="col-md-1 hidden-sm hidden-xs" sortField="spec.maxReplicas">Max</ColHead>
</ListHeader>;

const MachineAutoscalerRow: React.FC<MachineAutoscalerRowProps> = ({obj}) => <div className="row co-resource-list__item">
  <div className="col-md-4 col-sm-4 col-xs-6">
    <ResourceLink kind={machineAutoscalerReference} name={obj.metadata.name} namespace={obj.metadata.namespace} />
  </div>
  <div className="col-md-3 col-sm-4 col-xs-6 co-break-word">
    <ResourceLink kind="Namespace" name={obj.metadata.namespace} />
  </div>
  <div className="col-md-3 col-sm-4 hidden-xs co-break-word">
    <MachineAutoscalerTargetLink obj={obj} />
  </div>
  <div className="col-md-1 hidden-sm hidden-xs">
    {_.get(obj, 'spec.minReplicas') || '-'}
  </div>
  <div className="col-md-1 hidden-sm hidden-xs">
    {_.get(obj, 'spec.maxReplicas') || '-'}
  </div>
  <div className="dropdown-kebab-pf">
    <ResourceKebab actions={menuActions} kind={machineAutoscalerReference} resource={obj} />
  </div>
</div>;

const MachineAutoscalerList: React.FC = props =>
  <List
    {...props}
    Header={MachineAutoscalerHeader}
    Row={MachineAutoscalerRow}
  />;

const MachineAutoscalerDetails: React.FC<MachineAutoscalerDetailsProps> = ({obj}) => {
  return <React.Fragment>
    <div className="co-m-pane__body">
      <SectionHeading text="Machine Autoscaler Overview" />
      <ResourceSummary resource={obj}>
        <dt>Scale Target</dt>
        <dd><MachineAutoscalerTargetLink obj={obj} /></dd>
        <dt>Min Replicas</dt>
        <dd>
          {_.get(obj, 'spec.minReplicas') || '-'}
        </dd>
        <dt>Max Replicas</dt>
        <dd>
          {_.get(obj, 'spec.maxReplicas') || '-'}
        </dd>
      </ResourceSummary>
    </div>
  </React.Fragment>;
};

export const MachineAutoscalerPage: React.FC<MachineAutoscalerPageProps> = props =>
  <ListPage
    {...props}
    ListComponent={MachineAutoscalerList}
    kind={machineAutoscalerReference}
    canCreate={true}
  />;

export const MachineAutoscalerDetailsPage: React.FC<MachineAutoscalerDetailsPageProps> = props => <DetailsPage
  {...props}
  menuActions={menuActions}
  kind={machineAutoscalerReference}
  pages={[
    navFactory.details(MachineAutoscalerDetails),
    navFactory.editYaml(),
  ]}
/>;

type MachineAutoscalerRowProps = {
  obj: K8sResourceKind;
};

type MachineAutoscalerPageProps = {
  showTitle?: boolean;
  namespace?: string;
  selector?: any;
};

type MachineAutoscalerTargetLinkProps = {
  obj: K8sResourceKind;
};

export type MachineAutoscalerDetailsProps = {
  obj: K8sResourceKind;
};

export type MachineAutoscalerDetailsPageProps = {
  match: any;
};
