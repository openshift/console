import * as _ from 'lodash-es';
import * as React from 'react';
import * as classNames from 'classnames';
import { sortable } from '@patternfly/react-table';

import { K8sResourceKind } from '../../module/k8s';
import { DetailsPage, ListPage, Table, TableRow, TableData, RowFunction } from '../factory';
import { Kebab, KebabAction, detailsPage, Timestamp, navFactory, ResourceKebab, ResourceLink, ResourceSummary, SectionHeading } from '../utils';
import { TaskRunModel } from '../../models';
import { useTranslation } from 'react-i18next';
import { TFunction } from 'i18next';

export const menuActions: KebabAction[] = [...Kebab.getExtensionsActionsForKind(TaskRunModel), ...Kebab.factory.common];

const kind = TaskRunModel.kind;

const tableColumnClasses = [
  classNames('col-xs-6', 'col-sm-4'),
  classNames('col-xs-6', 'col-sm-4'),
  classNames('col-sm-4', 'hidden-xs'),
  Kebab.columnClass,
];


const TaskRunTableHeader = (t?: TFunction) => {
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


const TaskRunDetails: React.FC<TaskRunDetailsProps> = ({ obj: taskRun }) => {
  const { t } = useTranslation();

  return (
    <>
      <div className="co-m-pane__body">
        <SectionHeading text={`${t('COMMON:MSG_LNB_MENU_58')} ${t('COMMON:MSG_DETAILS_TABOVERVIEW_1')}`} />
        <div className="row">
          <div className="col-lg-6">
            <ResourceSummary resource={taskRun} />
          </div>
        </div>
      </div>
    </>
  );
}

const { details, editYaml } = navFactory;

export const TaskRuns: React.FC = props => {
  const { t } = useTranslation();
  return <Table {...props} aria-label="Task Runs" Header={TaskRunTableHeader.bind(null, t)} Row={TaskRunTableRow} virtualize />;
}


export const TaskRunsPage: React.FC<TaskRunsPageProps> = props => {
  const { t } = useTranslation();

  return <ListPage
    title={t('COMMON:MSG_LNB_MENU_58')}
    createButtonText={t('COMMON:MSG_MAIN_CREATEBUTTON_1', { 0: t('COMMON:MSG_LNB_MENU_58') })}
    canCreate={true}
    ListComponent={TaskRuns}
    kind={kind}
    {...props}
  />;
}

export const TaskRunsDetailsPage: React.FC<TaskRunsDetailsPageProps> = props => <DetailsPage {...props} kind={kind} menuActions={menuActions} pages={[details(detailsPage(TaskRunDetails)), editYaml()]} />;

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