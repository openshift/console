import * as React from 'react';
import { Link } from 'react-router-dom';
import * as classNames from 'classnames';
import { sortable } from '@patternfly/react-table';
import { useTranslation } from 'react-i18next';
import { TFunction } from 'i18next';

import { AddHealthChecks, EditHealthChecks } from '@console/app/src/actions/modify-health-checks';
import { K8sResourceKind } from '../../module/k8s';
import { DetailsPage, ListPage, Table, TableRow, TableData, RowFunction } from '../factory';
import { DetailsItem, Kebab, KebabAction, detailsPage, LabelList, navFactory, ResourceKebab, ResourceLink, ResourceSummary, SectionHeading, Selector } from '../utils';
import { ResourceEventStream } from '../events';
import { FederatedJobModel } from '../../models';

export const menuActions: KebabAction[] = [AddHealthChecks, Kebab.factory.AddStorage, ...Kebab.getExtensionsActionsForKind(FederatedJobModel), EditHealthChecks, ...Kebab.factory.common];

const kind = FederatedJobModel.kind;

const tableColumnClasses = ['', '', classNames('pf-m-hidden', 'pf-m-visible-on-sm', 'pf-u-w-16-on-lg'), classNames('pf-m-hidden', 'pf-m-visible-on-lg'), classNames('pf-m-hidden', 'pf-m-visible-on-lg'), Kebab.columnClass];

const FederatedJobTableHeader = (t?: TFunction) => {
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
      sortFunc: 'jobNumScheduled',
      transforms: [sortable],
      props: { className: tableColumnClasses[2] },
    },
    {
      title: t('COMMON:MSG_MAIN_TABLEHEADER_15'),
      sortField: 'metadata.labels',
      transforms: [sortable],
      props: { className: tableColumnClasses[3] },
    },
    {
      title: t('COMMON:MSG_MAIN_TABLEHEADER_16'),
      sortField: 'spec.selector',
      transforms: [sortable],
      props: { className: tableColumnClasses[4] },
    },
    {
      title: '',
      props: { className: tableColumnClasses[5] },
    },
  ];
};
FederatedJobTableHeader.displayName = 'FederatedJobTableHeader';

const FederatedJobTableRow: RowFunction<K8sResourceKind> = ({ obj: job, index, key, style }) => {
  return (
    <TableRow id={job.metadata.uid} index={index} trKey={key} style={style}>
      <TableData className={tableColumnClasses[0]}>
        <ResourceLink kind={kind} name={job.metadata.name} namespace={job.metadata.namespace} title={job.metadata.uid} />
      </TableData>
      <TableData className={classNames(tableColumnClasses[1], 'co-break-word')}>
        <ResourceLink kind="Namespace" name={job.metadata.namespace} title={job.metadata.namespace} />
      </TableData>
      <TableData className={tableColumnClasses[2]}>
        <Link to={`/k8s/ns/${job.metadata.namespace}/jobs/${job.metadata.name}/pods`} title="pods">
          {job.status.currentNumberScheduled} of {job.status.desiredNumberScheduled} pods
        </Link>
      </TableData>
      <TableData className={tableColumnClasses[3]}>
        <LabelList kind={kind} labels={job.metadata.labels} />
      </TableData>
      <TableData className={tableColumnClasses[4]}>
        <Selector selector={job.spec.selector} namespace={job.metadata.namespace} />
      </TableData>
      <TableData className={tableColumnClasses[5]}>
        <ResourceKebab actions={menuActions} kind={kind} resource={job} />
      </TableData>
    </TableRow>
  );
};

export const FederatedJobDetailsList: React.FC<FederatedJobDetailsListProps> = ({ ds }) => {
  const { t } = useTranslation();
  return (
  <dl className="co-m-pane__details">
  <DetailsItem label={t('COMMON:MSG_DETAILS_TABDETAILS_DETAILS_38')} obj={ds} path="status.currentNumberScheduled" />
  <DetailsItem label={t('COMMON:MSG_DETAILS_TABDETAILS_DETAILS_39')} obj={ds} path="status.desiredNumberScheduled" />
  </dl>
);}

const FederatedJobDetails: React.FC<FederatedJobDetailsProps> = ({ obj: job }) => {
  const { t } = useTranslation();
  return (
  <>
    <div className="co-m-pane__body">
    <SectionHeading text={`${t('COMMON:MSG_MAIN_DIV1_3', { 0: t('COMMON:MSG_LNB_MENU_29') })} ${t('COMMON:MSG_DETAILS_TABOVERVIEW_1')}`} />
      <div className="row">
        <div className="col-lg-6">
          <ResourceSummary resource={job} showPodSelector showNodeSelector showTolerations />
        </div>
        <div className="col-lg-6">
          <FederatedJobDetailsList ds={job} />
        </div>
      </div>
    </div>
    <div className="co-m-pane__body">
      <SectionHeading text={t('COMMON:MSG_DETAILS_TABDETAILS_CONTAINERS_TABLEHEADER_1')} />
    </div>
  </>
);}

const { details, editYaml, events } = navFactory;
export const FederatedJobs: React.FC = props => {
  const { t } = useTranslation();
  return <Table {...props} aria-label="Federated Jobs" Header={FederatedJobTableHeader.bind(null, t)} Row={FederatedJobTableRow} virtualize />;
}

export const FederatedJobsPage: React.FC<FederatedJobsPageProps> = props => <ListPage canCreate={true} ListComponent={FederatedJobs} kind={kind} {...props} />;

export const FederatedJobsDetailsPage: React.FC<FederatedJobsDetailsPageProps> = props => <DetailsPage {...props} kind={kind} menuActions={menuActions} pages={[details(detailsPage(FederatedJobDetails)), editYaml(), events(ResourceEventStream)]} />;

type FederatedJobDetailsListProps = {
  ds: K8sResourceKind;
};

type FederatedJobDetailsProps = {
  obj: K8sResourceKind;
};

type FederatedJobsPageProps = {
  showTitle?: boolean;
  namespace?: string;
  selector?: any;
};

type FederatedJobsDetailsPageProps = {
  match: any;
};
