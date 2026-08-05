import type { FC } from 'react';
import { useMemo, Suspense } from 'react';
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
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import {
  actionsCellProps,
  getNameCellProps,
  ConsoleDataView,
  nameCellProps,
} from '@console/app/src/components/data-view/ConsoleDataView';
import type { GetDataViewRows } from '@console/app/src/components/data-view/types';
import { useColumnWidthSettings } from '@console/app/src/components/data-view/useResizableColumnProps';
import type { TableColumn } from '@console/dynamic-plugin-sdk';
import { LazyActionMenu } from '@console/shared/src/components/actions/LazyActionMenu';
import PaneBody from '@console/shared/src/components/layout/PaneBody';
import PaneBodyGroup from '@console/shared/src/components/layout/PaneBodyGroup';
import { DASH } from '@console/shared/src/constants/ui';
import { ControlPlaneMachineSetModel } from '../models';
import type { ControlPlaneMachineSetKind } from '../module/k8s';
import { referenceForModel } from '../module/k8s';
import { Conditions } from './conditions';
import { ResourceEventStream } from './events';
import { DetailsPage } from './factory/details';
import { ListPage } from './factory/list-page';
import { MachinePage, machineReference } from './machine';
import type { MachineTabPageProps } from './machine-set';
import { ResourceSummary } from './utils/details-page';
import { SectionHeading } from './utils/headings';
import { navFactory } from './utils/horizontal-nav';
import { ResourceLink, resourcePath } from './utils/resource-link';
import { Selector } from './utils/selector';
import { LoadingBox } from './utils/status-box';

const controlPlaneMachineSetReference = referenceForModel(ControlPlaneMachineSetModel);
const getDesiredReplicas = (resource: ControlPlaneMachineSetKind) => resource.spec.replicas;
const getReadyReplicas = (resource: ControlPlaneMachineSetKind) =>
  resource?.status?.readyReplicas || 0;

const ControlPlaneMachineSetCounts: FC<ControlPlaneMachineSetCountsProps> = ({ resource }) => {
  const { t } = useTranslation('public');

  const desiredReplicas = getDesiredReplicas(resource);
  const replicas = resource?.status?.replicas || 0;
  const readyReplicas = getReadyReplicas(resource);
  const updatedReplicas = resource?.status?.updatedReplicas || 0;
  const unavailableReplicas = resource?.status?.unavailableReplicas || 0;

  return (
    <PaneBodyGroup>
      <DescriptionList className="co-detail-table">
        <Card>
          <DescriptionListTerm>{t('Desired count')}</DescriptionListTerm>
          <DescriptionListDescription>
            <Tooltip content={t('The desired number of replicas.')}>
              <span>
                {`${desiredReplicas}  ${t('machines', {
                  count: desiredReplicas,
                })}`}
              </span>
            </Tooltip>
          </DescriptionListDescription>
        </Card>
        <Card>
          <DescriptionListTerm>{t('Current count')}</DescriptionListTerm>
          <DescriptionListDescription>
            <Tooltip content={t('The most recently observed number of replicas.')}>
              <span>{t('{{replicas}} machines', { replicas, count: replicas })}</span>
            </Tooltip>
          </DescriptionListDescription>
        </Card>
        <Card>
          <DescriptionListTerm>{t('Ready count')}</DescriptionListTerm>
          <DescriptionListDescription>
            <Tooltip content={t('The number of ready replicas for this ControlPlaneMachineSet.')}>
              <span>
                {t('{{readyReplicas}} machines', {
                  readyReplicas,
                  count: readyReplicas,
                })}
              </span>
            </Tooltip>
          </DescriptionListDescription>
        </Card>
        <Card>
          <DescriptionListTerm>{t('Updated count')}</DescriptionListTerm>
          <DescriptionListDescription>
            <Tooltip content={t('The number of updated replicas for this ControlPlaneMachineSet.')}>
              <span>
                {t('{{updatedReplicas}} machines', {
                  updatedReplicas,
                  count: updatedReplicas,
                })}
              </span>
            </Tooltip>
          </DescriptionListDescription>
        </Card>
        <Card>
          <DescriptionListTerm>{t('Unavailable count')}</DescriptionListTerm>
          <DescriptionListDescription>
            <Tooltip
              content={t('The number of unavailable replicas for this ControlPlaneMachineSet.')}
            >
              {unavailableReplicas ? (
                <span>
                  {t('{{unavailableReplicas}} machines', {
                    unavailableReplicas,
                    count: unavailableReplicas,
                  })}
                </span>
              ) : (
                <span>{DASH}</span>
              )}
            </Tooltip>
          </DescriptionListDescription>
        </Card>
      </DescriptionList>
    </PaneBodyGroup>
  );
};

