import * as _ from 'lodash-es';
import * as React from 'react';
import * as classNames from 'classnames';
import { sortable } from '@patternfly/react-table';

import { K8sResourceKind } from '../../module/k8s';
import { DetailsPage, ListPage, Table, TableRow, TableData, RowFunction } from '../factory';
import { DetailsItem, Kebab, KebabAction, detailsPage, Timestamp, navFactory, ResourceKebab, ResourceLink, ResourceSummary, SectionHeading } from '../utils';
import { ApprovalModel } from '../../models';

export const menuActions: KebabAction[] = [...Kebab.getExtensionsActionsForKind(ApprovalModel), ...Kebab.factory.common];

const kind = ApprovalModel.kind;

const tableColumnClasses = [
  classNames('col-xs-6', 'col-sm-4'),
  classNames('col-xs-6', 'col-sm-4'),
  classNames('col-sm-4', 'hidden-xs'),
  Kebab.columnClass,
];


const PipelineApprovalTableHeader = () => {
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

  PipelineApprovalTableHeader.displayName = 'PipelineApprovalTableHeader';

  
const PipelineApprovalTableRow: RowFunction<K8sResourceKind> = ({ obj: pipelineApproval, index, key, style }) => {
    return (
      <TableRow id={pipelineApproval.metadata.uid} index={index} trKey={key} style={style}>
        <TableData className={tableColumnClasses[0]}>
          <ResourceLink kind={kind} name={pipelineApproval.metadata.name} namespace={pipelineApproval.metadata.namespace} title={pipelineApproval.metadata.uid} />
        </TableData>
        <TableData className={classNames(tableColumnClasses[1], 'co-break-word')}>
            <ResourceLink kind="Namespace" name={pipelineApproval.metadata.namespace} title={pipelineApproval.metadata.namespace} />
        </TableData>
        <TableData className={tableColumnClasses[2]}>
          <Timestamp timestamp={pipelineApproval.metadata.creationTimestamp} />
        </TableData>
        <TableData className={tableColumnClasses[3]}>
        <ResourceKebab actions={menuActions} kind={kind} resource={pipelineApproval} />
      </TableData>
      </TableRow>
    );
  };

  export const PipelineApprovalDetailsList: React.FC<PipelineApprovalDetailsListProps> = ({ ds }) => (
    <dl className="co-m-pane__details">
      <DetailsItem label="Current Count" obj={ds} path="status.currentNumberScheduled" />
      <DetailsItem label="Desired Count" obj={ds} path="status.desiredNumberScheduled" />
    </dl>
  );

  
const PipelineApprovalDetails: React.FC<PipelineApprovalDetailsProps> = ({ obj: pipelineApproval }) => (
    <>
      <div className="co-m-pane__body">
        <SectionHeading text="Federated Job Details" />
        <div className="row">
          <div className="col-lg-6">
            <ResourceSummary resource={pipelineApproval} showPodSelector showNodeSelector showTolerations />
          </div>
          <div className="col-lg-6">
            <PipelineApprovalDetailsList ds={pipelineApproval} />
          </div>
        </div>
      </div>
      <div className="co-m-pane__body">
        <SectionHeading text="Containers" />
      </div>
    </>
  );

  
const { details, editYaml } = navFactory;

export const PipelineApprovals: React.FC = props => <Table {...props} aria-label="Pipeline Approvals" Header={PipelineApprovalTableHeader} Row={PipelineApprovalTableRow} virtualize />;


export const PipelineApprovalsPage: React.FC<PipelineApprovalsPageProps> = props => <ListPage canCreate={true} ListComponent={PipelineApprovals} kind={kind} {...props} />;

export const PipelineApprovalsDetailsPage: React.FC<PipelineApprovalsDetailsPageProps> = props => <DetailsPage {...props} kind={kind} menuActions={menuActions} pages={[details(detailsPage(PipelineApprovalDetails)), editYaml()]} />;


  type PipelineApprovalDetailsListProps = {
    ds: K8sResourceKind;
  };

  type PipelineApprovalsPageProps = {
    showTitle?: boolean;
    namespace?: string;
    selector?: any;
  };

  type PipelineApprovalDetailsProps = {
    obj: K8sResourceKind;
  };

  type PipelineApprovalsDetailsPageProps = {
    match: any;
  };