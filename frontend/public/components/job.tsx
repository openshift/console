import * as React from 'react';
import { Link } from 'react-router-dom';
import * as classNames from 'classnames';
import { sortable } from '@patternfly/react-table';
import { useTranslation } from 'react-i18next';
import { Status } from '@console/shared';
import { getJobTypeAndCompletions, K8sKind, JobKind, K8sResourceKind } from '../module/k8s';
import { Conditions } from './conditions';
import { DetailsPage, ListPage, Table, TableRow, TableData, RowFunction } from './factory';
import { configureJobParallelismModal } from './modals';
import {
  ContainerTable,
  DetailsItem,
  Kebab,
  KebabAction,
  LabelList,
  PodsComponent,
  ResourceKebab,
  ResourceLink,
  ResourceSummary,
  SectionHeading,
  Timestamp,
  navFactory,
} from './utils';
import { ResourceEventStream } from './events';
import { JobModel } from '../models';

const ModifyJobParallelism: KebabAction = (kind: K8sKind, obj: JobKind) => ({
  // t('workload~Edit parallelism')
  labelKey: 'workload~Edit parallelism',
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
});
export const menuActions: KebabAction[] = [
  ModifyJobParallelism,
  ...Kebab.getExtensionsActionsForKind(JobModel),
  ...Kebab.factory.common,
];

const kind = 'Job';

const tableColumnClasses = [
  classNames('col-lg-2', 'col-md-3', 'col-sm-4', 'col-xs-6'),
  classNames('col-lg-2', 'col-md-3', 'col-sm-4', 'col-xs-6'),
  classNames('col-lg-4', 'col-md-4', 'col-sm-4', 'hidden-xs'),
  classNames('col-lg-2', 'col-md-2', 'hidden-sm', 'hidden-xs'),
  classNames('col-lg-2', 'hidden-md', 'hidden-sm', 'hidden-xs'),
  Kebab.columnClass,
];

const JobTableRow: RowFunction<JobKind> = ({ obj: job, index, key, style }) => {
  const { type, completions } = getJobTypeAndCompletions(job);
  return (
    <TableRow id={job.metadata.uid} index={index} trKey={key} style={style}>
      <TableData className={tableColumnClasses[0]}>
        <ResourceLink
          kind={kind}
          name={job.metadata.name}
          namespace={job.metadata.namespace}
          title={job.metadata.uid}
        />
      </TableData>
      <TableData
        className={classNames(tableColumnClasses[1], 'co-break-word')}
        columnID="namespace"
      >
        <ResourceLink
          kind="Namespace"
          name={job.metadata.namespace}
          title={job.metadata.namespace}
        />
      </TableData>
      <TableData className={tableColumnClasses[2]}>
        <LabelList kind={kind} labels={job.metadata.labels} />
      </TableData>
      <TableData className={tableColumnClasses[3]}>
        <Link to={`/k8s/ns/${job.metadata.namespace}/jobs/${job.metadata.name}/pods`} title="pods">
          <div>Desired {completions}</div>
          <div>Succeeded {job.status.succeeded || 0}</div>
        </Link>
      </TableData>
      <TableData className={tableColumnClasses[4]}>{type}</TableData>
      <TableData className={tableColumnClasses[5]}>
        <ResourceKebab actions={menuActions} kind="Job" resource={job} />
      </TableData>
    </TableRow>
  );
};

