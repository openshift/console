import * as _ from 'lodash-es';
import * as React from 'react';
import { sortable } from '@patternfly/react-table';
import { css } from '@patternfly/react-styles';
import {
  Card,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Grid,
  GridItem,
  Tooltip,
} from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { PauseCircleIcon } from '@patternfly/react-icons/dist/esm/icons/pause-circle-icon';
import { SyncAltIcon } from '@patternfly/react-icons/dist/esm/icons/sync-alt-icon';

import PaneBody from '@console/shared/src/components/layout/PaneBody';
import PaneBodyGroup from '@console/shared/src/components/layout/PaneBodyGroup';
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
import { MachineConfigPoolsArePausedAlert } from './cluster-settings/cluster-settings';
import { UpToDateMessage } from './cluster-settings/cluster-status';

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

const MachineConfigPoolCharacteristics: React.FCC<MachineConfigPoolCharacteristicsProps> = ({
  obj,
}) => {
  const configuration = _.get(obj, 'status.configuration');
  const maxUnavailable = _.get(obj, 'spec.maxUnavailable', 1);
  const { t } = useTranslation();

  return (
    <DescriptionList>
      <DescriptionListGroup>
        <DescriptionListTerm>{t('public~Max unavailable machines')}</DescriptionListTerm>
        <DescriptionListDescription>{maxUnavailable}</DescriptionListDescription>
      </DescriptionListGroup>
      {configuration && (
        <>
          <DescriptionListGroup>
            <DescriptionListTerm>{t('public~Current configuration')}</DescriptionListTerm>
            <DescriptionListDescription>
              {configuration.name ? (
                <ResourceLink
                  kind={machineConfigReference}
                  name={configuration.name}
                  title={configuration.name}
                />
              ) : (
                '-'
              )}
            </DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>{t('public~Current configuration source')}</DescriptionListTerm>
            <DescriptionListDescription>
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
            </DescriptionListDescription>
          </DescriptionListGroup>
          <DetailsItem label={t('public~Paused')} obj={obj} path={'spec.paused'}>
            {obj.spec?.paused ? t('public~True') : t('public~False')}
          </DetailsItem>
        </>
      )}
    </DescriptionList>
  );
};

const MachineConfigPoolCounts: React.FCC<MachineConfigPoolCountsProps> = ({ obj }) => {
  const { t } = useTranslation();

  return (
    <PaneBodyGroup>
      <DescriptionList className="co-detail-table">
        <Card>
          <DescriptionListTerm>{t('public~Total machine count')}</DescriptionListTerm>
          <DescriptionListDescription>
            <Tooltip content={t('public~Total number of machines in the machine pool.')}>
              <span>
                {obj?.status?.machineCount}{' '}
                {t('public~machine', { count: obj?.status?.machineCount })}
              </span>
            </Tooltip>
          </DescriptionListDescription>
        </Card>
        <Card>
          <DescriptionListTerm>{t('public~Ready machines')}</DescriptionListTerm>
          <DescriptionListDescription>
            <Tooltip content={t('public~Total number of ready machines targeted by the pool.')}>
              <span>
                {obj?.status?.readyMachineCount}{' '}
                {t('public~machine', { count: obj?.status?.readyMachineCount })}
              </span>
            </Tooltip>
          </DescriptionListDescription>
        </Card>
        <Card>
          <DescriptionListTerm>{t('public~Updated count')}</DescriptionListTerm>
          <DescriptionListDescription>
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
          </DescriptionListDescription>
        </Card>
        <Card>
          <DescriptionListTerm>{t('public~Unavailable count')}</DescriptionListTerm>
          <DescriptionListDescription>
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
          </DescriptionListDescription>
        </Card>
      </DescriptionList>
    </PaneBodyGroup>
  );
};

const MachineConfigPoolSummary: React.FCC<MachineConfigPoolSummaryProps> = ({ obj }) => {
  const machineConfigSelector = _.get(obj, 'spec.machineConfigSelector');
  const { t } = useTranslation();
  return (
    <ResourceSummary resource={obj} showNodeSelector nodeSelector="spec.nodeSelector">
      <DescriptionListGroup>
        <DescriptionListTerm>{t('public~MachineConfig selector')}</DescriptionListTerm>
        <DescriptionListDescription>
          <Selector kind={machineConfigReference} selector={machineConfigSelector} />
        </DescriptionListDescription>
      </DescriptionListGroup>
    </ResourceSummary>
  );
};

const MachineConfigList: React.FCC<MachineConfigListProps> = ({ obj }) => (
  <MachineConfigPage
    canCreate={false}
    showTitle={false}
    selector={_.get(obj, 'spec.machineConfigSelector')}
  />
);

const MachineConfigPoolDetails: React.FCC<MachineConfigPoolDetailsProps> = ({ obj }) => {
  const paused = _.get(obj, 'spec.paused');
  const { t } = useTranslation();
  return (
    <>
      <PaneBody>
        <SectionHeading text={t('public~MachineConfigPool details')} />
        {paused && <WorkloadPausedAlert model={MachineConfigPoolModel} obj={obj} />}
        <MachineConfigPoolCounts obj={obj} />
        <Grid hasGutter>
          <GridItem sm={6}>
            <MachineConfigPoolSummary obj={obj} />
          </GridItem>
          <GridItem sm={6}>
            <MachineConfigPoolCharacteristics obj={obj} />
          </GridItem>
        </Grid>
      </PaneBody>
      <PaneBody>
        <SectionHeading text={t('public~Conditions')} />
        <Conditions conditions={_.get(obj, 'status.conditions')} />
      </PaneBody>
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
          <SyncAltIcon className="co-spin co-icon-space-r" />
          {t('public~Updating')}
        </>
      );
    case MCPUpdateStatus.Updated:
      return <UpToDateMessage />;
    default:
      return <LoadingInline />;
  }
};

export const MachineConfigPoolDetailsPage: React.FCC<any> = (props) => (
  <DetailsPage
    {...props}
    kind={machineConfigPoolReference}
    menuActions={machineConfigPoolMenuActions}
    pages={pages}
  />
);

const tableColumnClasses = [
  '',
  'pf-m-hidden pf-m-visible-on-md pf-v6-u-w-33-on-md',
  '',
  '',
  Kebab.columnClass,
];

const MachineConfigPoolList: React.FCC<any> = (props) => {
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
        <TableData className={css(tableColumnClasses[0], 'co-break-word')}>
          <ResourceLink kind={machineConfigPoolReference} name={obj.metadata.name} />
        </TableData>
        <TableData className={css(tableColumnClasses[1], 'co-break-word')}>
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
        <TableData className={css(tableColumnClasses[2], 'co-truncate')}>
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

export const MachineConfigPoolPage: React.FCC<any> = (props) => (
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
