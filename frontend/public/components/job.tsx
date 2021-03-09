import * as React from 'react';
import * as _ from 'lodash';
import { Link } from 'react-router-dom';
import * as classNames from 'classnames';
import { sortable } from '@patternfly/react-table';
import { useTranslation } from 'react-i18next';
import { TFunction } from 'i18next';
import { Status } from '@console/shared';
import { getJobTypeAndCompletions, K8sKind, JobKind, K8sResourceKind } from '../module/k8s';
import { Conditions } from './conditions';
import { DetailsPage, ListPage, Table, TableRow, TableData, RowFunction } from './factory';
import { configureJobParallelismModal } from './modals';
import { ContainerTable, DetailsItem, Kebab, KebabAction, LabelList, PodsComponent, ResourceKebab, ResourceLink, ResourceSummary, SectionHeading, Timestamp, navFactory, pluralize } from './utils';
import { ResourceEventStream } from './events';
import { JobModel } from '../models';

const ModifyJobParallelism: KebabAction = (kind: K8sKind, obj: JobKind) => {
  const { t } = useTranslation();
  return {
    label: t('COMMON:MSG_MAIN_ACTIONBUTTON_10'),
    callback: () =>
      configureJobParallelismModal({
        resourceKind: kind,
        resource: obj,
      }),
    accessReview: {
      group: kind.apiGroup,
      resource: kind.plural,
      name: obj.metadata.name,
      namespace: obj.metadata.namespace,
      verb: 'patch',
    },
  };
};
const menuActions: KebabAction[] = [ModifyJobParallelism, ...Kebab.getExtensionsActionsForKind(JobModel), ...Kebab.factory.common];

const kind = 'Job';

const tableColumnClasses = [classNames('col-lg-2', 'col-md-3', 'col-sm-4', 'col-xs-6'), classNames('col-lg-2', 'col-md-3', 'col-sm-4', 'col-xs-6'), classNames('col-lg-3', 'col-md-4', 'col-sm-4', 'hidden-xs'), classNames('col-lg-2', 'col-md-2', 'hidden-sm', 'hidden-xs'), classNames('col-lg-1', 'hidden-md', 'hidden-sm', 'hidden-xs'), classNames('col-lg-2', 'hidden-md', 'hidden-sm', 'hidden-xs'), Kebab.columnClass];

const JobTableHeader = (t?: TFunction) => {
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
      title: t('COMMON:MSG_MAIN_TABLEHEADER_15'),
      sortField: 'metadata.labels',
      transforms: [sortable],
      props: { className: tableColumnClasses[2] },
    },
    {
      title: t('COMMON:MSG_MAIN_TABLEHEADER_22'),
      sortFunc: 'jobCompletions',
      transforms: [sortable],
      props: { className: tableColumnClasses[3] },
    },
    {
      title: t('COMMON:MSG_MAIN_TABLEHEADER_17'),
      sortFunc: 'jobType',
      transforms: [sortable],
      props: { className: tableColumnClasses[4] },
    },
    {
      title: t('COMMON:MSG_MAIN_TABLEHEADER_12'),
      sortFunc: 'metadata.creationTimestamp',
      transforms: [sortable],
      props: { className: tableColumnClasses[5] },
    },
    {
      title: '',
      props: { className: tableColumnClasses[6] },
    },
  ];
};
JobTableHeader.displayName = 'JobTableHeader';

const JobTableRow: RowFunction<JobKind> = ({ obj: job, index, key, style }) => {
  const { type, completions } = getJobTypeAndCompletions(job);
  return (
    <TableRow id={job.metadata.uid} index={index} trKey={key} style={style}>
      <TableData className={tableColumnClasses[0]}>
        <ResourceLink kind={kind} name={job.metadata.name} namespace={job.metadata.namespace} title={job.metadata.uid} />
      </TableData>
      <TableData className={classNames(tableColumnClasses[1], 'co-break-word')}>
        <ResourceLink kind="Namespace" name={job.metadata.namespace} title={job.metadata.namespace} />
      </TableData>
      <TableData className={tableColumnClasses[2]}>
        <LabelList kind={kind} labels={job.metadata.labels} />
      </TableData>
      <TableData className={tableColumnClasses[3]}>
        <Link to={`/k8s/ns/${job.metadata.namespace}/jobs/${job.metadata.name}/pods`} title="pods">
          {job.status.succeeded || 0} of {completions}
        </Link>
      </TableData>
      <TableData className={tableColumnClasses[4]}>{type}</TableData>
      <TableData className={tableColumnClasses[5]}>
        <Timestamp timestamp={job.metadata.creationTimestamp} />
      </TableData>
      <TableData className={tableColumnClasses[6]}>
        <ResourceKebab actions={menuActions} kind="Job" resource={job} />
      </TableData>
    </TableRow>
  );
};

