import * as _ from 'lodash-es';
import * as React from 'react';
import * as classNames from 'classnames';
import { sortable } from '@patternfly/react-table';

import { K8sResourceKind } from '../../module/k8s';
import { DetailsPage, ListPage, Table, TableRow, TableData, RowFunction } from '../factory';
import { DetailsItem, Kebab, KebabAction, detailsPage, Timestamp, navFactory, ResourceKebab, ResourceLink, ResourceSummary, SectionHeading } from '../utils';
import { TaskModel } from '../../models';

export const menuActions: KebabAction[] = [...Kebab.getExtensionsActionsForKind(TaskModel), ...Kebab.factory.common];

const kind = TaskModel.kind;

const tableColumnClasses = [
    classNames('col-xs-6', 'col-sm-4'),
    classNames('col-xs-6', 'col-sm-4'),
    classNames('col-sm-4', 'hidden-xs'),
    Kebab.columnClass,
  ];


const TaskTableHeader = () => {
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

  TaskTableHeader.displayName = 'TaskTableHeader';

  
const TaskTableRow: RowFunction<K8sResourceKind> = ({ obj: task, index, key, style }) => {
    return (
      <TableRow id={task.metadata.uid} index={index} trKey={key} style={style}>
        <TableData className={tableColumnClasses[0]}>
          <ResourceLink kind={kind} name={task.metadata.name} namespace={task.metadata.namespace} title={task.metadata.uid} />
        </TableData>
        <TableData className={classNames(tableColumnClasses[1], 'co-break-word')}>
            <ResourceLink kind="Namespace" name={task.metadata.namespace} title={task.metadata.namespace} />
        </TableData>
        <TableData className={tableColumnClasses[2]}>
          <Timestamp timestamp={task.metadata.creationTimestamp} />
        </TableData>
        <TableData className={tableColumnClasses[3]}>
        <ResourceKebab actions={menuActions} kind={kind} resource={task} />
      </TableData>
      </TableRow>
    );
  };

  export const TaskDetailsList: React.FC<TaskDetailsListProps> = ({ ds }) => (
    <dl className="co-m-pane__details">
      <DetailsItem label="Current Count" obj={ds} path="status.currentNumberScheduled" />
      <DetailsItem label="Desired Count" obj={ds} path="status.desiredNumberScheduled" />
    </dl>
  );

  
const TaskDetails: React.FC<TaskDetailsProps> = ({ obj: task }) => (
    <>
      <div className="co-m-pane__body">
        <SectionHeading text="Federated Job Details" />
        <div className="row">
          <div className="col-lg-6">
            <ResourceSummary resource={task} showPodSelector showNodeSelector showTolerations />
          </div>
          <div className="col-lg-6">
            <TaskDetailsList ds={task} />
          </div>
        </div>
      </div>
      <div className="co-m-pane__body">
        <SectionHeading text="Containers" />
      </div>
    </>
  );

  
const { details, editYaml } = navFactory;

export const Tasks: React.FC = props => <Table {...props} aria-label="Tasks" Header={TaskTableHeader} Row={TaskTableRow} virtualize />;


export const TasksPage: React.FC<TasksPageProps> = props => <ListPage canCreate={true} ListComponent={Tasks} kind={kind} {...props} />;

export const TasksDetailsPage: React.FC<TasksDetailsPageProps> = props => <DetailsPage {...props} kind={kind} menuActions={menuActions} pages={[details(detailsPage(TaskDetails)), editYaml()]} />;


  type TaskDetailsListProps = {
    ds: K8sResourceKind;
  };

  type TasksPageProps = {
    showTitle?: boolean;
    namespace?: string;
    selector?: any;
  };

  type TaskDetailsProps = {
    obj: K8sResourceKind;
  };

  type TasksDetailsPageProps = {
    match: any;
  };