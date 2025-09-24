import * as _ from 'lodash-es';
import * as React from 'react';
import { TFunction } from 'i18next';
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
import { css } from '@patternfly/react-styles';
import PaneBody from '@console/shared/src/components/layout/PaneBody';
import PaneBodyGroup from '@console/shared/src/components/layout/PaneBodyGroup';
import { DASH } from '@console/shared/src/constants';
import {
  RowProps,
  useActiveColumns,
  VirtualizedTable,
} from '@console/dynamic-plugin-sdk/src/lib-core';
import { TableColumn } from '@console/dynamic-plugin-sdk';

import { Conditions } from './conditions';
import { ControlPlaneMachineSetModel } from '../models';
import { ControlPlaneMachineSetKind, referenceForModel } from '../module/k8s';
import { DetailsPage, ListPage, TableData } from './factory';
import {
  Kebab,
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

const tableColumnClasses = [
  '',
  '',
  'pf-m-hidden pf-m-visible-on-md',
  'pf-m-hidden pf-m-visible-on-lg',
  'pf-m-hidden pf-m-visible-on-lg',
  Kebab.columnClass,
];

const getColumns = (t: TFunction): TableColumn<ControlPlaneMachineSetKind>[] => [
  {
    title: t('public~Name'),
    props: { className: tableColumnClasses[0] },
    id: 'name',
  },
  {
    title: t('public~Namespace'),
    props: { className: tableColumnClasses[1] },
    id: 'namespace',
  },
  {
    title: t('public~Machines'),
    props: { className: tableColumnClasses[2] },
    id: 'machines',
  },
  {
    title: t('public~Strategy'),
    props: { className: tableColumnClasses[3] },
    id: 'strategy',
  },
  {
    title: t('public~State'),
    props: { className: tableColumnClasses[4] },
    id: 'state',
  },
  {
    title: '',
    props: { className: tableColumnClasses[5] },
    id: '',
  },
];

const ControlPlaneMachineSetList: React.FC<ControlPlaneMachineSetListProps> = (props) => {
  const { t } = useTranslation();

  const ControlPlaneMachineSetTableRow: React.FC<RowProps<ControlPlaneMachineSetKind>> = ({
    obj,
  }) => {
    const desiredReplicas = getDesiredReplicas(obj);
    const readyReplicas = getReadyReplicas(obj);
    return (
      <>
        <TableData className={css(tableColumnClasses[0], 'co-break-word')}>
          <ResourceLink
            kind={controlPlaneMachineSetReference}
            name={obj.metadata.name}
            namespace={obj.metadata.namespace}
          />
        </TableData>
        <TableData className={css(tableColumnClasses[1], 'co-break-word')} columnID="namespace">
          <ResourceLink kind="Namespace" name={obj.metadata.namespace} />
        </TableData>
        <TableData className={css(tableColumnClasses[2])}>
          <Link
            to={`${resourcePath(
              controlPlaneMachineSetReference,
              obj.metadata.name,
              obj.metadata.namespace,
            )}/machines`}
          >
            {t('public~{{readyReplicas}} of {{count}} machine', {
              readyReplicas,
              count: desiredReplicas,
            })}
          </Link>
        </TableData>
        <TableData className={css(tableColumnClasses[3])}>
          {obj.spec?.strategy?.type || DASH}
        </TableData>
        <TableData className={tableColumnClasses[4]}>{obj.spec?.state || DASH}</TableData>
        <TableData className={tableColumnClasses[5]}>
          <ResourceKebab
            actions={controlPlaneMachineSetMenuActions}
            kind={controlPlaneMachineSetReference}
            resource={obj}
          />
        </TableData>
      </>
    );
  };

  const [columns] = useActiveColumns({
    columns: React.useMemo(() => getColumns(t), [t]),
    showNamespaceOverride: false,
    columnManagementID: controlPlaneMachineSetReference,
  });

  return (
    <>
      <VirtualizedTable<ControlPlaneMachineSetKind>
        {...props}
        aria-label={t('public~ControlPlaneMachineSets')}
        label={t('public~ControlPlaneMachineSets')}
        columns={columns}
        Row={ControlPlaneMachineSetTableRow}
      />
    </>
  );
};

export const ControlPlaneMachineSetListPage: React.FC<any> = (props) => (
  <ListPage
    {...props}
    ListComponent={ControlPlaneMachineSetList}
    kind={controlPlaneMachineSetReference}
    canCreate
  />
);

type ControlPlaneMachineSetListProps = {
  data: ControlPlaneMachineSetKind[];
  unfilteredData: ControlPlaneMachineSetKind[];
  loaded: boolean;
  loadError: any;
};

type ControlPlaneMachineSetCountsProps = {
  resource: ControlPlaneMachineSetKind;
};

type ControlPlaneMachineSetDetailsProps = {
  obj: ControlPlaneMachineSetKind;
};
