/* eslint-disable no-undef, no-unused-vars */
import * as _ from 'lodash-es';
import * as React from 'react';

import { Conditions } from './conditions';
import { errorModal } from './modals';
import { Tooltip } from './utils/tooltip';
import { MachineConfigPoolModel, NodeModel } from '../models';
import { machineConfigReference, MachineConfigPage } from './machine-config';
import {
  K8sResourceConditionStatus,
  MachineConfigPoolConditionType,
  MachineConfigPoolKind,
  referenceForModel,
} from '../module/k8s';
import {
  ColHead,
  DetailsPage,
  List,
  ListHeader,
  ListPage,
} from './factory';
import {
  Kebab,
  navFactory,
  pluralize,
  ResourceKebab,
  ResourceLink,
  ResourceSummary,
  SectionHeading,
  Selector,
  togglePaused,
  WorkloadPausedAlert,
} from './utils';

const pauseAction = (kind, obj) => ({
  label: obj.spec.paused ? 'Resume Updates' : 'Pause Updates',
  callback: () => togglePaused(kind, obj).catch((err) => errorModal({error: err.message})),
});

const machineConfigPoolReference = referenceForModel(MachineConfigPoolModel);
const nodeReference = referenceForModel(NodeModel);
const machineConfigPoolMenuActions = [pauseAction, ...Kebab.factory.common];
const getConditionStatus = (mcp: MachineConfigPoolKind, type: MachineConfigPoolConditionType): K8sResourceConditionStatus => {
  const {conditions} = mcp.status;
  const condition = _.find(conditions, {type});
  return condition ? condition.status : K8sResourceConditionStatus.Unknown;
};

const MachineConfigPoolCharacteristics: React.SFC<MachineConfigPoolCharacteristicsProps> = ({obj}) => {
  const configuration = _.get(obj, 'status.configuration');
  const maxUnavailable = _.get(obj, 'spec.maxUnavailable', 1);
  return <dl className="co-m-pane__details">
    <dt>Max Unavailable Machines</dt>
    <dd>{maxUnavailable}</dd>
    { configuration &&
      <React.Fragment>
        <dt>Current Configuration</dt>
        <dd>
          {
            configuration.name
              ? <ResourceLink kind={machineConfigReference} name={configuration.name} title={configuration.name} />
              : '-'
          }
        </dd>
        <dt>Current Configuration Source</dt>
        <dd>
          {
            configuration.source
              ? _.map(configuration.source, ({apiVersion, kind, name}) =>
                <ResourceLink key={`${apiVersion}-${kind}-${name}`} kind={machineConfigReference} name={name} title={name} />
              )
              : '-'
          }
        </dd>
      </React.Fragment>
    }
  </dl>;
};

const MachineConfigPoolCounts: React.SFC<MachineConfigPoolCountsProps> = ({obj}) => {

  return <div className="co-m-pane__body-group">
    <div className="co-detail-table">
      <div className="co-detail-table__row row">
        <div className="co-detail-table__section">
          <dl className="co-m-pane__details">
            <dt className="co-detail-table__section-header">Total Machine Count</dt>
            <dd>
              <Tooltip content="Total number of machines in the machine pool.">
                {pluralize(_.get(obj, 'status.machineCount', 0), 'machine')}
              </Tooltip>
            </dd>
          </dl>
        </div>
        <div className="co-detail-table__section">
          <dl className="co-m-pane__details">
            <dt className="co-detail-table__section-header">Ready Machines</dt>
            <dd>
              <Tooltip content="Total number of ready machines targeted by the pool.">
                {pluralize(_.get(obj, 'status.readyMachineCount', 0), 'machine')}
              </Tooltip>
            </dd>
          </dl>
        </div>
        <div className="co-detail-table__section">
          <dl className="co-m-pane__details">
            <dt className="co-detail-table__section-header">Updated Count</dt>
            <dd>
              <Tooltip content="Total number of machines targeted by the pool that have the CurrentMachineConfig as their config.">
                {pluralize(_.get(obj, 'status.updatedMachineCount', 0), 'machine')}
              </Tooltip>
            </dd>
          </dl>
        </div>
        <div className="co-detail-table__section co-detail-table__section--last">
          <dl className="co-m-pane__details">
            <dt className="co-detail-table__section-header">Unavailable Count</dt>
            <dd>
              <Tooltip content="Total number of unavailable (non-ready) machines targeted by the pool. A node is marked unavailable if it is in updating state or NodeReady condition is false.">
                {pluralize(_.get(obj, 'status.unavailableMachineCount', 0), 'machine')}
              </Tooltip>
            </dd>
          </dl>
        </div>
      </div>
    </div>
  </div>;
};

