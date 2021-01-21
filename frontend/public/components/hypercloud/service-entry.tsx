import * as _ from 'lodash-es';
import * as React from 'react';
import * as classNames from 'classnames';
import { sortable } from '@patternfly/react-table';
import { Translation } from 'react-i18next';

import { K8sResourceKind } from '../../module/k8s';
import { DetailsPage, ListPage, Table, TableRow, TableData, RowFunction } from '../factory';
import { Kebab, KebabAction, detailsPage, Timestamp, navFactory, ResourceKebab, ResourceLink, ResourceSummary, SectionHeading } from '../utils';
import { Status } from '@console/shared';
import { ServiceEntryModel } from '../../models';

export const menuActions: KebabAction[] = [...Kebab.getExtensionsActionsForKind(ServiceEntryModel), ...Kebab.factory.common];

const kind = ServiceEntryModel.kind;

const tableColumnClasses = ['', '', classNames('pf-m-hidden', 'pf-m-visible-on-sm', 'pf-u-w-16-on-lg'), Kebab.columnClass];

const ServiceEntryTableRow: RowFunction<K8sResourceKind> = ({ obj: serviceentry, index, key, style }) => {
  return (
    <TableRow id={serviceentry.metadata.uid} index={index} trKey={key} style={style}>
      <TableData className={tableColumnClasses[0]}>
        <ResourceLink kind={kind} name={serviceentry.metadata.name} namespace={serviceentry.metadata.namespace} title={serviceentry.metadata.uid} />
      </TableData>
      <TableData className={tableColumnClasses[1]}>
        <Status status={serviceentry.metadata.namespace} />
      </TableData>
      <TableData className={tableColumnClasses[2]}>
        <Timestamp timestamp={serviceentry.metadata.creationTimestamp} />
      </TableData>
      <TableData className={tableColumnClasses[3]}>
        <ResourceKebab actions={menuActions} kind={kind} resource={serviceentry} />
      </TableData>
    </TableRow>
  );
};

const ServiceEntryDetails: React.FC<ServiceEntryDetailsProps> = ({ obj: serviceentry }) => (
  <>
    <div className="co-m-pane__body">
      <SectionHeading text="Authorization Policy Details" />
      <div className="row">
        <div className="col-lg-6">
          <ResourceSummary resource={serviceentry} />
        </div>
      </div>
    </div>
    <div className="co-m-pane__body">
    </div>
  </>
);

const { details, editYaml } = navFactory;
export const ServiceEntries: React.FC = props =>
  <Translation>{
    (t) => <Table {...props} aria-label="Service Entries" Header={() => [
      {
        title: t('COMMON:MSG_MAIN_TABLEHEADER_1'),
        sortField: 'metadata.name',
        transforms: [sortable],
        props: { className: tableColumnClasses[0] },
      },
      {
        title: t('COMMON:MSG_MAIN_TABLEHEADER_2'),
        sortFunc: 'metadata.namespace',
        transforms: [sortable],
        props: { className: tableColumnClasses[1] },
      },
      {
        title: t('COMMON:MSG_MAIN_TABLEHEADER_12'),
        sortField: 'metadata.creationTimestamp',
        transforms: [sortable],
        props: { className: tableColumnClasses[2] },
      },
      {
        title: '',
        props: { className: tableColumnClasses[3] },
      },
    ]} Row={ServiceEntryTableRow} virtualize />
  }</Translation>;

export const ServiceEntriesPage: React.FC<ServiceEntriesPageProps> = props => <ListPage canCreate={true} ListComponent={ServiceEntries} kind={kind} {...props} />;

export const ServiceEntriesDetailsPage: React.FC<ServiceEntriesDetailsPageProps> = props => <DetailsPage {...props} kind={kind} menuActions={menuActions} pages={[details(detailsPage(ServiceEntryDetails)), editYaml()]} />;

type ServiceEntryDetailsProps = {
  obj: K8sResourceKind;
};

type ServiceEntriesPageProps = {
  showTitle?: boolean;
  namespace?: string;
  selector?: any;
};

type ServiceEntriesDetailsPageProps = {
  match: any;
};