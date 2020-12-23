import * as _ from 'lodash-es';
import * as React from 'react';
import * as classNames from 'classnames';
import { sortable } from '@patternfly/react-table';

import { K8sResourceKind } from '../../module/k8s';
import { DetailsPage, ListPage, Table, TableRow, TableData, RowFunction } from '../factory';
import { DetailsItem, Kebab, KebabAction, detailsPage, Timestamp, navFactory, ResourceKebab, ResourceLink, ResourceSummary, SectionHeading } from '../utils';
import { PipelineResourceModel } from '../../models';

export const menuActions: KebabAction[] = [...Kebab.getExtensionsActionsForKind(PipelineResourceModel), ...Kebab.factory.common];

const kind = PipelineResourceModel.kind;

const tableColumnClasses = [
  classNames('col-xs-6', 'col-sm-4'),
  classNames('col-xs-6', 'col-sm-4'),
  classNames('col-sm-4', 'hidden-xs'),
  Kebab.columnClass,
];


const PipelineResourceTableHeader = () => {
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
        title: 'Created',
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

  PipelineResourceTableHeader.displayName = 'PipelineResourceTableHeader';

  
const PipelineResourceTableRow: RowFunction<K8sResourceKind> = ({ obj: pipelineResource, index, key, style }) => {
    return (
      <TableRow id={pipelineResource.metadata.uid} index={index} trKey={key} style={style}>
        <TableData className={tableColumnClasses[0]}>
          <ResourceLink kind={kind} name={pipelineResource.metadata.name} namespace={pipelineResource.metadata.namespace} title={pipelineResource.metadata.uid} />
        </TableData>
        <TableData className={classNames(tableColumnClasses[1], 'co-break-word')}>
            <ResourceLink kind="Namespace" name={pipelineResource.metadata.namespace} title={pipelineResource.metadata.namespace} />
        </TableData>
        <TableData className={tableColumnClasses[2]}>
          <Timestamp timestamp={pipelineResource.metadata.creationTimestamp} />
        </TableData>
        <TableData className={tableColumnClasses[3]}>
        <ResourceKebab actions={menuActions} kind={kind} resource={pipelineResource} />
      </TableData>
      </TableRow>
    );
  };

  export const PipelineResourceDetailsList: React.FC<PipelineResourceDetailsListProps> = ({ ds }) => (
    <dl className="co-m-pane__details">
      <DetailsItem label="Current Count" obj={ds} path="status.currentNumberScheduled" />
      <DetailsItem label="Desired Count" obj={ds} path="status.desiredNumberScheduled" />
    </dl>
  );

  
const PipelineResourceDetails: React.FC<PipelineResourceDetailsProps> = ({ obj: pipelineResource }) => (
    <>
      <div className="co-m-pane__body">
        <SectionHeading text="Federated Job Details" />
        <div className="row">
          <div className="col-lg-6">
            <ResourceSummary resource={pipelineResource} showPodSelector showNodeSelector showTolerations />
          </div>
          <div className="col-lg-6">
            <PipelineResourceDetailsList ds={pipelineResource} />
          </div>
        </div>
      </div>
      <div className="co-m-pane__body">
        <SectionHeading text="Containers" />
      </div>
    </>
  );

  
const { details, editYaml } = navFactory;

export const PipelineResources: React.FC = props => <Table {...props} aria-label="Pipeline Resources" Header={PipelineResourceTableHeader} Row={PipelineResourceTableRow} virtualize />;


export const PipelineResourcesPage: React.FC<PipelineResourcesPageProps> = props => <ListPage canCreate={true} ListComponent={PipelineResources} kind={kind} {...props} />;

export const PipelineResourcesDetailsPage: React.FC<PipelineResourcesDetailsPageProps> = props => <DetailsPage {...props} kind={kind} menuActions={menuActions} pages={[details(detailsPage(PipelineResourceDetails)), editYaml()]} />;


  type PipelineResourceDetailsListProps = {
    ds: K8sResourceKind;
  };

  type PipelineResourcesPageProps = {
    showTitle?: boolean;
    namespace?: string;
    selector?: any;
  };

  type PipelineResourceDetailsProps = {
    obj: K8sResourceKind;
  };

  type PipelineResourcesDetailsPageProps = {
    match: any;
  };