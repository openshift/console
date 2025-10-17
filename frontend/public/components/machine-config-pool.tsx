import * as _ from 'lodash-es';
import * as React from 'react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
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
import { PauseCircleIcon } from '@patternfly/react-icons/dist/esm/icons/pause-circle-icon';
import { SyncAltIcon } from '@patternfly/react-icons/dist/esm/icons/sync-alt-icon';
import { TableColumn } from '@console/dynamic-plugin-sdk';

import PaneBody from '@console/shared/src/components/layout/PaneBody';
import { useOverlay } from '@console/dynamic-plugin-sdk/src/app/modal-support/useOverlay';
import PaneBodyGroup from '@console/shared/src/components/layout/PaneBodyGroup';
import {
  actionsCellProps,
  cellIsStickyProps,
  getNameCellProps,
  initialFiltersDefault,
  ResourceDataView,
} from '@console/app/src/components/data-view/ResourceDataView';
import { GetDataViewRows } from '@console/app/src/components/data-view/types';
import { Conditions } from './conditions';
import { MachineConfigPoolModel } from '../models';
import { machineConfigReference, MachineConfigPage } from './machine-config';
import {
  K8sModel,
  K8sResourceCondition,
  K8sResourceConditionStatus,
  MachineConfigPoolConditionType,
  MachineConfigPoolKind,
  referenceForModel,
} from '../module/k8s';
import { DetailsPage, ListPage } from './factory';
import { DASH } from '@console/shared/src/constants';
import {
  DetailsItem,
  Kebab,
  KebabAction,
  LoadingBox,
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
import { ErrorModal } from './modals/error-modal';

const usePauseAction = (): KebabAction => {
  const { t } = useTranslation();
  const launchModal = useOverlay();
  return useMemo(
    () => (kind: K8sModel, obj: MachineConfigPoolKind) => ({
      labelKey: obj.spec?.paused ? t('public~Resume updates') : t('public~Pause updates'),
      callback: () =>
        togglePaused(kind, obj).catch((err) => launchModal(ErrorModal, { error: err.message })),
      accessReview: {
        group: kind.apiGroup,
        resource: kind.plural,
        name: obj.metadata.name,
        verb: 'patch',
      },
    }),
    [launchModal, t],
  );
};

const machineConfigPoolReference = referenceForModel(MachineConfigPoolModel);

const useMachineConfigPoolMenuActions = (): KebabAction[] => {
  const pauseAction = usePauseAction();
  return useMemo(() => [pauseAction, ...Kebab.factory.common], [pauseAction]);
};

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

export const MachineConfigPoolDetailsPage: React.FCC<any> = (props) => {
  const machineConfigPoolMenuActions = useMachineConfigPoolMenuActions();
  return (
    <DetailsPage
      {...props}
      kind={machineConfigPoolReference}
      menuActions={machineConfigPoolMenuActions}
      pages={pages}
    />
  );
};

const tableColumnInfo = [
  { id: 'name' },
  { id: 'configuration' },
  { id: 'degraded' },
  { id: 'updateStatus' },
  { id: '' },
];

const useMachineConfigPoolColumns = (): TableColumn<MachineConfigPoolKind>[] => {
  const { t } = useTranslation();
  const columns: TableColumn<MachineConfigPoolKind>[] = React.useMemo(() => {
    return [
      {
        title: t('public~Name'),
        id: tableColumnInfo[0].id,
        sort: 'metadata.name',
        props: {
          ...cellIsStickyProps,
          modifier: 'nowrap',
        },
      },
      {
        title: t('public~Configuration'),
        id: tableColumnInfo[1].id,
        sort: 'status.configuration.name',
        props: {
          modifier: 'nowrap',
        },
      },
      {
        title: t('public~Degraded'),
        id: tableColumnInfo[2].id,
        props: {
          modifier: 'nowrap',
        },
      },
      {
        title: t('public~Update status'),
        id: tableColumnInfo[3].id,
        props: {
          modifier: 'nowrap',
        },
      },
      {
        title: '',
        id: tableColumnInfo[4].id,
        props: {
          ...cellIsStickyProps,
        },
      },
    ];
  }, [t]);
  return columns;
};

const getDataViewRows: GetDataViewRows<MachineConfigPoolKind, KebabAction[]> = (data, columns) => {
  return data.map(({ obj, rowData }) => {
    const { name } = obj.metadata;
    const menuActions = rowData;

    const rowCells = {
      [tableColumnInfo[0].id]: {
        cell: <ResourceLink kind={machineConfigPoolReference} name={name} />,
        props: getNameCellProps(name),
      },
      [tableColumnInfo[1].id]: {
        cell: _.get(obj, 'status.configuration.name') ? (
          <ResourceLink
            kind={machineConfigReference}
            name={obj.status.configuration.name}
            title={obj.status.configuration.name}
          />
        ) : (
          DASH
        ),
      },
      [tableColumnInfo[2].id]: {
        cell: getConditionStatus(obj, MachineConfigPoolConditionType.Degraded),
        props: {
          modifier: 'nowrap',
        },
      },
      [tableColumnInfo[3].id]: {
        cell: <MachineConfigPoolUpdateStatus obj={obj} />,
        props: {
          modifier: 'nowrap',
        },
      },
      [tableColumnInfo[4].id]: {
        cell: (
          <ResourceKebab actions={menuActions} kind={machineConfigPoolReference} resource={obj} />
        ),
        props: {
          ...actionsCellProps,
        },
      },
    };

    return columns.map(({ id }) => {
      const cell = rowCells[id]?.cell || DASH;
      return {
        id,
        props: rowCells[id]?.props,
        cell,
      };
    });
  });
};

const MachineConfigPoolList: React.FC<MachineConfigPoolListProps> = ({
  data,
  loaded,
  loadError,
  ...props
}) => {
  const columns = useMachineConfigPoolColumns();
  const machineConfigPoolMenuActions = useMachineConfigPoolMenuActions();

  return (
    <>
      <MachineConfigPoolsArePausedAlert machineConfigPools={data} />
      <React.Suspense fallback={<LoadingBox />}>
        <ResourceDataView<MachineConfigPoolKind, KebabAction[]>
          {...props}
          label={MachineConfigPoolModel.labelPlural}
          data={data}
          loaded={loaded}
          loadError={loadError}
          columns={columns}
          initialFilters={initialFiltersDefault}
          getDataViewRows={getDataViewRows}
          customRowData={machineConfigPoolMenuActions}
          hideColumnManagement={true}
        />
      </React.Suspense>
    </>
  );
};

export const MachineConfigPoolPage: React.FCC<any> = (props) => (
  <ListPage
    {...props}
    ListComponent={MachineConfigPoolList}
    kind={machineConfigPoolReference}
    canCreate={true}
    omitFilterToolbar={true}
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

type MachineConfigPoolListProps = {
  data: MachineConfigPoolKind[];
  loaded: boolean;
  loadError?: any;
  hideNameLabelFilters?: boolean;
  hideLabelFilter?: boolean;
  hideColumnManagement?: boolean;
};
