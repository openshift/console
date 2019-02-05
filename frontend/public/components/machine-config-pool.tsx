/* eslint-disable no-undef, no-unused-vars */
import * as _ from 'lodash-es';
import * as React from 'react';
import { Link } from 'react-router-dom';

import { MachineConfigPoolModel } from '../models';
import { referenceForModel, MachineConfigPoolKind } from '../module/k8s';
import { machineConfigReference, MachineConfigPage } from './machine-config';
import { Tooltip } from './utils/tooltip';
import { Conditions } from './conditions';
import { errorModal } from './modals';
import { machineReference, MachinePage } from './machine';
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
  resourcePath,
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
const machineConfigPoolMenuActions = [pauseAction, ...Kebab.factory.common];

const MachineConfigPoolCharacteristics: React.SFC<MachineConfigPoolCharacteristicsProps> = ({obj}) => {
  const { maxUnavailable } = obj.spec;
  const { configuration } = obj.status;
  return <dl className="co-m-pane__details">
    <dt>Max Unavailable Machines</dt>
    <dd>{maxUnavailable || 1}</dd>
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
              ? _.map(configuration.source, mc =>
                <ResourceLink kind={machineConfigReference} name={mc.name} title={mc.name} />
              )
              : '-'
          }
        </dd>
      </React.Fragment>
    }
  </dl>;
};

const MachineConfigPoolCounts: React.SFC<MachineConfigPoolCountsProps> = ({obj}) => {
  const { machineCount, readyMachineCount, updatedMachineCount, unavailableMachineCount } = obj.status;
  return <div className="co-m-pane__body-group">
    <div className="co-detail-table">
      <div className="co-detail-table__row row">
        <div className="co-detail-table__section">
          <dl className="co-m-pane__details">
            <dt className="co-detail-table__section-header">Total Machine Count</dt>
            <dd>
              <Tooltip content="Total number of machines in the machine pool.">
                {pluralize(machineCount, 'machine')}
              </Tooltip>
            </dd>
          </dl>
        </div>
        <div className="co-detail-table__section">
          <dl className="co-m-pane__details">
            <dt className="co-detail-table__section-header">Ready Machines</dt>
            <dd>
              <Tooltip content="Total number of ready machines targeted by the pool.">
                {pluralize(readyMachineCount, 'machine')}
              </Tooltip>
            </dd>
          </dl>
        </div>
        <div className="co-detail-table__section">
          <dl className="co-m-pane__details">
            <dt className="co-detail-table__section-header">Updated Count</dt>
            <dd>
              <Tooltip content="Total number of machines targeted by the pool that have the CurrentMachineConfig as their config.">
                {pluralize(updatedMachineCount, 'machine')}
              </Tooltip>
            </dd>
          </dl>
        </div>
        <div className="co-detail-table__section co-detail-table__section--last">
          <dl className="co-m-pane__details">
            <dt className="co-detail-table__section-header">Unavailable Count</dt>
            <dd>
              <Tooltip content="Total number of unavailable (non-ready) machines targeted by the pool. A node is marked unavailable if it is in updating state or NodeReady condition is false.">
                {pluralize(unavailableMachineCount, 'machine')}
              </Tooltip>
            </dd>
          </dl>
        </div>
      </div>
    </div>
  </div>;
};

const MachineConfigPoolSummary: React.SFC<MachineConfigPoolSummaryProps> = ({obj}) => {
  const { machineConfigSelector, machineSelector } = obj.spec;
  return <ResourceSummary resource={obj} showPodSelector={false} showNodeSelector={false}>
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
        kind={machineReference}
        selector={machineSelector}
      />
    </dd>
  </ResourceSummary>;
};

const MachineList: React.SFC<MachineListProps> = ({obj}) => (
  <MachinePage showTitle={false} selector={obj.spec.machineSelector} />
);

const MachineConfigList: React.SFC<MachineConfigListProps> = ({obj}) => (
  <MachineConfigPage canCreate={false} showTitle={false} selector={obj.spec.machineConfigSelector} />
);

const MachineConfigPoolDetails: React.SFC<MachineConfigPoolDetailsProps> = ({obj}) => {
  const { paused } = obj.spec;
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
  navFactory.machines(MachineList),
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
  <ColHead {...props} className="col-xs-6 col-sm-4" sortField="metadata.name">Name</ColHead>
  <ColHead {...props} className="hidden-xs col-sm-5" sortField="status.configuration.name">Configuration</ColHead>
  <ColHead {...props} className="col-xs-6 col-sm-3" sortField="status.readyMachines">Machines</ColHead>
</ListHeader>;

const MachineConfigPoolRow: React.SFC<MachineConfigPoolRowProps> = ({obj}) => <div className="row co-resource-list__item">
  <div className="col-xs-6 col-sm-4 co-break-word">
    <ResourceLink kind={machineConfigPoolReference} name={obj.metadata.name} title={obj.metadata.name} />
  </div>
  <div className="hidden-xs col-sm-5 co-break-word">
    {_.get(obj, 'status.configuration.name') ? <ResourceLink kind={machineConfigReference} name={obj.status.configuration.name} title={obj.status.configuration.name} /> : '-'}
  </div>
  <div className="col-xs-6 col-sm-3">
    <Link to={`${resourcePath(machineConfigPoolReference, obj.metadata.name)}/machines`}>
      {obj.status.readyMachineCount} of {obj.status.machineCount} machines
    </Link>
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

type MachineListProps = {
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