const jobStatus = (job: JobKind): string => {
  return job && job.status ? _.get(job, 'status.conditions[0].type', 'In Progress') : null;
};

const JobDetails: React.FC<JobsDetailsProps> = ({ obj: job }) => {
  const { t } = useTranslation();
  return (
    <>
      <div className="co-m-pane__body">
        <div className="row">
          <div className="col-md-6">
            <SectionHeading text={`${t('COMMON:MSG_LNB_MENU_29')} ${t('COMMON:MSG_DETAILS_TABOVERVIEW_1')}`} />
            <ResourceSummary resource={job} showPodSelector>
              <DetailsItem label={t('COMMON:MSG_DETAILS_TABDETAILS_DETAILS_35')} obj={job} path="spec.completions" />
              <DetailsItem label={t('COMMON:MSG_DETAILS_TABDETAILS_DETAILS_36')} obj={job} path="spec.parallelism" />
              <DetailsItem label={t('COMMON:MSG_DETAILS_TABDETAILS_DETAILS_37')} obj={job} path="spec.activeDeadlineSeconds">
                {job.spec.activeDeadlineSeconds ? pluralize(job.spec.activeDeadlineSeconds, 'second') : 'Not Configured'}
              </DetailsItem>
            </ResourceSummary>
          </div>
          <div className="col-md-6">
            <SectionHeading text={t('SINGLE:MSG_JOBS_JOBDETAILS_TABDETAILS_JOBSTATUS_1')} />
            <dl className="co-m-pane__details">
              <dt>{t('SINGLE:MSG_JOBS_JOBDETAILS_TABDETAILS_JOBSTATUS_2')}</dt>
              <dd>
                <Status status={jobStatus(job)} />
              </dd>
              <DetailsItem label={t('SINGLE:MSG_JOBS_JOBDETAILS_TABDETAILS_JOBSTATUS_3')} obj={job} path="status.startTime">
                <Timestamp timestamp={job.status.startTime} />
              </DetailsItem>
              <DetailsItem label={t('SINGLE:MSG_JOBS_JOBDETAILS_TABDETAILS_JOBSTATUS_4')} obj={job} path="status.completionTime">
                <Timestamp timestamp={job.status.completionTime} />
              </DetailsItem>
              <DetailsItem label={t('SINGLE:MSG_JOBS_JOBDETAILS_TABDETAILS_JOBSTATUS_5')} obj={job} path="status.succeeded" defaultValue="0" />
              <DetailsItem label={t('SINGLE:MSG_JOBS_JOBDETAILS_TABDETAILS_JOBSTATUS_6')} obj={job} path="status.active" defaultValue="0" />
              <DetailsItem label={t('SINGLE:MSG_JOBS_JOBDETAILS_TABDETAILS_JOBSTATUS_7')} obj={job} path="status.failed" defaultValue="0" />
            </dl>
          </div>
        </div>
      </div>
      <div className="co-m-pane__body">
        <SectionHeading text={t('COMMON:MSG_DETAILS_TABDETAILS_CONTAINERS_TABLEHEADER_1')} />
        <ContainerTable containers={job.spec.template.spec.containers} />
      </div>
      <div className="co-m-pane__body">
        <SectionHeading text={t('COMMON:MSG_DETAILS_TABDETAILS_CONDITIONS_1')} />
        <Conditions conditions={job.status.conditions} />
      </div>
    </>
  );
};

const JobPods: React.FC<JobPodsProps> = props => <PodsComponent {...props} customData={{ showNodes: true }} />;

const { details, pods, editYaml, events } = navFactory;
const JobsDetailsPage: React.FC<JobsDetailsPageProps> = props => <DetailsPage {...props} getResourceStatus={jobStatus} kind={kind} menuActions={menuActions} pages={[details(JobDetails), editYaml(), pods(JobPods), events(ResourceEventStream)]} />;
const JobsList: React.FC = props => {
  const { t } = useTranslation();
  return <Table {...props} aria-label={JobModel.labelPlural} Header={JobTableHeader.bind(null, t)} Row={JobTableRow} virtualize />;
};

const JobsPage: React.FC<JobsPageProps> = props => {
  const { t } = useTranslation();
  return <ListPage title={t('COMMON:MSG_LNB_MENU_29')} createButtonText={t('COMMON:MSG_MAIN_CREATEBUTTON_1', { 0: t('COMMON:MSG_LNB_MENU_29') })} ListComponent={JobsList} kind={kind} canCreate={true} {...props} />;
};
export { JobsList, JobsPage, JobsDetailsPage };

type JobsDetailsProps = {
  obj: JobKind;
};

type JobsPageProps = {
  showTitle?: boolean;
  namespace?: string;
  selector?: any;
};

type JobPodsProps = {
  obj: K8sResourceKind;
};

type JobsDetailsPageProps = {
  match: any;
};
