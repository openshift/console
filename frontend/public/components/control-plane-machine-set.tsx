import * as _ from 'lodash-es';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
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
import PaneBody from '@console/shared/src/components/layout/PaneBody';
import PaneBodyGroup from '@console/shared/src/components/layout/PaneBodyGroup';
import { DASH } from '@console/shared/src/constants';
import { TableColumn } from '@console/dynamic-plugin-sdk';
import {
  actionsCellProps,
  cellIsStickyProps,
  getNameCellProps,
  initialFiltersDefault,
  ConsoleDataView,
} from '@console/app/src/components/data-view/ConsoleDataView';
import { GetDataViewRows } from '@console/app/src/components/data-view/types';

import { Conditions } from './conditions';
import { ControlPlaneMachineSetModel } from '../models';
import { ControlPlaneMachineSetKind, referenceForModel } from '../module/k8s';
import { DetailsPage, ListPage } from './factory';
import {
  Kebab,
  LoadingBox,
  navFactory,
  ResourceKebab,
  ResourceLink,
  resourcePath,
  ResourceSummary,
  SectionHeading,
  Selector,
} from './utils';
import { ResourceEventStream } from './events';
import { MachinePage, machineReference } from './machine';
import { MachineTabPageProps } from './machine-set';

const controlPlaneMachineSetReference = referenceForModel(ControlPlaneMachineSetModel);
const controlPlaneMachineSetMenuActions = [...Kebab.factory.common];
const getDesiredReplicas = (resource: ControlPlaneMachineSetKind) => {
  return resource.spec.replicas;
};
const getReadyReplicas = (resource: ControlPlaneMachineSetKind) => {
  return resource?.status?.readyReplicas || 0;
};