export const JobDetails: React.FC<JobsDetailsProps> = ({ obj: job }) => {
  const { t } = useTranslation();
  return (
    <>
      <div className="co-m-pane__body">
        <div className="row">
          <div className="col-md-6">
            <SectionHeading text={t('workload~Job details')} />
            <ResourceSummary resource={job} showPodSelector>
              <DetailsItem
                label={t('workload~Desired completions')}
                obj={job}
                path="spec.completions"
              />
              <DetailsItem label={t('workload~Parallelism')} obj={job} path="spec.parallelism" />
              <DetailsItem
                label={t('workload~Active deadline seconds')}
                obj={job}
                path="spec.activeDeadlineSeconds"
              >
                {job.spec.activeDeadlineSeconds
                  ? t('workload~second', { count: job.spec.activeDeadlineSeconds })
                  : t('workload~Not configured')}
              </DetailsItem>
            </ResourceSummary>
          </div>
          <div className="col-md-6">
            <SectionHeading text={t('workload~Job status')} />
            <dl className="co-m-pane__details">
              <dt>{t('workload~Status')}</dt>
              <dd>
                <Status
                  status={job?.status ? job?.status?.conditions?.[0]?.type || 'In progress' : null}
                />
              </dd>
              <DetailsItem label={t('workload~Start time')} obj={job} path="status.startTime">
                <Timestamp timestamp={job.status.startTime} />
              </DetailsItem>
              <DetailsItem
                label={t('workload~Completion time')}
                obj={job}
                path="status.completionTime"
              >
                <Timestamp timestamp={job.status.completionTime} />
              </DetailsItem>
              <DetailsItem
                label={t('workload~Succeeded pods')}
                obj={job}
                path="status.succeeded"
                defaultValue="0"
              />
              <DetailsItem
                label={t('workload~Active pods')}
                obj={job}
                path="status.active"
                defaultValue="0"
              />
              <DetailsItem
                label={t('workload~Failed pods')}
                obj={job}
                path="status.failed"
                defaultValue="0"
              />
            </dl>
          </div>
        </div>
      </div>
      <div className="co-m-pane__body">
        <SectionHeading text={t('workload~Containers')} />
        <ContainerTable containers={job.spec.template.spec.containers} />
      </div>
      <div className="co-m-pane__body">
        <SectionHeading text={t('workload~Conditions')} />
        <Conditions conditions={job.status.conditions} />
      </div>
    </>
  );
};

const JobPods: React.FC<JobPodsProps> = (props) => (
  <PodsComponent {...props} customData={{ showNodes: true }} />
);

const { details, pods, editYaml, events } = navFactory;
const JobsDetailsPage: React.FC<JobsDetailsPageProps> = (props) => {
  return (
    <DetailsPage
      {...props}
      getResourceStatus={(job: JobKind) =>
        job?.status ? job?.status?.conditions?.[0]?.type || 'In progress' : null
      }
      kind={kind}
      menuActions={menuActions}
      pages={[details(JobDetails), editYaml(), pods(JobPods), events(ResourceEventStream)]}
    />
  );
};
const JobsList: React.FC = (props) => {
  const { t } = useTranslation();
  const JobTableHeader = () => [
    {
      title: t('workload~Name'),
      sortField: 'metadata.name',
      transforms: [sortable],
      props: { className: tableColumnClasses[0] },
    },
    {
      title: t('workload~Namespace'),
      sortField: 'metadata.namespace',
      transforms: [sortable],
      props: { className: tableColumnClasses[1] },
      id: 'namespace',
    },
    {
      title: t('workload~Labels'),
      sortField: 'metadata.labels',
      transforms: [sortable],
      props: { className: tableColumnClasses[2] },
    },
    {
      title: t('workload~Completions'),
      sortFunc: 'jobCompletions',
      transforms: [sortable],
      props: { className: tableColumnClasses[3] },
    },
    {
      title: t('workload~Type'),
      sortFunc: 'jobType',
      transforms: [sortable],
      props: { className: tableColumnClasses[4] },
    },
    {
      title: '',
      props: { className: tableColumnClasses[5] },
    },
  ];

  return (
    <Table
      {...props}
      aria-label={JobModel.labelPlural}
      Header={JobTableHeader}
      Row={JobTableRow}
      virtualize
    />
  );
};

const JobsPage: React.FC<JobsPageProps> = (props) => (
  <ListPage ListComponent={JobsList} kind={kind} canCreate={true} {...props} />
);
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
