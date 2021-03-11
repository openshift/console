import * as _ from 'lodash-es';
import * as React from 'react';
import * as classNames from 'classnames';
import { sortable } from '@patternfly/react-table';
import { useTranslation } from 'react-i18next';
import { TFunction } from 'i18next';
import { DetailsPage, ListPage, Table, TableRow, TableData, RowFunction } from './factory';
import { CronJobKind } from '../module/k8s';
import { ContainerTable, DetailsItem, Kebab, ResourceKebab, ResourceLink, ResourceSummary, SectionHeading, Timestamp, navFactory, pluralize } from './utils';
import { ResourceEventStream } from './events';
import { CronJobModel } from '../models';
import { ResourceLabel } from '../models/hypercloud/resource-plural';

const { common } = Kebab.factory;
const menuActions = [...Kebab.getExtensionsActionsForKind(CronJobModel), ...common];

const kind = 'CronJob';

const tableColumnClasses = [classNames('col-lg-2', 'col-md-3', 'col-sm-4', 'col-xs-6'), classNames('col-lg-2', 'col-md-3', 'col-sm-4', 'col-xs-6'), classNames('col-lg-2', 'col-md-3', 'col-sm-4', 'hidden-xs'), classNames('col-lg-3', 'col-md-3', 'hidden-sm', 'hidden-xs'), classNames('col-lg-3', 'hidden-md', 'hidden-sm', 'hidden-xs'), Kebab.columnClass];

const CronJobTableHeader = (t?: TFunction) => {
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
      title: t('COMMON:MSG_MAIN_TABLEHEADER_19'),
      sortField: 'spec.schedule',
      transforms: [sortable],
      props: { className: tableColumnClasses[2] },
    },
    {
      title: t('COMMON:MSG_MAIN_TABLEHEADER_20'),
      sortField: 'spec.concurrencyPolicy',
      transforms: [sortable],
      props: { className: tableColumnClasses[3] },
    },
    {
      title: t('COMMON:MSG_MAIN_TABLEHEADER_21'),
      sortField: 'spec.startingDeadlineSeconds',
      transforms: [sortable],
      props: { className: tableColumnClasses[4] },
    },
    {
      title: '',
      props: { className: tableColumnClasses[5] },
    },
  ];
};
CronJobTableHeader.displayName = 'CronJobTableHeader';

const CronJobTableRow: RowFunction<CronJobKind> = ({ obj: cronjob, index, key, style }) => {
  return (
    <TableRow id={cronjob.metadata.uid} index={index} trKey={key} style={style}>
      <TableData className={tableColumnClasses[0]}>
        <ResourceLink kind={kind} name={cronjob.metadata.name} title={cronjob.metadata.name} namespace={cronjob.metadata.namespace} />
      </TableData>
      <TableData className={classNames(tableColumnClasses[1], 'co-break-word')}>
        <ResourceLink kind="Namespace" name={cronjob.metadata.namespace} title={cronjob.metadata.namespace} />
      </TableData>
      <TableData className={tableColumnClasses[2]}>{cronjob.spec.schedule}</TableData>
      <TableData className={tableColumnClasses[3]}>{_.get(cronjob.spec, 'concurrencyPolicy', '-')}</TableData>
      <TableData className={tableColumnClasses[4]}>{_.get(cronjob.spec, 'startingDeadlineSeconds', '-')}</TableData>
      <TableData className={tableColumnClasses[5]}>
        <ResourceKebab actions={menuActions} kind={kind} resource={cronjob} />
      </TableData>
    </TableRow>
  );
};

const CronJobDetails: React.FC<CronJobDetailsProps> = ({ obj: cronjob }) => {
  const { t } = useTranslation();
  const job = cronjob.spec.jobTemplate;
  return (
    <>
      <div className="co-m-pane__body">
        <div className="row">
          <div className="col-md-6">
            <SectionHeading text={t('COMMON:MSG_DETAILS_TABDETAILS_DETAILS_1', { 0: ResourceLabel(cronjob, t) })} />
            <ResourceSummary resource={cronjob}>
              <DetailsItem label={t('COMMON:MSG_MAIN_TABLEHEADER_19')} obj={cronjob} path="spec.schedule" />
              <DetailsItem label={t('COMMON:MSG_MAIN_TABLEHEADER_20')} obj={cronjob} path="spec.concurrencyPolicy" />
              <DetailsItem label={t('COMMON:MSG_MAIN_TABLEHEADER_21')} obj={cronjob} path="spec.startingDeadlineSeconds">
                {cronjob.spec.startingDeadlineSeconds ? pluralize(cronjob.spec.startingDeadlineSeconds, 'second') : t('COMMON:MSG_DETAILS_TABDETAILS_DETAILS_33')}
              </DetailsItem>
              <DetailsItem label={t('COMMON:MSG_DETAILS_TABDETAILS_DETAILS_34')} obj={cronjob} path="status.lastScheduleTime">
                <Timestamp timestamp={cronjob.status.lastScheduleTime} />
              </DetailsItem>
            </ResourceSummary>
          </div>
          <div className="col-md-6">
            <SectionHeading text={`${t('COMMON:MSG_LNB_MENU_29')} ${t('COMMON:MSG_DETAILS_TABOVERVIEW_1')}`} />
            <dl className="co-m-pane__details">
              <DetailsItem label={t('COMMON:MSG_DETAILS_TABDETAILS_DETAILS_35')} obj={cronjob} path="spec.jobTemplate.spec.completions" />
              <DetailsItem label={t('COMMON:MSG_DETAILS_TABDETAILS_DETAILS_36')} obj={cronjob} path="spec.jobTemplate.spec.parallelism" />
              <DetailsItem label={t('COMMON:MSG_DETAILS_TABDETAILS_DETAILS_37')} obj={cronjob} path="spec.jobTemplate.spec.activeDeadlineSeconds">
                {job.spec.activeDeadlineSeconds ? pluralize(job.spec.activeDeadlineSeconds, 'second') : t('COMMON:MSG_DETAILS_TABDETAILS_DETAILS_33')}
              </DetailsItem>
            </dl>
          </div>
        </div>
      </div>
      <div className="co-m-pane__body">
        <SectionHeading text={t('COMMON:MSG_DETAILS_TABDETAILS_CONTAINERS_TABLEHEADER_1')} />
        <ContainerTable containers={job.spec.template.spec.containers} />
      </div>
    </>
  );
};

export const CronJobsList: React.FC = props => {
  const { t } = useTranslation();
  return <Table {...props} aria-label={CronJobModel.labelPlural} Header={CronJobTableHeader.bind(null, t)} Row={CronJobTableRow} virtualize />;
};

export const CronJobsPage: React.FC<CronJobsPageProps> = props => {
  const { t } = useTranslation();
  return <ListPage {...props} title={t('COMMON:MSG_LNB_MENU_28')} createButtonText={t('COMMON:MSG_MAIN_CREATEBUTTON_1', { 0: t('COMMON:MSG_LNB_MENU_28') })} ListComponent={CronJobsList} kind={kind} canCreate={true} />;
};

export const CronJobsDetailsPage: React.FC<CronJobsDetailsPageProps> = props => <DetailsPage {...props} kind={kind} menuActions={menuActions} pages={[navFactory.details(CronJobDetails), navFactory.editYaml(), navFactory.events(ResourceEventStream)]} />;

type CronJobDetailsProps = {
  obj: CronJobKind;
};

type CronJobsPageProps = {
  showTitle?: boolean;
  namespace?: string;
  selector?: any;
};

type CronJobsDetailsPageProps = {
  match: any;
};
