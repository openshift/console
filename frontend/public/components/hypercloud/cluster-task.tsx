import * as _ from 'lodash-es';
import * as React from 'react';
import * as classNames from 'classnames';
import { sortable } from '@patternfly/react-table';

import { K8sResourceKind } from '../../module/k8s';
import { DetailsPage, ListPage, Table, TableRow, TableData, RowFunction } from '../factory';
import { DetailsItem, Kebab, KebabAction, detailsPage, Timestamp, navFactory, ResourceKebab, ResourceLink, ResourceSummary, SectionHeading } from '../utils';
import { ClusterTaskModel } from '../../models';

export const menuActions: KebabAction[] = [...Kebab.getExtensionsActionsForKind(ClusterTaskModel), ...Kebab.factory.common];

const kind = ClusterTaskModel.kind;

const tableColumnClasses = [
    classNames('col-xs-6', 'col-sm-4'),
    classNames('col-xs-6', 'col-sm-4'),
    classNames('col-sm-4', 'hidden-xs'),
    Kebab.columnClass,
  ];


const ClusterTaskTableHeader = () => {
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

  ClusterTaskTableHeader.displayName = 'ClusterTaskTableHeader';

  
const ClusterTaskTableRow: RowFunction<K8sResourceKind> = ({ obj: task, index, key, style }) => {
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

  export const ClusterTaskDetailsList: React.FC<ClusterTaskDetailsListProps> = ({ ds }) => (
    <dl className="co-m-pane__details">
      <DetailsItem label="Current Count" obj={ds} path="status.currentNumberScheduled" />
      <DetailsItem label="Desired Count" obj={ds} path="status.desiredNumberScheduled" />
    </dl>
  );

  
const ClusterTaskDetails: React.FC<ClusterTaskDetailsProps> = ({ obj: task }) => (
    <>
      <div className="co-m-pane__body">
        <SectionHeading text="ClusterTask Details" />
        <div className="row">
          <div className="col-lg-6">
            <ResourceSummary resource={task} showPodSelector showNodeSelector showTolerations />
          </div>
          <div className="col-lg-6">
            <ClusterTaskDetailsList ds={task} />
          </div>
        </div>
      </div>
      <div className="co-m-pane__body">
        <SectionHeading text="Containers" />
      </div>
    </>
  );

  
const { details, editYaml } = navFactory;

export const ClusterTasks: React.FC = props => <Table {...props} aria-label="ClusterTasks" Header={ClusterTaskTableHeader} Row={ClusterTaskTableRow} virtualize />;


export const ClusterTasksPage: React.FC<ClusterTasksPageProps> = props => <ListPage canCreate={true} ListComponent={ClusterTasks} kind={kind} {...props} />;

export const ClusterTasksDetailsPage: React.FC<ClusterTasksDetailsPageProps> = props => <DetailsPage {...props} kind={kind} menuActions={menuActions} pages={[details(detailsPage(ClusterTaskDetails)), editYaml()]} />;


  type ClusterTaskDetailsListProps = {
    ds: K8sResourceKind;
  };

  type ClusterTasksPageProps = {
    showTitle?: boolean;
    namespace?: string;
    selector?: any;
  };

  type ClusterTaskDetailsProps = {
    obj: K8sResourceKind;
  };

  type ClusterTasksDetailsPageProps = {
    match: any;
  };