const MachineConfigPoolSummary: React.SFC<MachineConfigPoolSummaryProps> = ({obj}) => {
  const machineConfigSelector = _.get(obj, 'spec.machineConfigSelector');
  const machineSelector = _.get(obj, 'spec.machineSelector');
  return <ResourceSummary resource={obj} showNodeSelector={false}>
    <dt>Machine Config Selector</dt>
    <dd>
      <Selector
        kind={machineConfigReference}
        selector={machineConfigSelector}
      />
    </dd>
    <dt>Machine Selector</dt>
    <dd>
      <Selector
        kind={nodeReference}
        selector={machineSelector}
      />
    </dd>
  </ResourceSummary>;
};

const MachineConfigList: React.SFC<MachineConfigListProps> = ({obj}) => (
  <MachineConfigPage canCreate={false} showTitle={false} selector={_.get(obj, 'spec.machineConfigSelector')} />
);

const MachineConfigPoolDetails: React.SFC<MachineConfigPoolDetailsProps> = ({obj}) => {
  const paused = _.get(obj, 'spec.paused');
  return <React.Fragment>
    <div className="co-m-pane__body">
      <SectionHeading text="Machine Config Pool Overview " />
      {paused && <WorkloadPausedAlert model={MachineConfigPoolModel} obj={obj} />}
      <MachineConfigPoolCounts obj={obj} />
      <div className="row">
        <div className="col-sm-6">
          <MachineConfigPoolSummary obj={obj} />
        </div>
        <div className="col-sm-6">
          <MachineConfigPoolCharacteristics obj={obj} />
        </div>
      </div>
    </div>
    <div className="co-m-pane__body">
      <SectionHeading text="Conditions" />
      <Conditions conditions={_.get(obj, 'status.conditions')} />
    </div>
  </React.Fragment>;
};

const pages = [
  navFactory.details(MachineConfigPoolDetails),
  navFactory.editYaml(),
  navFactory.machineConfigs(MachineConfigList),
];

export const MachineConfigPoolDetailsPage: React.SFC<any> = props => (
  <DetailsPage
    {...props}
    kind={machineConfigPoolReference}
    menuActions={machineConfigPoolMenuActions}
    pages={pages}
  />
);

const MachineConfigPoolHeader: React.SFC<any> = props => <ListHeader>
  <ColHead {...props} className="col-xs-6 col-lg-4" sortField="metadata.name">Name</ColHead>
  <ColHead {...props} className="hidden-xs hidden-sm hidden-md col-lg-5" sortField="status.configuration.name">Configuration</ColHead>
  <ColHead {...props} className="col-xs-3  col-sm-2 col-lg-1">Updated</ColHead>
  <ColHead {...props} className="hidden-xs col-sm-2 col-lg-1">Updating</ColHead>
  <ColHead {...props} className="col-xs-3  col-sm-2 col-lg-1">Degraded</ColHead>
</ListHeader>;

const MachineConfigPoolRow: React.SFC<MachineConfigPoolRowProps> = ({obj}) => <div className="row co-resource-list__item">
  <div className="col-xs-6 col-lg-4 co-break-word">
    <ResourceLink kind={machineConfigPoolReference} name={obj.metadata.name} title={obj.metadata.name} />
  </div>
  <div className="hidden-xs hidden-sm hidden-md col-lg-5 co-break-word">
    {_.get(obj, 'status.configuration.name') ? <ResourceLink kind={machineConfigReference} name={obj.status.configuration.name} title={obj.status.configuration.name} /> : '-'}
  </div>
  <div className="col-xs-3  col-sm-2 col-lg-1">
    {getConditionStatus(obj, MachineConfigPoolConditionType.Updated)}
  </div>
  <div className="hidden-xs col-sm-2 col-lg-1">
    {getConditionStatus(obj, MachineConfigPoolConditionType.Updating)}
  </div>
  <div className="col-xs-3  col-sm-2 col-lg-1">
    {getConditionStatus(obj, MachineConfigPoolConditionType.Degraded)}
  </div>

  <div className="dropdown-kebab-pf">
    <ResourceKebab actions={machineConfigPoolMenuActions} kind={machineConfigPoolReference} resource={obj} />
  </div>
</div>;

const MachineConfigPoolList: React.SFC<any> = props => (
  <List
    {...props}
    Header={MachineConfigPoolHeader}
    Row={MachineConfigPoolRow}
  />
);

export const MachineConfigPoolPage: React.SFC<any> = props => (
  <ListPage
    {...props}
    ListComponent={MachineConfigPoolList}
    kind={machineConfigPoolReference}
    canCreate
  />
);

type MachineConfigPoolCountsProps = {
  obj: MachineConfigPoolKind;
};

type MachineConfigPoolDetailsProps = {
  obj: MachineConfigPoolKind;
};

type MachineConfigListProps = {
  obj: MachineConfigPoolKind;
};

type MachineConfigPoolCharacteristicsProps = {
  obj: MachineConfigPoolKind;
};

type MachineConfigPoolSummaryProps = {
  obj: MachineConfigPoolKind;
};

type MachineConfigPoolRowProps = {
  obj: MachineConfigPoolKind;
};
