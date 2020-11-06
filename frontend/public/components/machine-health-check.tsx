import * as React from 'react';
import * as _ from 'lodash-es';
import { sortable } from '@patternfly/react-table';
import * as classNames from 'classnames';
import { useTranslation } from 'react-i18next';

import { MachineHealthCheckModel, MachineModel } from '../models';
import { K8sResourceKind, MachineHealthCheckKind } from '../module/k8s/types';
import { referenceForModel } from '../module/k8s/k8s';
import { DetailsPage, ListPage, Table, TableRow, TableData, RowFunction } from './factory';
import {
  DetailsItem,
  EmptyBox,
  Kebab,
  ResourceKebab,
  ResourceLink,
  ResourceSummary,
  SectionHeading,
  Selector,
  Timestamp,
  navFactory,
} from './utils';

const { common } = Kebab.factory;
const menuActions = [...Kebab.getExtensionsActionsForKind(MachineHealthCheckModel), ...common];
const machineHealthCheckReference = referenceForModel(MachineHealthCheckModel);

const tableColumnClasses = [
  classNames('col-xs-6', 'col-sm-4'),
  classNames('col-xs-6', 'col-sm-4'),
  classNames('col-sm-4', 'hidden-xs'),
  Kebab.columnClass,
];

const MachineHealthCheckTableRow: RowFunction<K8sResourceKind> = ({ obj, index, key, style }) => {
  return (
    <TableRow id={obj.metadata.uid} index={index} trKey={key} style={style}>
      <TableData className={tableColumnClasses[0]}>
        <ResourceLink
          kind={machineHealthCheckReference}
          name={obj.metadata.name}
          namespace={obj.metadata.namespace}
        />
      </TableData>
      <TableData
        className={classNames(tableColumnClasses[1], 'co-break-word')}
        columnID="namespace"
      >
        <ResourceLink kind="Namespace" name={obj.metadata.namespace} />
      </TableData>
      <TableData className={tableColumnClasses[2]}>
        <Timestamp timestamp={obj.metadata.creationTimestamp} />
      </TableData>
      <TableData className={tableColumnClasses[3]}>
        <ResourceKebab actions={menuActions} kind={machineHealthCheckReference} resource={obj} />
      </TableData>
    </TableRow>
  );
};

const MachineHealthCheckList: React.FC = (props) => {
  const { t } = useTranslation();
  const MachineHealthCheckTableHeader = () => {
    return [
      {
        title: t('machine-health-checks~Name'),
        sortField: 'metadata.name',
        transforms: [sortable],
        props: { className: tableColumnClasses[0] },
      },
      {
        title: t('machine-health-checks~Namespace'),
        sortField: 'metadata.namespace',
        transforms: [sortable],
        props: { className: tableColumnClasses[1] },
        id: 'namespace',
      },
      {
        title: t('machine-health-checks~Created'),
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
      aria-label={t('machine-health-checks~MachineHealthChecks')}
      Header={MachineHealthCheckTableHeader}
      Row={MachineHealthCheckTableRow}
      virtualize
    />
  );
};

const UnhealthyConditionsTable: React.FC<{ obj: K8sResourceKind }> = ({ obj }) => {
  const { t } = useTranslation();
  return _.isEmpty(obj.spec.unhealthyConditions) ? (
    <EmptyBox label={t('machine-health-checks~Unhealthy conditions')} />
  ) : (
    <table className="table">
      <thead>
        <tr>
          <th>{t('machine-health-checks~Status')}</th>
          <th>{t('machine-health-checks~Timeout')}</th>
          <th>{t('machine-health-checks~Type')}</th>
        </tr>
      </thead>
      <tbody>
        {obj.spec.unhealthyConditions.map(({ status, timeout, type }, i: number) => (
          <tr key={i}>
            <td>{status}</td>
            <td>{timeout}</td>
            <td>{type}</td>
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
      <div className="co-m-pane__body">
        <SectionHeading text={t('machine-health-checks~MachineHealthCheck details')} />
        <div className="co-m-pane__body-group">
          <div className="row">
            <div className="col-sm-6">
              <ResourceSummary resource={obj}>
                <DetailsItem
                  label={t('machine-health-checks~Selector')}
                  obj={obj}
                  path="spec.selector"
                >
                  <Selector
                    kind={referenceForModel(MachineModel)}
                    selector={_.get(obj, 'spec.selector')}
                    namespace={obj.metadata.namespace}
                  />
                </DetailsItem>
              </ResourceSummary>
            </div>
            <div className="col-sm-6">
              <dl className="co-m-pane__details">
                <DetailsItem
                  label={t('machine-health-checks~Max unhealthy')}
                  obj={obj}
                  path="spec.maxUnhealthy"
                />
                <DetailsItem
                  label={t('machine-health-checks~Expected machines')}
                  obj={obj}
                  path="status.expectedMachines"
                />
                <DetailsItem
                  label={t('machine-health-checks~Current healthy')}
                  obj={obj}
                  path="status.currentHealthy"
                />
              </dl>
            </div>
          </div>
        </div>
      </div>
      <div className="co-m-pane__body">
        <SectionHeading text={t('machine-health-checks~Unhealthy conditions')} />
        <UnhealthyConditionsTable obj={obj} />
      </div>
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

export const MachineHealthCheckDetailsPage: React.FC<MachineHealthCheckDetailsPageProps> = (
  props,
) => (
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

export type MachineHealthCheckDetailsPageProps = {
  match: any;
};
