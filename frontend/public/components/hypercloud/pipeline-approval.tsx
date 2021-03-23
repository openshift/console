import * as _ from 'lodash-es';
import * as React from 'react';
import * as classNames from 'classnames';
import { sortable } from '@patternfly/react-table';
import { Status } from '@console/shared';
import { K8sResourceKind } from '../../module/k8s';
import { DetailsPage, ListPage, Table, TableRow, TableData, RowFunction } from '../factory';
import { DetailsItem, Kebab, KebabAction, detailsPage, Timestamp, navFactory, ResourceKebab, ResourceLink, ResourceSummary, SectionHeading } from '../utils';
import { ApprovalModel } from '../../models';
import { useTranslation } from 'react-i18next';
import { TFunction } from 'i18next';
import { ResourceLabel } from '../../models/hypercloud/resource-plural';

export const menuActions: KebabAction[] = [...Kebab.getExtensionsActionsForKind(ApprovalModel), ...Kebab.factory.common, Kebab.factory.ModifyStatus];

const kind = ApprovalModel.kind;

const tableColumnClasses = [
  '',
  '',
  classNames('pf-m-hidden', 'pf-m-visible-on-lg'),
  classNames('pf-m-hidden', 'pf-m-visible-on-lg'),
  Kebab.columnClass,
];


const PipelineApprovalTableHeader = (t?: TFunction) => {
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
      title: t('COMMON:MSG_MAIN_TABLEHEADER_3'),
      sortField: 'status.result',
      transforms: [sortable],
      props: { className: tableColumnClasses[2] },
    },
    {
      title: t('COMMON:MSG_MAIN_TABLEHEADER_12'),
      sortField: 'metadata.creationTimestamp',
      transforms: [sortable],
      props: { className: tableColumnClasses[3] },
    },
    {
      title: '',
      props: { className: tableColumnClasses[4] },
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
      <TableData className={classNames(tableColumnClasses[2], 'co-break-word')}>
        <Status status={pipelineApproval.status.result} />
      </TableData>
      <TableData className={tableColumnClasses[3]}>
        <Timestamp timestamp={pipelineApproval.metadata.creationTimestamp} />
      </TableData>
      <TableData className={tableColumnClasses[4]}>
        <ResourceKebab actions={menuActions} kind={kind} resource={pipelineApproval} />
      </TableData>
    </TableRow>
  );
};

export const PipelineApprovalDetailsList: React.FC<PipelineApprovalDetailsListProps> = ({ ds }) => {
  const { t } = useTranslation();

  const time = ds.status.decisionTime?.replace('T', ' ').replaceAll('-', '.').replace('Z', '');

  return (
    <dl className="co-m-pane__details">
      <DetailsItem label={t('COMMON:MSG_MAIN_TABLEHEADER_3')} obj={ds} path="status.result">
        <Status status={ds.status.result} />
      </DetailsItem>
      <DetailsItem label={t('COMMON:MSG_DETAILS_TABDETAILS_18')} obj={ds} path="status.decisionTime">
        {time}
      </DetailsItem>
      <DetailsItem label={t('COMMON:MSG_DETAILS_TABDETAILS_19')} obj={ds} path="spec.users">
        {ds.spec.users.map(user => <div>{user}</div>)}
      </DetailsItem>
      <DetailsItem label={t('COMMON:MSG_DETAILS_TABDETAILS_20')} obj={ds} path="status.reason">
        {ds.status.reason}
      </DetailsItem>
    </dl>
  );
}


const PipelineApprovalDetails: React.FC<PipelineApprovalDetailsProps> = ({ obj: pipelineApproval }) => {
  const { t } = useTranslation();
  return (
    <>
      <div className="co-m-pane__body">
        <SectionHeading text={t('COMMON:MSG_DETAILS_TABDETAILS_DETAILS_1', { 0: ResourceLabel(pipelineApproval, t) })} />
        <div className="row">
          <div className="col-lg-6">
            <ResourceSummary resource={pipelineApproval} showPodSelector={false} showNodeSelector={false} showTolerations={false} />
          </div>
          <div className="col-lg-6">
            <PipelineApprovalDetailsList ds={pipelineApproval} />
          </div>
        </div>
      </div>
    </>
  );
}


const { details, editYaml } = navFactory;

export const PipelineApprovals: React.FC = props => {
  const { t } = useTranslation();
  return <Table {...props} aria-label="Pipeline Approvals" Header={PipelineApprovalTableHeader.bind(null, t)} Row={PipelineApprovalTableRow} virtualize />
};

const pipelineApprovalStatusReducer = (pipelineApproval: any): string => {
  return pipelineApproval.status.result;
}

const filters = (t) => [
  {
    filterGroupName: t('COMMON:MSG_COMMON_FILTER_10'),
    type: 'pipeline-approval-status',
    reducer: pipelineApprovalStatusReducer,
    items: [
      { id: 'Approved', title: 'Approved' },
      { id: 'Waiting', title: 'Waiting' },
      { id: 'Rejected', title: 'Rejected' },
    ],
  },
];

export const PipelineApprovalsPage: React.FC<PipelineApprovalsPageProps> = props => {
  const { t } = useTranslation();

  return <ListPage
    title={t('COMMON:MSG_LNB_MENU_61')}
    createButtonText={t('COMMON:MSG_MAIN_CREATEBUTTON_1', { 0: t('COMMON:MSG_LNB_MENU_61') })}
    canCreate={true}
    ListComponent={PipelineApprovals}
    kind={kind}
    {...props}
    rowFilters={filters.bind(null, t)()}
  />;
}

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