const ControlPlaneMachineSetDetails: FC<ControlPlaneMachineSetDetailsProps> = ({ obj }) => {
  const { t } = useTranslation('public');
  return (
    <>
      <PaneBody>
        <SectionHeading text={t('ControlPlaneMachineSet details')} />
        <ControlPlaneMachineSetCounts resource={obj} />
        <Grid hasGutter>
          <GridItem md={6}>
            <ResourceSummary resource={obj}>
              <DescriptionListGroup>
                <DescriptionListTerm>{t('Selector')}</DescriptionListTerm>
                <DescriptionListDescription>
                  <Selector
                    kind={machineReference}
                    selector={obj.spec.selector}
                    namespace={obj.metadata.namespace}
                  />
                </DescriptionListDescription>
              </DescriptionListGroup>
              <DescriptionListGroup>
                <DescriptionListTerm>{t('Strategy')}</DescriptionListTerm>
                <DescriptionListDescription>
                  {obj.spec?.strategy?.type || DASH}
                </DescriptionListDescription>
              </DescriptionListGroup>
              <DescriptionListGroup>
                <DescriptionListTerm>{t('State')}</DescriptionListTerm>
                <DescriptionListDescription>{obj.spec?.state || DASH}</DescriptionListDescription>
              </DescriptionListGroup>
            </ResourceSummary>
          </GridItem>
        </Grid>
      </PaneBody>
      <PaneBody>
        <SectionHeading text={t('Conditions')} />
        <Conditions conditions={_.get(obj, 'status.conditions')} />
      </PaneBody>
    </>
  );
};

const MachineTabPage: FC<MachineTabPageProps> = ({ obj }) => (
  <MachinePage namespace={obj.metadata.namespace} showTitle={false} selector={obj.spec.selector} />
);

const pages = [
  navFactory.details(ControlPlaneMachineSetDetails),
  navFactory.editYaml(),
  navFactory.machines(MachineTabPage),
  navFactory.events(ResourceEventStream),
];

export const ControlPlaneMachineSetDetailsPage: FC<any> = (props) => (
  <DetailsPage {...props} kind={controlPlaneMachineSetReference} pages={pages} />
);

const tableColumnInfo = [
  { id: 'name' },
  { id: 'namespace' },
  { id: 'machines' },
  { id: 'strategy' },
  { id: 'state' },
  { id: '' },
];

const useControlPlaneMachineSetColumns = (): {
  columns: TableColumn<ControlPlaneMachineSetKind>[];
  resetAllColumnWidths: () => void;
} => {
  const { t } = useTranslation('public');
  const { getResizableProps, resetAllColumnWidths } = useColumnWidthSettings(
    ControlPlaneMachineSetModel,
  );

  const columns: TableColumn<ControlPlaneMachineSetKind>[] = useMemo(
    () => [
      {
        title: t('Name'),
        id: tableColumnInfo[0].id,
        sort: 'metadata.name',
        resizableProps: getResizableProps(tableColumnInfo[0].id),
        props: {
          ...nameCellProps,
          modifier: 'nowrap',
        },
      },
      {
        title: t('Namespace'),
        id: tableColumnInfo[1].id,
        sort: 'metadata.namespace',
        resizableProps: getResizableProps(tableColumnInfo[1].id),
        props: {
          modifier: 'nowrap',
        },
      },
      {
        title: t('Machines'),
        id: tableColumnInfo[2].id,
        sort: 'status.readyReplicas',
        resizableProps: getResizableProps(tableColumnInfo[2].id),
        props: {
          modifier: 'nowrap',
        },
      },
      {
        title: t('Strategy'),
        id: tableColumnInfo[3].id,
        sort: 'spec.strategy.type',
        resizableProps: getResizableProps(tableColumnInfo[3].id),
        props: {
          modifier: 'nowrap',
        },
      },
      {
        title: t('State'),
        id: tableColumnInfo[4].id,
        sort: 'spec.state',
        resizableProps: getResizableProps(tableColumnInfo[4].id),
        props: {
          modifier: 'nowrap',
        },
      },
      {
        title: '',
        id: tableColumnInfo[5].id,
        props: {
          ...actionsCellProps,
        },
      },
    ],
    [t, getResizableProps],
  );

  return { columns, resetAllColumnWidths };
};

