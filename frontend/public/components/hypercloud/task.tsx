import * as _ from 'lodash-es';
import * as React from 'react';
import * as classNames from 'classnames';
import { sortable } from '@patternfly/react-table';

import { K8sResourceKind } from '../../module/k8s';
import { DetailsPage, ListPage, Table, TableRow, TableData, RowFunction } from '../factory';
import { Kebab, KebabAction, detailsPage, Timestamp, navFactory, ResourceKebab, ResourceLink, ResourceSummary, SectionHeading } from '../utils';
import { TaskModel } from '../../models';
import { useTranslation } from 'react-i18next';
import { TFunction } from 'i18next';

export const menuActions: KebabAction[] = [...Kebab.getExtensionsActionsForKind(TaskModel), ...Kebab.factory.common];

const kind = TaskModel.kind;

const tableColumnClasses = [
  classNames('col-xs-6', 'col-sm-4'),
  classNames('col-xs-6', 'col-sm-4'),
  classNames('col-sm-4', 'hidden-xs'),
  Kebab.columnClass,
];


const TaskTableHeader = (t?: TFunction) => {
  return [
    {
      title: t('COMMON:MSG_MAIN_TABLEHEADER_1'),
      sortField: 'metadata.name',
      transforms: [sortable],
      props: { className: tableColumnClasses[0] },
    },
    {
      title: t('COMMON:MSG_MAIN_TABLEHEADER_2'),
      sortField: 'metadata.namespace',
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


const TaskDetails: React.FC<TaskDetailsProps> = ({ obj: task }) => {
  const { t } = useTranslation();

  return (
    <>
      <div className="co-m-pane__body">
        <SectionHeading text={`${t('COMMON:MSG_LNB_MENU_57')} ${t('COMMON:MSG_DETAILS_TABOVERVIEW_1')}`} />
        <div className="row">
          <div className="col-lg-6">
            <ResourceSummary resource={task} />
          </div>
        </div>
      </div>
    </>
  );
}


const { details, editYaml } = navFactory;

export const Tasks: React.FC = props => {
  const { t } = useTranslation();
  return <Table {...props} aria-label="Tasks" Header={TaskTableHeader.bind(null, t)} Row={TaskTableRow} virtualize />;
}


export const TasksPage: React.FC<TasksPageProps> = props => {
  const { t } = useTranslation();

  return <ListPage
    title={t('COMMON:MSG_LNB_MENU_57')}
    createButtonText={t('COMMON:MSG_MAIN_CREATEBUTTON_1', { 0: t('COMMON:MSG_LNB_MENU_57') })}
    canCreate={true}
    ListComponent={Tasks}
    kind={kind}
    {...props}
  />;
}

export const TasksDetailsPage: React.FC<TasksDetailsPageProps> = props => <DetailsPage {...props} kind={kind} menuActions={menuActions} pages={[details(detailsPage(TaskDetails)), editYaml()]} />;

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