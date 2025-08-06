import * as React from 'react';
import { Link } from 'react-router-dom';
import { css } from '@patternfly/react-styles';
import { sortable } from '@patternfly/react-table';
import { useTranslation } from 'react-i18next';
import {
  Status,
  ActionServiceProvider,
  ActionMenu,
  LazyActionMenu,
  ActionMenuVariant,
} from '@console/shared';
import PaneBody from '@console/shared/src/components/layout/PaneBody';
import {
  getJobTypeAndCompletions,
  JobKind,
  K8sResourceKind,
  referenceForModel,
  referenceFor,
} from '../module/k8s';
import { Conditions } from './conditions';
import { DetailsPage, ListPage, Table, TableData, RowFunctionArgs } from './factory';
import {
  ContainerTable,
  DetailsItem,
  Kebab,
  LabelList,
  PodsComponent,
  ResourceLink,
  ResourceSummary,
  SectionHeading,
  navFactory,
} from './utils';
import { Timestamp } from '@console/shared/src/components/datetime/Timestamp';
import { ResourceEventStream } from './events';
import { JobModel } from '../models';
import { PodDisruptionBudgetField } from '@console/app/src/components/pdb/PodDisruptionBudgetField';
import {
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Grid,
  GridItem,
} from '@patternfly/react-core';

const kind = 'Job';

const tableColumnClasses = [
  '',
  '',
  'pf-m-hidden pf-m-visible-on-md',
  'pf-m-hidden pf-m-visible-on-lg',
  'pf-m-hidden pf-m-visible-on-xl',
  'pf-m-hidden pf-m-visible-on-2xl',
  Kebab.columnClass,
];

const JobTableRow: React.FC<RowFunctionArgs<JobKind>> = ({ obj: job }) => {
  const { type, completions } = getJobTypeAndCompletions(job);
  const resourceKind = referenceFor(job);
  const context = { [resourceKind]: job };
  const { t } = useTranslation();

  return (
    <>
      <TableData className={tableColumnClasses[0]}>
        <ResourceLink kind={kind} name={job.metadata.name} namespace={job.metadata.namespace} />
      </TableData>
      <TableData className={css(tableColumnClasses[1], 'co-break-word')} columnID="namespace">
        <ResourceLink kind="Namespace" name={job.metadata.namespace} />
      </TableData>
      <TableData className={tableColumnClasses[2]}>
        <LabelList kind={kind} labels={job.metadata.labels} />
      </TableData>
      <TableData className={tableColumnClasses[3]}>
        <Link to={`/k8s/ns/${job.metadata.namespace}/jobs/${job.metadata.name}/pods`} title="pods">
          {t('public~{{jobsSucceeded}} of {{completions}}', {
            jobsSucceeded: job.status.succeeded || 0,
            completions,
          })}
        </Link>
      </TableData>
      <TableData className={tableColumnClasses[4]}>{type}</TableData>
      <TableData className={tableColumnClasses[5]}>
        <Timestamp timestamp={job.metadata.creationTimestamp} />
      </TableData>
      <TableData className={tableColumnClasses[6]}>
        <LazyActionMenu context={context} />
      </TableData>
    </>
  );
};

export const JobDetails: React.FC<JobsDetailsProps> = ({ obj: job }) => {
  const { t } = useTranslation();
  return (
    <>
      <PaneBody>
        <Grid hasGutter>
          <GridItem md={6}>
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
          </GridItem>
          <GridItem md={6}>
            <SectionHeading text={t('public~Job status')} />
            <DescriptionList>
              <DescriptionListGroup>
                <DescriptionListTerm>{t('public~Status')}</DescriptionListTerm>
                <DescriptionListDescription>
                  <Status
                    status={
                      job?.status ? job?.status?.conditions?.[0]?.type || 'In progress' : null
                    }
                  />
                </DescriptionListDescription>
              </DescriptionListGroup>
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
              <PodDisruptionBudgetField obj={job} />
            </DescriptionList>
          </GridItem>
        </Grid>
      </PaneBody>
      <PaneBody>
        <SectionHeading text={t('public~Containers')} />
        <ContainerTable containers={job.spec.template.spec.containers} />
      </PaneBody>
      <PaneBody>
        <SectionHeading text={t('public~Conditions')} />
        <Conditions conditions={job.status.conditions} />
      </PaneBody>
    </>
  );
};

const JobPods: React.FC<JobPodsProps> = (props) => <PodsComponent {...props} showNodes />;

const { details, pods, editYaml, events } = navFactory;
const JobsDetailsPage: React.FC = (props) => {
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
      title: t('public~Created'),
      sortField: 'metadata.creationTimestamp',
      transforms: [sortable],
      props: { className: tableColumnClasses[5] },
    },
    {
      title: '',
      props: { className: tableColumnClasses[6] },
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
