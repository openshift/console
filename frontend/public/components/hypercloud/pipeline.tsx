import * as _ from 'lodash-es';
import * as React from 'react';
import * as classNames from 'classnames';
import { sortable } from '@patternfly/react-table';

import { K8sResourceKind } from '../../module/k8s';
import { DetailsPage, ListPage, Table, TableRow, TableData, RowFunction } from '../factory';
import { DetailsItem, Kebab, KebabAction, detailsPage, Timestamp, navFactory, ResourceKebab, ResourceLink, ResourceSummary, SectionHeading } from '../utils';
import { PipelineModel } from '../../models';

export const menuActions: KebabAction[] = [...Kebab.getExtensionsActionsForKind(PipelineModel), ...Kebab.factory.common];

const kind = PipelineModel.kind;

const tableColumnClasses = [
    classNames('col-xs-6', 'col-sm-4'),
    classNames('col-xs-6', 'col-sm-4'),
    classNames('col-sm-4', 'hidden-xs'),
    Kebab.columnClass,
  ];


const PipelineTableHeader = () => {
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

  PipelineTableHeader.displayName = 'PipelineTableHeader';

  
const PipelineTableRow: RowFunction<K8sResourceKind> = ({ obj: pipeline, index, key, style }) => {
    return (
      <TableRow id={pipeline.metadata.uid} index={index} trKey={key} style={style}>
        <TableData className={tableColumnClasses[0]}>
          <ResourceLink kind={kind} name={pipeline.metadata?.name} namespace={pipeline.metadata?.namespace} title={pipeline.metadata?.uid} />
        </TableData>
        <TableData className={classNames(tableColumnClasses[1], 'co-break-word')}>
            <ResourceLink kind="Namespace" name={pipeline.metadata?.namespace} title={pipeline.metadata?.namespace} />
        </TableData>
        <TableData className={tableColumnClasses[2]}>
          <Timestamp timestamp={pipeline.metadata.creationTimestamp} />
        </TableData>
        <TableData className={tableColumnClasses[3]}>
        <ResourceKebab actions={menuActions} kind={kind} resource={pipeline} />
      </TableData>
      </TableRow>
    );
  };

  export const PipelineDetailsList: React.FC<PipelineDetailsListProps> = ({ ds }) => (
    <dl className="co-m-pane__details">
      <DetailsItem label="Current Count" obj={ds} path="status.currentNumberScheduled" />
      <DetailsItem label="Desired Count" obj={ds} path="status.desiredNumberScheduled" />
    </dl>
  );

  
const PipelineDetails: React.FC<PipelineDetailsProps> = ({ obj: pipeline }) => (
    <>
      <div className="co-m-pane__body">
        <SectionHeading text="Federated Job Details" />
        <div className="row">
          <div className="col-lg-6">
            <ResourceSummary resource={pipeline} showPodSelector showNodeSelector showTolerations />
          </div>
          <div className="col-lg-6">
            <PipelineDetailsList ds={pipeline} />
          </div>
        </div>
      </div>
      <div className="co-m-pane__body">
        <SectionHeading text="Containers" />
      </div>
    </>
  );

  
const { details, editYaml } = navFactory;

export const Pipelines: React.FC = props => <Table {...props} aria-label="Pipelines" Header={PipelineTableHeader} Row={PipelineTableRow} virtualize />;


export const PipelinesPage: React.FC<PipelinesPageProps> = props => <ListPage canCreate={true} ListComponent={Pipelines} kind={kind} {...props} />;

export const PipelinesDetailsPage: React.FC<PipelinesDetailsPageProps> = props => <DetailsPage {...props} kind={kind} menuActions={menuActions} pages={[details(detailsPage(PipelineDetails)), editYaml()]} />;


  type PipelineDetailsListProps = {
    ds: K8sResourceKind;
  };

  type PipelinesPageProps = {
    showTitle?: boolean;
    namespace?: string;
    selector?: any;
  };

  type PipelineDetailsProps = {
    obj: K8sResourceKind;
  };

  type PipelinesDetailsPageProps = {
    match: any;
  };