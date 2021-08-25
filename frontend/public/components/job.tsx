import * as React from 'react';
import { Link } from 'react-router-dom';
import * as classNames from 'classnames';
import { sortable } from '@patternfly/react-table';
import { useTranslation } from 'react-i18next';
import {
  Status,
  ActionServiceProvider,
  ActionMenu,
  LazyActionMenu,
  ActionMenuVariant,
} from '@console/shared';
import {
  getJobTypeAndCompletions,
  K8sKind,
  JobKind,
  K8sResourceKind,
  referenceForModel,
  referenceFor,
} from '../module/k8s';
import { Conditions } from './conditions';
import { DetailsPage, ListPage, Table, TableData, RowFunctionArgs } from './factory';
import { configureJobParallelismModal } from './modals';
import {
  ContainerTable,
  DetailsItem,
  Kebab,
  KebabAction,
  LabelList,
  PodsComponent,
  ResourceLink,
  ResourceSummary,
  SectionHeading,
  Timestamp,
  navFactory,
} from './utils';
import { ResourceEventStream } from './events';
import { JobModel } from '../models';

const ModifyJobParallelism: KebabAction = (kind: K8sKind, obj: JobKind) => ({
  // t('public~Edit parallelism')
  labelKey: 'public~Edit parallelism',
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
  'pf-u-w-25-on-2xl',
  'pf-u-w-25-on-2xl',
  'pf-m-hidden pf-m-visible-on-md pf-u-w-25-on-2xl',
  'pf-m-hidden pf-m-visible-on-lg',
  'pf-m-hidden pf-m-visible-on-xl',
  Kebab.columnClass,
];

const JobTableRow: React.FC<RowFunctionArgs<JobKind>> = ({ obj: job }) => {
  const { type, completions } = getJobTypeAndCompletions(job);
  const resourceKind = referenceFor(job);
  const context = { [resourceKind]: job };
  return (
    <>
      <TableData className={tableColumnClasses[0]}>
        <ResourceLink kind={kind} name={job.metadata.name} namespace={job.metadata.namespace} />
      </TableData>
      <TableData
        className={classNames(tableColumnClasses[1], 'co-break-word')}
        columnID="namespace"
      >
        <ResourceLink kind="Namespace" name={job.metadata.namespace} />
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
        <LazyActionMenu context={context} />
      </TableData>
    </>
  );
};

export const JobDetails: React.FC<JobsDetailsProps> = ({ obj: job }) => {
  const { t } = useTranslation();
  return (
    <>
      <div className="co-m-pane__body">
        <div className="row">
          <div className="col-md-6">
            <SectionHeading text={t('public~Job details')} />
            <ResourceSummary resource={job} showPodSelector>
              <DetailsItem
                label={t('public~Desired completions')}
                obj={job}
                path="spec.completions"
              />
              <DetailsItem label={t('public~Parallelism')} obj={job} path="spec.parallelism" />
              <DetailsItem
                label={t('public~Active deadline seconds')}
                obj={job}
                path="spec.activeDeadlineSeconds"
              >
                {job.spec.activeDeadlineSeconds
                  ? t('public~{{count}} second', { count: job.spec.activeDeadlineSeconds })
                  : t('public~Not configured')}
              </DetailsItem>
            </ResourceSummary>
          </div>
          <div className="col-md-6">
            <SectionHeading text={t('public~Job status')} />
            <dl className="co-m-pane__details">
              <dt>{t('public~Status')}</dt>
              <dd>
                <Status
                  status={job?.status ? job?.status?.conditions?.[0]?.type || 'In progress' : null}
                />
              </dd>
              <DetailsItem label={t('public~Start time')} obj={job} path="status.startTime">
                <Timestamp timestamp={job.status.startTime} />
              </DetailsItem>
              <DetailsItem
                label={t('public~Completion time')}
                obj={job}
                path="status.completionTime"
              >
                <Timestamp timestamp={job.status.completionTime} />
              </DetailsItem>
              <DetailsItem
                label={t('public~Succeeded pods')}
                obj={job}
                path="status.succeeded"
                defaultValue="0"
              />
              <DetailsItem
                label={t('public~Active pods')}
                obj={job}
                path="status.active"
                defaultValue="0"
              />
              <DetailsItem
                label={t('public~Failed pods')}
                obj={job}
                path="status.failed"
                defaultValue="0"
              />
            </dl>
          </div>
        </div>
      </div>
      <div className="co-m-pane__body">
        <SectionHeading text={t('public~Containers')} />
        <ContainerTable containers={job.spec.template.spec.containers} />
      </div>
      <div className="co-m-pane__body">
        <SectionHeading text={t('public~Conditions')} />
        <Conditions conditions={job.status.conditions} />
      </div>
    </>
  );
};

const JobPods: React.FC<JobPodsProps> = (props) => <PodsComponent {...props} showNodes />;

const { details, pods, editYaml, events } = navFactory;
const JobsDetailsPage: React.FC<JobsDetailsPageProps> = (props) => {
  const customActionMenu = (kindObj, obj) => {
    const resourceKind = referenceForModel(kindObj);
    const context = { [resourceKind]: obj };
    return (
      <ActionServiceProvider context={context}>
        {({ actions, options, loaded }) =>
          loaded && (
            <ActionMenu actions={actions} options={options} variant={ActionMenuVariant.DROPDOWN} />
          )
        }
      </ActionServiceProvider>
    );
  };
  return (
    <DetailsPage
      {...props}
      getResourceStatus={(job: JobKind) =>
        job?.status ? job?.status?.conditions?.[0]?.type || 'In progress' : null
      }
      kind={kind}
      customActionMenu={customActionMenu}
      pages={[details(JobDetails), editYaml(), pods(JobPods), events(ResourceEventStream)]}
    />
  );
};
const JobsList: React.FC = (props) => {
  const { t } = useTranslation();
  const JobTableHeader = () => [
    {
      title: t('public~Name'),
      sortField: 'metadata.name',
      transforms: [sortable],
      props: { className: tableColumnClasses[0] },
    },
    {
      title: t('public~Namespace'),
      sortField: 'metadata.namespace',
      transforms: [sortable],
      props: { className: tableColumnClasses[1] },
      id: 'namespace',
    },
    {
      title: t('public~Labels'),
      sortField: 'metadata.labels',
      transforms: [sortable],
      props: { className: tableColumnClasses[2] },
    },
    {
      title: t('public~Completions'),
      sortFunc: 'jobCompletionsSucceeded',
      transforms: [sortable],
      props: { className: tableColumnClasses[3] },
    },
    {
      title: t('public~Type'),
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
