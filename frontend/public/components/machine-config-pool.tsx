import * as _ from 'lodash-es';
import * as React from 'react';
import { sortable } from '@patternfly/react-table';
import * as classNames from 'classnames';
import { Tooltip } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { PauseCircleIcon, SyncAltIcon } from '@patternfly/react-icons';

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
import { DetailsPage, ListPage, Table, TableData, RowFunctionArgs } from './factory';
import {
  DetailsItem,
  Kebab,
  KebabAction,
  LoadingInline,
  navFactory,
  ResourceKebab,
  ResourceLink,
  ResourceSummary,
  SectionHeading,
  Selector,
  togglePaused,
  WorkloadPausedAlert,
} from './utils';
import { ResourceEventStream } from './events';
import {
  MachineConfigPoolsArePausedAlert,
  UpToDateMessage,
} from './cluster-settings/cluster-settings';

const pauseAction: KebabAction = (kind, obj) => ({
  // t('public~Resume updates')
  // t('public~Pause updates')
  labelKey: obj.spec?.paused ? 'public~Resume updates' : 'public~Pause updates',
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

enum MCPUpdateStatus {
  Paused = 'Paused',
  Updating = 'Updating',
  Updated = 'Updated',
}

const getMachineConfigPoolUpdateStatus = (mcp: MachineConfigPoolKind) => {
  if (mcp.spec?.paused) {
    return MCPUpdateStatus.Paused;
  }
  if (getConditionStatus(mcp, MachineConfigPoolConditionType.Updating) === 'True') {
    return MCPUpdateStatus.Updating;
  }
  if (getConditionStatus(mcp, MachineConfigPoolConditionType.Updated) === 'True') {
    return MCPUpdateStatus.Updated;
  }
  return null;
};

const MachineConfigPoolCharacteristics: React.SFC<MachineConfigPoolCharacteristicsProps> = ({
  obj,
}) => {
  const configuration = _.get(obj, 'status.configuration');
  const maxUnavailable = _.get(obj, 'spec.maxUnavailable', 1);
  const { t } = useTranslation();

  return (
    <dl className="co-m-pane__details">
      <dt>{t('public~Max unavailable machines')}</dt>
      <dd>{maxUnavailable}</dd>
      {configuration && (
        <>
          <dt>{t('public~Current configuration')}</dt>
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
          <dt>{t('public~Current configuration source')}</dt>
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
          <DetailsItem label={t('public~Paused')} obj={obj} path={'spec.paused'}>
            {obj.spec?.paused ? t('public~True') : t('public~False')}
          </DetailsItem>
        </>
      )}
    </dl>
  );
};

const MachineConfigPoolCounts: React.SFC<MachineConfigPoolCountsProps> = ({ obj }) => {
  const { t } = useTranslation();

  return (
    <div className="co-m-pane__body-group">
      <div className="co-detail-table">
        <div className="co-detail-table__row row">
          <div className="co-detail-table__section">
            <dl className="co-m-pane__details">
              <dt className="co-detail-table__section-header">{t('public~Total machine count')}</dt>
              <dd>
                <Tooltip content={t('public~Total number of machines in the machine pool.')}>
                  <span>
                    {obj?.status?.machineCount}{' '}
                    {t('public~machine', { count: obj?.status?.machineCount })}
                  </span>
                </Tooltip>
              </dd>
            </dl>
          </div>
          <div className="co-detail-table__section">
            <dl className="co-m-pane__details">
              <dt className="co-detail-table__section-header">{t('public~Ready machines')}</dt>
              <dd>
                <Tooltip content={t('public~Total number of ready machines targeted by the pool.')}>
                  <span>
                    {obj?.status?.readyMachineCount}{' '}
                    {t('public~machine', { count: obj?.status?.readyMachineCount })}
                  </span>
                </Tooltip>
              </dd>
            </dl>
          </div>
          <div className="co-detail-table__section">
            <dl className="co-m-pane__details">
              <dt className="co-detail-table__section-header">{t('public~Updated count')}</dt>
              <dd>
                <Tooltip
                  content={t(
                    'public~Total number of machines targeted by the pool that have the CurrentMachineConfig as their config.',
                  )}
                >
                  <span>
                    {obj?.status?.updatedMachineCount}{' '}
                    {t('public~machine', { count: obj?.status?.updatedMachineCount })}
                  </span>
                </Tooltip>
              </dd>
            </dl>
          </div>
          <div className="co-detail-table__section co-detail-table__section--last">
            <dl className="co-m-pane__details">
              <dt className="co-detail-table__section-header">{t('public~Unavailable count')}</dt>
              <dd>
                <Tooltip
                  content={t(
                    'public~Total number of unavailable (non-ready) machines targeted by the pool. A node is marked unavailable if it is in updating state or NodeReady condition is false.',
                  )}
                >
                  <span>
                    {obj?.status?.unavailableMachineCount}{' '}
                    {t('public~machine', {
                      count: obj?.status?.unavailableMachineCount,
                    })}
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
  const { t } = useTranslation();
  return (
    <ResourceSummary resource={obj} showNodeSelector nodeSelector="spec.nodeSelector">
      <dt>{t('public~MachineConfig selector')}</dt>
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
  const { t } = useTranslation();
  return (
    <>
      <div className="co-m-pane__body">
        <SectionHeading text={t('public~MachineConfigPool details')} />
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
        <SectionHeading text={t('public~Conditions')} />
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

const MachineConfigPoolUpdateStatus: React.FC<MachineConfigPoolUpdateStatusProps> = ({ obj }) => {
  const { t } = useTranslation();
  switch (getMachineConfigPoolUpdateStatus(obj)) {
    case MCPUpdateStatus.Paused:
      return (
        <>
          <PauseCircleIcon /> {t('public~Paused')}
        </>
      );
    case MCPUpdateStatus.Updating:
      return (
        <>
          <SyncAltIcon className="fa-spin co-icon-space-r" />
          {t('public~Updating')}
        </>
      );
    case MCPUpdateStatus.Updated:
      return <UpToDateMessage />;
    default:
      return <LoadingInline />;
  }
};

export const MachineConfigPoolDetailsPage: React.SFC<any> = (props) => (
  <DetailsPage
    {...props}
    kind={machineConfigPoolReference}
    menuActions={machineConfigPoolMenuActions}
    pages={pages}
  />
);

const tableColumnClasses = [
  '',
  'pf-m-hidden pf-m-visible-on-md pf-u-w-33-on-md',
  '',
  '',
  Kebab.columnClass,
];

const MachineConfigPoolList: React.SFC<any> = (props) => {
  const { t } = useTranslation();
  const MachineConfigPoolTableHeader = () => {
    return [
      {
        title: t('public~Name'),
        sortField: 'metadata.name',
        transforms: [sortable],
        props: { className: tableColumnClasses[0] },
      },
      {
        title: t('public~Configuration'),
        sortField: 'status.configuration.name',
        transforms: [sortable],
        props: { className: tableColumnClasses[1] },
      },
      {
        title: t('public~Degraded'),
        props: { className: tableColumnClasses[2] },
      },
      {
        title: t('public~Update status'),
        props: { className: tableColumnClasses[3] },
      },
      {
        title: '',
        props: { className: tableColumnClasses[4] },
      },
    ];
  };

  const MachineConfigPoolTableRow: React.FC<RowFunctionArgs<MachineConfigPoolKind>> = ({ obj }) => {
    return (
      <>
        <TableData className={classNames(tableColumnClasses[0], 'co-break-word')}>
          <ResourceLink kind={machineConfigPoolReference} name={obj.metadata.name} />
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
        <TableData className={classNames(tableColumnClasses[2], 'co-truncate')}>
          {getConditionStatus(obj, MachineConfigPoolConditionType.Degraded)}
        </TableData>
        <TableData className={tableColumnClasses[3]}>
          <MachineConfigPoolUpdateStatus obj={obj} />
        </TableData>
        <TableData className={tableColumnClasses[4]}>
          <ResourceKebab
            actions={machineConfigPoolMenuActions}
            kind={machineConfigPoolReference}
            resource={obj}
          />
        </TableData>
      </>
    );
  };

  return (
    <>
      <MachineConfigPoolsArePausedAlert machineConfigPools={props.data} />
      <Table
        {...props}
        aria-label={t('public~MachineConfigPools')}
        Header={MachineConfigPoolTableHeader}
        Row={MachineConfigPoolTableRow}
        virtualize
      />
    </>
  );
};

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

type MachineConfigPoolUpdateStatusProps = {
  obj: MachineConfigPoolKind;
};
