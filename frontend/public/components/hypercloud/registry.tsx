import * as _ from 'lodash-es';
import * as React from 'react';
import * as classNames from 'classnames';
import { sortable } from '@patternfly/react-table';

import { K8sResourceKind } from '../../module/k8s';
import { DetailsPage, ListPage, Table, TableRow, TableData, RowFunction } from '../factory';
import { DetailsItem, Kebab, KebabAction, detailsPage, Timestamp, navFactory, ResourceKebab, ResourceLink, ResourceSummary, SectionHeading } from '../utils';
import { RegistryModel } from '../../models/hypercloud';

export const menuActions: KebabAction[] = [...Kebab.getExtensionsActionsForKind(RegistryModel), ...Kebab.factory.common];

const kind = RegistryModel.kind;

const tableColumnClasses = [
    classNames('col-xs-2', 'col-sm-2'),
    classNames('col-xs-2', 'col-sm-2'),
    classNames('col-sm-2', 'hidden-xs'),
    classNames('col-xs-2', 'col-sm-2'),
    classNames('col-sm-2', 'hidden-xs'),
    Kebab.columnClass,
  ];


const RegistryTableHeader = () => {
    return [
      {
        title: 'Name',
        sortField: 'metadata.name',
        transforms: [sortable],
        props: { className: tableColumnClasses[0] },
      },
      {
        title: 'Namespace',
        sortField: 'metadata.namespace',
        transforms: [sortable],
        props: { className: tableColumnClasses[1] },
      },
      {
        title: 'Image',
        sortField: 'spec.image',
        transforms: [sortable],
        props: { className: tableColumnClasses[2] },
      },
      {
        title: 'Status',
        sortField: 'status.phase',
        transforms: [sortable],
        props: { className: tableColumnClasses[3] },
      },
      {
        title: 'Created',
        sortField: 'metadata.creationTimestamp',
        transforms: [sortable],
        props: { className: tableColumnClasses[4] },
      },
      {
        title: '',
        props: { className: tableColumnClasses[5] },
      },
    ];
  };

  RegistryTableHeader.displayName = 'RegistryTableHeader';

  
const RegistryTableRow: RowFunction<K8sResourceKind> = ({ obj: registry, index, key, style }) => {
    return (
      <TableRow id={registry.metadata.uid} index={index} trKey={key} style={style}>
        <TableData className={tableColumnClasses[0]}>
          <ResourceLink kind={kind} name={registry.metadata.name} namespace={registry.metadata.namespace} title={registry.metadata.uid} />
        </TableData>
        <TableData className={classNames(tableColumnClasses[1], 'co-break-word')}>
            <ResourceLink kind="Namespace" name={registry.metadata.namespace} title={registry.metadata.namespace} />
        </TableData>
        <TableData className={tableColumnClasses[2]}>
          {registry.spec.image}
        </TableData>
        <TableData className={tableColumnClasses[3]}>
          {registry.status.phase}
        </TableData>
        <TableData className={tableColumnClasses[4]}>
          <Timestamp timestamp={registry.metadata.creationTimestamp} />
        </TableData>
        <TableData className={tableColumnClasses[5]}>
        <ResourceKebab actions={menuActions} kind={kind} resource={registry} />
      </TableData>
      </TableRow>
    );
  };

  export const RegistryDetailsList: React.FC<RegistryDetailsListProps> = ({ ds }) => (
    <dl className="co-m-pane__details">
      <DetailsItem label="Status" obj={ds} path="status.phase" />
    </dl>
  );

  
const RegistryDetails: React.FC<RegistryDetailsProps> = ({ obj: registry }) => (
    <>
      <div className="co-m-pane__body">
        <SectionHeading text="Registry Details" />
        <div className="row">
          <div className="col-lg-6">
            <ResourceSummary resource={registry} showPodSelector showNodeSelector showTolerations />
          </div>
          <div className="col-lg-6">
            <RegistryDetailsList ds={registry} />
          </div>
        </div>
      </div>
      <div className="co-m-pane__body">
        <SectionHeading text="Containers" />
      </div>
    </>
  );

  
const { details, editYaml } = navFactory;

export const Registries: React.FC = props => <Table {...props} aria-label="Registries" Header={RegistryTableHeader} Row={RegistryTableRow} virtualize />;


export const RegistriesPage: React.FC<RegistriesPageProps> = props => <ListPage canCreate={true} ListComponent={Registries} kind={kind} {...props} />;

export const RegistriesDetailsPage: React.FC<RegistriesDetailsPageProps> = props => <DetailsPage {...props} kind={kind} menuActions={menuActions} pages={[details(detailsPage(RegistryDetails)), editYaml()]} />;


  type RegistryDetailsListProps = {
    ds: K8sResourceKind;
  };

  type RegistriesPageProps = {
    showTitle?: boolean;
    namespace?: string;
    selector?: any;
  };

  type RegistryDetailsProps = {
    obj: K8sResourceKind;
  };

  type RegistriesDetailsPageProps = {
    match: any;
  };