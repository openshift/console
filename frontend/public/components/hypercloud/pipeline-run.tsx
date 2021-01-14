import * as _ from 'lodash-es';
import * as React from 'react';
import * as classNames from 'classnames';
import { sortable } from '@patternfly/react-table';

import { K8sResourceKind } from '../../module/k8s';
import { DetailsPage, ListPage, Table, TableRow, TableData, RowFunction } from '../factory';
import { DetailsItem, Kebab, KebabAction, detailsPage, Timestamp, navFactory, ResourceKebab, ResourceLink, ResourceSummary, SectionHeading } from '../utils';
import { PipelineRunModel } from '../../models';

export const menuActions: KebabAction[] = [...Kebab.getExtensionsActionsForKind(PipelineRunModel), ...Kebab.factory.common];

const kind = PipelineRunModel.kind;

const tableColumnClasses = [
  classNames('col-xs-6', 'col-sm-4'),
  classNames('col-xs-6', 'col-sm-4'),
  classNames('col-sm-4', 'hidden-xs'),
  Kebab.columnClass,
];


const PipelineRunTableHeader = () => {
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

  PipelineRunTableHeader.displayName = 'PipelineRunTableHeader';

  
const PipelineRunTableRow: RowFunction<K8sResourceKind> = ({ obj: pipelineRun, index, key, style }) => {
    return (
      <TableRow id={pipelineRun.metadata.uid} index={index} trKey={key} style={style}>
        <TableData className={tableColumnClasses[0]}>
          <ResourceLink kind={kind} name={pipelineRun.metadata.name} namespace={pipelineRun.metadata.namespace} title={pipelineRun.metadata.uid} />
        </TableData>
        <TableData className={classNames(tableColumnClasses[1], 'co-break-word')}>
            <ResourceLink kind="Namespace" name={pipelineRun.metadata.namespace} title={pipelineRun.metadata.namespace} />
        </TableData>
        <TableData className={tableColumnClasses[2]}>
          <Timestamp timestamp={pipelineRun.metadata.creationTimestamp} />
        </TableData>
        <TableData className={tableColumnClasses[3]}>
        <ResourceKebab actions={menuActions} kind={kind} resource={pipelineRun} />
      </TableData>
      </TableRow>
    );
  };

  export const PipelineRunDetailsList: React.FC<PipelineRunDetailsListProps> = ({ ds }) => (
    <dl className="co-m-pane__details">
      <DetailsItem label="Current Count" obj={ds} path="status.currentNumberScheduled" />
      <DetailsItem label="Desired Count" obj={ds} path="status.desiredNumberScheduled" />
    </dl>
  );

  
const PipelineRunDetails: React.FC<PipelineRunDetailsProps> = ({ obj: pipelineRun }) => (
    <>
      <div className="co-m-pane__body">
        <SectionHeading text="Pipeline Run Details" />
        <div className="row">
          <div className="col-lg-6">
            <ResourceSummary resource={pipelineRun} showPodSelector showNodeSelector showTolerations />
          </div>
          <div className="col-lg-6">
            <PipelineRunDetailsList ds={pipelineRun} />
          </div>
        </div>
      </div>
      <div className="co-m-pane__body">
        <SectionHeading text="Containers" />
      </div>
    </>
  );

  
const { details, editYaml } = navFactory;

export const PipelineRuns: React.FC = props => <Table {...props} aria-label="Pipeline Runs" Header={PipelineRunTableHeader} Row={PipelineRunTableRow} virtualize />;


export const PipelineRunsPage: React.FC<PipelineRunsPageProps> = props => <ListPage canCreate={true} ListComponent={PipelineRuns} kind={kind} {...props} />;

export const PipelineRunsDetailsPage: React.FC<PipelineRunsDetailsPageProps> = props => <DetailsPage {...props} kind={kind} menuActions={menuActions} pages={[details(detailsPage(PipelineRunDetails)), editYaml()]} />;


  type PipelineRunDetailsListProps = {
    ds: K8sResourceKind;
  };

  type PipelineRunsPageProps = {
    showTitle?: boolean;
    namespace?: string;
    selector?: any;
  };

  type PipelineRunDetailsProps = {
    obj: K8sResourceKind;
  };

  type PipelineRunsDetailsPageProps = {
    match: any;
  };