import * as React from 'react';
import * as _ from 'lodash-es';
import { sortable } from '@patternfly/react-table';
import { css } from '@patternfly/react-styles';
import { useTranslation } from 'react-i18next';

import PaneBody from '@console/shared/src/components/layout/PaneBody';
import { MachineHealthCheckModel, MachineModel } from '../models';
import { K8sResourceKind, MachineHealthCheckKind } from '../module/k8s/types';
import { referenceForModel } from '../module/k8s/k8s';
import { DetailsPage, ListPage, Table, TableData, RowFunctionArgs } from './factory';
import {
  DetailsItem,
  EmptyBox,
  Kebab,
  ResourceKebab,
  ResourceLink,
  ResourceSummary,
  SectionHeading,
  Selector,
  navFactory,
} from './utils';
import { Timestamp } from '@console/shared/src/components/datetime/Timestamp';
import { DescriptionList, Grid, GridItem } from '@patternfly/react-core';

const { common } = Kebab.factory;
const menuActions = [...common];
const machineHealthCheckReference = referenceForModel(MachineHealthCheckModel);

const tableColumnClasses = ['', '', 'pf-m-hidden pf-m-visible-on-md', Kebab.columnClass];

const MachineHealthCheckTableRow: React.FC<RowFunctionArgs<K8sResourceKind>> = ({ obj }) => {
  return (
    <>
      <TableData className={tableColumnClasses[0]}>
        <ResourceLink
          kind={machineHealthCheckReference}
          name={obj.metadata.name}
          namespace={obj.metadata.namespace}
        />
      </TableData>
      <TableData className={css(tableColumnClasses[1], 'co-break-word')} columnID="namespace">
        <ResourceLink kind="Namespace" name={obj.metadata.namespace} />
      </TableData>
      <TableData className={tableColumnClasses[2]}>
        <Timestamp timestamp={obj.metadata.creationTimestamp} />
      </TableData>
      <TableData className={tableColumnClasses[3]}>
        <ResourceKebab actions={menuActions} kind={machineHealthCheckReference} resource={obj} />
      </TableData>
    </>
  );
};

const MachineHealthCheckList: React.FC = (props) => {
  const { t } = useTranslation();
  const MachineHealthCheckTableHeader = () => {
    return [
      {
        title: t('public~Name'),
        sortField: 'metadata.name',
        transforms: [sortable],
        props: { className: tableColumnClasses[0] },
      },
      {
        title: t('public~Namespace'),
        sortField: 'metadata.namespace',
        transforms: [sortable],
        props: { className: tableColumnClasses[1] },
        id: 'namespace',
      },
      {
        title: t('public~Created'),
        sortField: 'metadata.creationTimestamp',
        transforms: [sortable],
        props: { className: tableColumnClasses[2] },
      },
      {
        title: '',
        props: { className: tableColumnClasses[3] },
      },
    ];
  };

  return (
    <Table
      {...props}
      aria-label={t('public~MachineHealthChecks')}
      Header={MachineHealthCheckTableHeader}
      Row={MachineHealthCheckTableRow}
      virtualize
    />
  );
};

const UnhealthyConditionsTable: React.FC<{ obj: K8sResourceKind }> = ({ obj }) => {
  const { t } = useTranslation();
  return _.isEmpty(obj.spec.unhealthyConditions) ? (
    <EmptyBox label={t('public~Unhealthy conditions')} />
  ) : (
    <table className="pf-v6-c-table pf-m-compact pf-m-border-rows">
      <thead className="pf-v6-c-table__thead">
        <tr className="pf-v6-c-table__tr">
          <th className="pf-v6-c-table__th">{t('public~Type')}</th>
          <th className="pf-v6-c-table__th">{t('public~Status')}</th>
          <th className="pf-v6-c-table__th">{t('public~Timeout')}</th>
        </tr>
      </thead>
      <tbody className="pf-v6-c-table__tbody">
        {obj.spec.unhealthyConditions.map(({ status, timeout, type }, i: number) => (
          <tr className="pf-v6-c-table__tr" key={i}>
            <td className="pf-v6-c-table__td">{type}</td>
            <td className="pf-v6-c-table__td">{status}</td>
            <td className="pf-v6-c-table__td">{timeout}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

const MachineHealthCheckDetails: React.FC<MachineHealthCheckDetailsProps> = ({ obj }) => {
  const { t } = useTranslation();
  return (
    <>
      <PaneBody>
        <SectionHeading text={t('public~MachineHealthCheck details')} />
        <Grid hasGutter>
          <GridItem sm={6}>
            <ResourceSummary resource={obj}>
              <DetailsItem label={t('public~Selector')} obj={obj} path="spec.selector">
                <Selector
                  kind={referenceForModel(MachineModel)}
                  selector={_.get(obj, 'spec.selector')}
                  namespace={obj.metadata.namespace}
                />
              </DetailsItem>
            </ResourceSummary>
          </GridItem>
          <GridItem sm={6}>
            <DescriptionList>
              <DetailsItem label={t('public~Max unhealthy')} obj={obj} path="spec.maxUnhealthy" />
              <DetailsItem
                label={t('public~Expected machines')}
                obj={obj}
                path="status.expectedMachines"
              />
              <DetailsItem
                label={t('public~Current healthy')}
                obj={obj}
                path="status.currentHealthy"
              />
            </DescriptionList>
          </GridItem>
        </Grid>
      </PaneBody>
      <PaneBody>
        <SectionHeading text={t('public~Unhealthy conditions')} />
        <UnhealthyConditionsTable obj={obj} />
      </PaneBody>
    </>
  );
};

export const MachineHealthCheckPage: React.FC<MachineHealthCheckPageProps> = (props) => (
  <ListPage
    {...props}
    ListComponent={MachineHealthCheckList}
    kind={machineHealthCheckReference}
    canCreate={true}
  />
);

export const MachineHealthCheckDetailsPage: React.FC = (props) => (
  <DetailsPage
    {...props}
    menuActions={menuActions}
    kind={machineHealthCheckReference}
    pages={[navFactory.details(MachineHealthCheckDetails), navFactory.editYaml()]}
  />
);

type MachineHealthCheckPageProps = {
  showTitle?: boolean;
  namespace?: string;
  selector?: any;
};

export type MachineHealthCheckDetailsProps = {
  obj: MachineHealthCheckKind;
};