const ControlPlaneMachineSetCounts: React.FC<ControlPlaneMachineSetCountsProps> = ({
  resource,
}) => {
  const { t } = useTranslation();

  const desiredReplicas = getDesiredReplicas(resource);
  const replicas = resource?.status?.replicas || 0;
  const readyReplicas = getReadyReplicas(resource);
  const updatedReplicas = resource?.status?.updatedReplicas || 0;
  const unavailableReplicas = resource?.status?.unavailableReplicas || 0;

  return (
    <PaneBodyGroup>
      <DescriptionList className="co-detail-table">
        <Card>
          <DescriptionListTerm>{t('public~Desired count')}</DescriptionListTerm>
          <DescriptionListDescription>
            <Tooltip content={t('public~The desired number of replicas.')}>
              <span>
                {`${desiredReplicas}  ${t('public~machines', {
                  count: desiredReplicas,
                })}`}
              </span>
            </Tooltip>
          </DescriptionListDescription>
        </Card>
        <Card>
          <DescriptionListTerm>{t('public~Current count')}</DescriptionListTerm>
          <DescriptionListDescription>
            <Tooltip content={t('public~The most recently observed number of replicas.')}>
              <span>{t('public~{{replicas}} machines', { replicas, count: replicas })}</span>
            </Tooltip>
          </DescriptionListDescription>
        </Card>
        <Card>
          <DescriptionListTerm>{t('public~Ready count')}</DescriptionListTerm>
          <DescriptionListDescription>
            <Tooltip
              content={t('public~The number of ready replicas for this ControlPlaneMachineSet.')}
            >
              <span>
                {t('public~{{readyReplicas}} machines', {
                  readyReplicas,
                  count: readyReplicas,
                })}
              </span>
            </Tooltip>
          </DescriptionListDescription>
        </Card>
        <Card>
          <DescriptionListTerm>{t('public~Updated count')}</DescriptionListTerm>
          <DescriptionListDescription>
            <Tooltip
              content={t('public~The number of updated replicas for this ControlPlaneMachineSet.')}
            >
              <span>
                {t('public~{{updatedReplicas}} machines', {
                  updatedReplicas,
                  count: updatedReplicas,
                })}
              </span>
            </Tooltip>
          </DescriptionListDescription>
        </Card>
        <Card>
          <DescriptionListTerm>{t('public~Unavailable count')}</DescriptionListTerm>
          <DescriptionListDescription>
            <Tooltip
              content={t(
                'public~The number of unavailable replicas for this ControlPlaneMachineSet.',
              )}
            >
              {unavailableReplicas ? (
                <span>
                  {t('public~{{unavailableReplicas}} machines', {
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

const ControlPlaneMachineSetDetails: React.FCC<ControlPlaneMachineSetDetailsProps> = ({ obj }) => {
  const { t } = useTranslation();
  return (
    <>
      <PaneBody>
        <SectionHeading text={t('public~ControlPlaneMachineSet details')} />
        <ControlPlaneMachineSetCounts resource={obj} />
        <Grid hasGutter>
          <GridItem md={6}>
            <ResourceSummary resource={obj}>
              <DescriptionListGroup>
                <DescriptionListTerm>{t('public~Selector')}</DescriptionListTerm>
                <DescriptionListDescription>
                  <Selector
                    kind={machineReference}
                    selector={obj.spec.selector}
                    namespace={obj.metadata.namespace}
                  />
                </DescriptionListDescription>
              </DescriptionListGroup>
              <DescriptionListGroup>
                <DescriptionListTerm>{t('public~Strategy')}</DescriptionListTerm>
                <DescriptionListDescription>
                  {obj.spec?.strategy?.type || DASH}
                </DescriptionListDescription>
              </DescriptionListGroup>
              <DescriptionListGroup>
                <DescriptionListTerm>{t('public~State')}</DescriptionListTerm>
                <DescriptionListDescription>{obj.spec?.state || DASH}</DescriptionListDescription>
              </DescriptionListGroup>
            </ResourceSummary>
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

export const MachineTabPage: React.FC<MachineTabPageProps> = ({ obj }) => (
  <MachinePage namespace={obj.metadata.namespace} showTitle={false} selector={obj.spec.selector} />
);

const pages = [
  navFactory.details(ControlPlaneMachineSetDetails),
  navFactory.editYaml(),
  navFactory.machines(MachineTabPage),
  navFactory.events(ResourceEventStream),
];

export const ControlPlaneMachineSetDetailsPage: React.FC<any> = (props) => (
  <DetailsPage
    {...props}
    kind={controlPlaneMachineSetReference}
    menuActions={controlPlaneMachineSetMenuActions}
    pages={pages}
  />
);

const tableColumnInfo = [
  { id: 'name' },
  { id: 'namespace' },
  { id: 'machines' },
  { id: 'strategy' },
  { id: 'state' },
  { id: '' },
];

const useControlPlaneMachineSetColumns = (): TableColumn<ControlPlaneMachineSetKind>[] => {
  const { t } = useTranslation();
  const columns: TableColumn<ControlPlaneMachineSetKind>[] = React.useMemo(() => {
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
        title: t('public~Namespace'),
        id: tableColumnInfo[1].id,
        sort: 'metadata.namespace',
        props: {
          modifier: 'nowrap',
        },
      },
      {
        title: t('public~Machines'),
        id: tableColumnInfo[2].id,
        sort: 'status.readyReplicas',
        props: {
          modifier: 'nowrap',
        },
      },
      {
        title: t('public~Strategy'),
        id: tableColumnInfo[3].id,
        sort: 'spec.strategy.type',
        props: {
          modifier: 'nowrap',
        },
      },
      {
        title: t('public~State'),
        id: tableColumnInfo[4].id,
        sort: 'spec.state',
        props: {
          modifier: 'nowrap',
        },
      },
      {
        title: '',
        id: tableColumnInfo[5].id,
        props: {
          ...cellIsStickyProps,
        },
      },
    ];
  }, [t]);
  return columns;
};

export const MachinesCell: React.FCC<MachinesCellProps> = ({
  desiredReplicas,
  readyReplicas,
  path,
}) => {
  const { t } = useTranslation();
  return (
    <Link to={`${path}/machines`}>
      {t('public~{{readyReplicas}} of {{count}} machine', {
        readyReplicas,
        count: desiredReplicas,
      })}
    </Link>
  );
};

const getDataViewRows: GetDataViewRows<ControlPlaneMachineSetKind, undefined> = (data, columns) => {
  return data.map(({ obj }) => {
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
        cell: (
          <ResourceKebab
            actions={controlPlaneMachineSetMenuActions}
            kind={controlPlaneMachineSetReference}
            resource={obj}
          />
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

const ControlPlaneMachineSetList: React.FC<ControlPlaneMachineSetListProps> = ({
  data,
  loaded,
  loadError,
  ...props
}) => {
  const columns = useControlPlaneMachineSetColumns();

  return (
    <React.Suspense fallback={<LoadingBox />}>
      <ConsoleDataView<ControlPlaneMachineSetKind, undefined>
        {...props}
        label={ControlPlaneMachineSetModel.labelPlural}
        data={data}
        loaded={loaded}
        loadError={loadError}
        columns={columns}
        initialFilters={initialFiltersDefault}
        getDataViewRows={getDataViewRows}
        hideColumnManagement={true}
      />
    </React.Suspense>
  );
};

export const ControlPlaneMachineSetListPage: React.FC<any> = (props) => (
  <ListPage
    {...props}
    ListComponent={ControlPlaneMachineSetList}
    kind={controlPlaneMachineSetReference}
    canCreate
    omitFilterToolbar={true}
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