export const MachinesCell: FC<MachinesCellProps> = ({ desiredReplicas, readyReplicas, path }) => {
  const { t } = useTranslation('public');
  return (
    <Link to={`${path}/machines`}>
      {t('{{readyReplicas}} of {{count}} machine', {
        readyReplicas,
        count: desiredReplicas,
      })}
    </Link>
  );
};

const getDataViewRows: GetDataViewRows<ControlPlaneMachineSetKind> = (data, columns) =>
  data.map(({ obj }) => {
    const { name, namespace } = obj.metadata;
    const desiredReplicas = getDesiredReplicas(obj);
    const readyReplicas = getReadyReplicas(obj);

    const rowCells = {
      [tableColumnInfo[0].id]: {
        cell: (
          <ResourceLink kind={controlPlaneMachineSetReference} name={name} namespace={namespace} />
        ),
        props: getNameCellProps(name),
      },
      [tableColumnInfo[1].id]: {
        cell: <ResourceLink kind="Namespace" name={namespace} />,
      },
      [tableColumnInfo[2].id]: {
        cell: (
          <MachinesCell
            desiredReplicas={desiredReplicas}
            readyReplicas={readyReplicas}
            path={resourcePath(controlPlaneMachineSetReference, name, namespace)}
          />
        ),
      },
      [tableColumnInfo[3].id]: {
        cell: obj.spec?.strategy?.type || DASH,
      },
      [tableColumnInfo[4].id]: {
        cell: obj.spec?.state || DASH,
      },
      [tableColumnInfo[5].id]: {
        cell: <LazyActionMenu context={{ [controlPlaneMachineSetReference]: obj }} />,
        props: actionsCellProps,
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

const ControlPlaneMachineSetList: FC<ControlPlaneMachineSetListProps> = ({
  data,
  loaded,
  loadError,
  ...props
}) => {
  const { columns, resetAllColumnWidths } = useControlPlaneMachineSetColumns();

  return (
    <Suspense fallback={<LoadingBox />}>
      <ConsoleDataView<ControlPlaneMachineSetKind>
        {...props}
        label={ControlPlaneMachineSetModel.labelPlural}
        data={data}
        loaded={loaded}
        loadError={loadError}
        columns={columns}
        getDataViewRows={getDataViewRows}
        hideColumnManagement
        isResizable
        resetAllColumnWidths={resetAllColumnWidths}
      />
    </Suspense>
  );
};

export const ControlPlaneMachineSetListPage: FC<any> = (props) => (
  <ListPage
    {...props}
    ListComponent={ControlPlaneMachineSetList}
    kind={controlPlaneMachineSetReference}
    canCreate
    omitFilterToolbar
  />
);

type ControlPlaneMachineSetListProps = {
  data: ControlPlaneMachineSetKind[];
  loaded: boolean;
  loadError?: any;
};

type ControlPlaneMachineSetCountsProps = {
  resource: ControlPlaneMachineSetKind;
};

type ControlPlaneMachineSetDetailsProps = {
  obj: ControlPlaneMachineSetKind;
};

export type MachinesCellProps = {
  desiredReplicas: number;
  readyReplicas: number;
  path: string;
};
