import * as _ from 'lodash-es';
import * as React from 'react';
import { sortable } from '@patternfly/react-table';
import * as classNames from 'classnames';
import { Tooltip } from '@patternfly/react-core';

import { Conditions } from './conditions';
import { errorModal } from './modals';
import { MachineConfigPoolModel } from '../models';
import { machineConfigReference, MachineConfigPage } from './machine-config';
import {
  K8sResourceCondition,
  K8sResourceConditionStatus,
  MachineConfigPoolConditionType,
  MachineConfigPoolKind,
  referenceForModel,
} from '../module/k8s';
import { DetailsPage, ListPage, Table, TableRow, TableData, RowFunction } from './factory';
import {
  Kebab,
  KebabAction,
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
import { ResourceEventStream } from './events';

const pauseAction: KebabAction = (kind, obj) => ({
  label: obj.spec.paused ? 'Resume Updates' : 'Pause Updates',
  callback: () => togglePaused(kind, obj).catch((err) => errorModal({ error: err.message })),
  accessReview: {
    group: kind.apiGroup,
    resource: kind.plural,
    name: obj.metadata.name,
    verb: 'patch',
  },
});

const machineConfigPoolReference = referenceForModel(MachineConfigPoolModel);
const machineConfigPoolMenuActions = [
  pauseAction,
  ...Kebab.getExtensionsActionsForKind(MachineConfigPoolModel),
  ...Kebab.factory.common,
];
const getConditionStatus = (
  mcp: MachineConfigPoolKind,
  type: MachineConfigPoolConditionType,
): K8sResourceCondition['status'] => {
  const { conditions } = mcp.status || {};
  const condition = _.find(conditions, { type });
  return condition ? condition.status : K8sResourceConditionStatus.Unknown;
};

const MachineConfigPoolCharacteristics: React.SFC<MachineConfigPoolCharacteristicsProps> = ({
  obj,
}) => {
  const configuration = _.get(obj, 'status.configuration');
  const maxUnavailable = _.get(obj, 'spec.maxUnavailable', 1);
  return (
    <dl className="co-m-pane__details">
      <dt>Max Unavailable Machines</dt>
      <dd>{maxUnavailable}</dd>
      {configuration && (
        <>
          <dt>Current Configuration</dt>
          <dd>
            {configuration.name ? (
              <ResourceLink
                kind={machineConfigReference}
                name={configuration.name}
                title={configuration.name}
              />
            ) : (
              '-'
            )}
          </dd>
          <dt>Current Configuration Source</dt>
          <dd>
            {configuration.source
              ? _.map(configuration.source, ({ apiVersion, kind, name }) => (
                  <ResourceLink
                    key={`${apiVersion}-${kind}-${name}`}
                    kind={machineConfigReference}
                    name={name}
                    title={name}
                  />
                ))
              : '-'}
          </dd>
        </>
      )}
    </dl>
  );
};

const MachineConfigPoolCounts: React.SFC<MachineConfigPoolCountsProps> = ({ obj }) => {
  return (
    <div className="co-m-pane__body-group">
      <div className="co-detail-table">
        <div className="co-detail-table__row row">
          <div className="co-detail-table__section">
            <dl className="co-m-pane__details">
              <dt className="co-detail-table__section-header">Total Machine Count</dt>
              <dd>
                <Tooltip content="Total number of machines in the machine pool.">
                  <span>{pluralize(_.get(obj, 'status.machineCount', 0), 'machine')}</span>
                </Tooltip>
              </dd>
            </dl>
          </div>
          <div className="co-detail-table__section">
            <dl className="co-m-pane__details">
              <dt className="co-detail-table__section-header">Ready Machines</dt>
              <dd>
                <Tooltip content="Total number of ready machines targeted by the pool.">
                  <span>{pluralize(_.get(obj, 'status.readyMachineCount', 0), 'machine')}</span>
                </Tooltip>
              </dd>
            </dl>
          </div>
          <div className="co-detail-table__section">
            <dl className="co-m-pane__details">
              <dt className="co-detail-table__section-header">Updated Count</dt>
              <dd>
                <Tooltip content="Total number of machines targeted by the pool that have the CurrentMachineConfig as their config.">
                  <span>{pluralize(_.get(obj, 'status.updatedMachineCount', 0), 'machine')}</span>
                </Tooltip>
              </dd>
            </dl>
          </div>
          <div className="co-detail-table__section co-detail-table__section--last">
            <dl className="co-m-pane__details">
              <dt className="co-detail-table__section-header">Unavailable Count</dt>
              <dd>
                <Tooltip content="Total number of unavailable (non-ready) machines targeted by the pool. A node is marked unavailable if it is in updating state or NodeReady condition is false.">
                  <span>
                    {pluralize(_.get(obj, 'status.unavailableMachineCount', 0), 'machine')}
                  </span>
                </Tooltip>
              </dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
};

const MachineConfigPoolSummary: React.SFC<MachineConfigPoolSummaryProps> = ({ obj }) => {
  const machineConfigSelector = _.get(obj, 'spec.machineConfigSelector');
  return (
    <ResourceSummary resource={obj} showNodeSelector nodeSelector="spec.nodeSelector">
      <dt>Machine Config Selector</dt>
      <dd>
        <Selector kind={machineConfigReference} selector={machineConfigSelector} />
      </dd>
    </ResourceSummary>
  );
};

const MachineConfigList: React.SFC<MachineConfigListProps> = ({ obj }) => (
  <MachineConfigPage
    canCreate={false}
    showTitle={false}
    selector={_.get(obj, 'spec.machineConfigSelector')}
  />
);

const MachineConfigPoolDetails: React.SFC<MachineConfigPoolDetailsProps> = ({ obj }) => {
  const paused = _.get(obj, 'spec.paused');
  return (
    <>
      <div className="co-m-pane__body">
        <SectionHeading text="Machine Config Pool Details " />
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
    </>
  );
};

const pages = [
  navFactory.details(MachineConfigPoolDetails),
  navFactory.editYaml(),
  navFactory.machineConfigs(MachineConfigList),
  navFactory.events(ResourceEventStream),
];

export const MachineConfigPoolDetailsPage: React.SFC<any> = (props) => (
  <DetailsPage
    {...props}
    kind={machineConfigPoolReference}
    menuActions={machineConfigPoolMenuActions}
    pages={pages}
  />
);

const tableColumnClasses = [
  classNames('col-lg-3', 'col-xs-6', 'col-sm-4'),
  classNames('col-lg-5', 'hidden-md', 'hidden-sm', 'hidden-xs'),
  classNames('col-lg-1', 'col-sm-2', 'col-xs-3', 'pf-u-w-10-on-lg'),
  classNames('col-lg-1', 'col-sm-2', 'hidden-xs', 'pf-u-w-10-on-lg'),
  classNames('col-lg-1', 'hidden-sm', 'hidden-xs', 'pf-u-w-10-on-lg'),
  classNames('col-lg-1', 'col-sm-2', 'col-xs-3', 'pf-u-w-10-on-lg'),
  Kebab.columnClass,
];

const MachineConfigPoolTableHeader = () => {
  return [
    {
      title: 'Name',
      sortField: 'metadata.name',
      transforms: [sortable],
      props: { className: tableColumnClasses[0] },
    },
    {
      title: 'Configuration',
      sortField: 'status.configuration.name',
      transforms: [sortable],
      props: { className: tableColumnClasses[1] },
    },
    {
      title: 'Updated',
      props: { className: tableColumnClasses[2] },
    },
    {
      title: 'Updating',
      props: { className: tableColumnClasses[3] },
    },
    {
      title: 'Paused',
      props: { className: tableColumnClasses[4] },
    },
    {
      title: 'Degraded',
      props: { className: tableColumnClasses[5] },
    },
    {
      title: '',
      props: { className: tableColumnClasses[6] },
    },
  ];
};
MachineConfigPoolTableHeader.displayName = 'MachineConfigPoolTableHeader';

const getMCPPausedState = (obj: MachineConfigPoolKind) => {
  if (_.isUndefined(obj.spec?.paused)) {
    return 'Unknown';
  }
  return obj.spec?.paused ? 'True' : 'False';
};

const MachineConfigPoolTableRow: RowFunction<MachineConfigPoolKind> = ({
  obj,
  index,
  key,
  style,
}) => {
  return (
    <TableRow id={obj.metadata.uid} index={index} trKey={key} style={style}>
      <TableData className={classNames(tableColumnClasses[0], 'co-break-word')}>
        <ResourceLink
          kind={machineConfigPoolReference}
          name={obj.metadata.name}
          title={obj.metadata.name}
        />
      </TableData>
      <TableData className={classNames(tableColumnClasses[1], 'co-break-word')}>
        {_.get(obj, 'status.configuration.name') ? (
          <ResourceLink
            kind={machineConfigReference}
            name={obj.status.configuration.name}
            title={obj.status.configuration.name}
          />
        ) : (
          '-'
        )}
      </TableData>
      <TableData className={tableColumnClasses[2]}>
        {getConditionStatus(obj, MachineConfigPoolConditionType.Updated)}
      </TableData>
      <TableData className={tableColumnClasses[3]}>
        {getConditionStatus(obj, MachineConfigPoolConditionType.Updating)}
      </TableData>
      <TableData className={tableColumnClasses[4]}>{getMCPPausedState(obj)}</TableData>
      <TableData className={classNames(tableColumnClasses[5], 'co-truncate')}>
        {getConditionStatus(obj, MachineConfigPoolConditionType.Degraded)}
      </TableData>
      <TableData className={tableColumnClasses[6]}>
        <ResourceKebab
          actions={machineConfigPoolMenuActions}
          kind={machineConfigPoolReference}
          resource={obj}
        />
      </TableData>
    </TableRow>
  );
};

const MachineConfigPoolList: React.SFC<any> = (props) => (
  <Table
    {...props}
    aria-label="Machine Config Pools"
    Header={MachineConfigPoolTableHeader}
    Row={MachineConfigPoolTableRow}
    virtualize
  />
);

export const MachineConfigPoolPage: React.SFC<any> = (props) => (
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
