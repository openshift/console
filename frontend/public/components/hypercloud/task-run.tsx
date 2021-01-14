import * as _ from 'lodash-es';
import * as React from 'react';
import * as classNames from 'classnames';
import { sortable } from '@patternfly/react-table';

import { K8sResourceKind } from '../../module/k8s';
import { DetailsPage, ListPage, Table, TableRow, TableData, RowFunction } from '../factory';
import { DetailsItem, Kebab, KebabAction, detailsPage, Timestamp, navFactory, ResourceKebab, ResourceLink, ResourceSummary, SectionHeading } from '../utils';
import { TaskRunModel } from '../../models';

export const menuActions: KebabAction[] = [...Kebab.getExtensionsActionsForKind(TaskRunModel), ...Kebab.factory.common];

const kind = TaskRunModel.kind;

const tableColumnClasses = [
  classNames('col-xs-6', 'col-sm-4'),
  classNames('col-xs-6', 'col-sm-4'),
  classNames('col-sm-4', 'hidden-xs'),
  Kebab.columnClass,
];


const TaskRunTableHeader = () => {
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

  TaskRunTableHeader.displayName = 'TaskRunTableHeader';

  
const TaskRunTableRow: RowFunction<K8sResourceKind> = ({ obj: taskRun, index, key, style }) => {
    return (
      <TableRow id={taskRun.metadata.uid} index={index} trKey={key} style={style}>
        <TableData className={tableColumnClasses[0]}>
          <ResourceLink kind={kind} name={taskRun.metadata.name} namespace={taskRun.metadata.namespace} title={taskRun.metadata.uid} />
        </TableData>
        <TableData className={classNames(tableColumnClasses[1], 'co-break-word')}>
            <ResourceLink kind="Namespace" name={taskRun.metadata.namespace} title={taskRun.metadata.namespace} />
        </TableData>
        <TableData className={tableColumnClasses[2]}>
          <Timestamp timestamp={taskRun.metadata.creationTimestamp} />
        </TableData>
        <TableData className={tableColumnClasses[3]}>
        <ResourceKebab actions={menuActions} kind={kind} resource={taskRun} />
      </TableData>
      </TableRow>
    );
  };

  export const TaskRunDetailsList: React.FC<TaskRunDetailsListProps> = ({ ds }) => (
    <dl className="co-m-pane__details">
      <DetailsItem label="Current Count" obj={ds} path="status.currentNumberScheduled" />
      <DetailsItem label="Desired Count" obj={ds} path="status.desiredNumberScheduled" />
    </dl>
  );

  
const TaskRunDetails: React.FC<TaskRunDetailsProps> = ({ obj: taskRun }) => (
    <>
      <div className="co-m-pane__body">
        <SectionHeading text="Task Run Details" />
        <div className="row">
          <div className="col-lg-6">
            <ResourceSummary resource={taskRun} showPodSelector showNodeSelector showTolerations />
          </div>
          <div className="col-lg-6">
            <TaskRunDetailsList ds={taskRun} />
          </div>
        </div>
      </div>
      <div className="co-m-pane__body">
        <SectionHeading text="Containers" />
      </div>
    </>
  );

  
const { details, editYaml } = navFactory;

export const TaskRuns: React.FC = props => <Table {...props} aria-label="Task Runs" Header={TaskRunTableHeader} Row={TaskRunTableRow} virtualize />;


export const TaskRunsPage: React.FC<TaskRunsPageProps> = props => <ListPage canCreate={true} ListComponent={TaskRuns} kind={kind} {...props} />;

export const TaskRunsDetailsPage: React.FC<TaskRunsDetailsPageProps> = props => <DetailsPage {...props} kind={kind} menuActions={menuActions} pages={[details(detailsPage(TaskRunDetails)), editYaml()]} />;


  type TaskRunDetailsListProps = {
    ds: K8sResourceKind;
  };

  type TaskRunsPageProps = {
    showTitle?: boolean;
    namespace?: string;
    selector?: any;
  };

  type TaskRunDetailsProps = {
    obj: K8sResourceKind;
  };

  type TaskRunsDetailsPageProps = {
    match: any;
  };