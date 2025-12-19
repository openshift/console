import * as React from 'react';
import { Link } from 'react-router-dom-v5-compat';
import { useTranslation } from 'react-i18next';
import { Status } from '@console/shared/src/components/status/Status';
import ActionServiceProvider from '@console/shared/src/components/actions/ActionServiceProvider';
import ActionMenu from '@console/shared/src/components/actions/menu/ActionMenu';
import { ActionMenuVariant } from '@console/shared/src/components/actions/types';
import { DASH } from '@console/shared/src/constants/ui';
import LazyActionMenu from '@console/shared/src/components/actions/LazyActionMenu';
import PaneBody from '@console/shared/src/components/layout/PaneBody';
import {
  getJobTypeAndCompletions,
  JobKind,
  K8sResourceKind,
  referenceFor,
  referenceForModel,
  TableColumn,
} from '../module/k8s';
import { Conditions } from './conditions';
import { DetailsPage } from './factory/details';
import { ListPage } from './factory/list-page';
import { ContainerTable } from './utils/container-table';
import { DetailsItem } from './utils/details-item';
import { LabelList } from './utils/label-list';
import { LoadingBox } from './utils/status-box';
import { PodsComponent, navFactory } from './utils/horizontal-nav';
import { ResourceLink } from './utils/resource-link';
import { ResourceSummary } from './utils/details-page';
import { SectionHeading } from './utils/headings';

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
import {
  actionsCellProps,
  cellIsStickyProps,
  getNameCellProps,
  ConsoleDataView,
} from '@console/app/src/components/data-view/ConsoleDataView';
import { GetDataViewRows } from '@console/app/src/components/data-view/types';
import { getGroupVersionKindForModel } from '@console/dynamic-plugin-sdk/src/utils/k8s/k8s-ref';
import { sortResourceByValue } from './factory/Table/sort';
import { sorts } from './factory/table';

const kind = referenceForModel(JobModel);

const tableColumnInfo = [
  { id: 'name' },
  { id: 'namespace' },
  { id: 'labels' },
  { id: 'completions' },
  { id: 'type' },
  { id: 'created' },
  { id: '' },
];

const Completions: Snail.FCC<CompletionsCellProps> = ({ obj, completions }) => {
  const { t } = useTranslation();
  return (
    <Link to={`/k8s/ns/${obj.metadata.namespace}/jobs/${obj.metadata.name}/pods`} title="pods">
      {t('public~{{jobsSucceeded}} of {{completions}}', {
        jobsSucceeded: obj.status.succeeded || 0,
        completions,
      })}
    </Link>
  );
};

const getDataViewRows: GetDataViewRows<JobKind> = (data, columns) => {
  return data.map(({ obj }) => {
    const { name, namespace } = obj.metadata;
    const { type, completions } = getJobTypeAndCompletions(obj);
    const context = { [referenceFor(obj)]: obj };

    const rowCells = {
      [tableColumnInfo[0].id]: {
        cell: (
          <ResourceLink
            groupVersionKind={getGroupVersionKindForModel(JobModel)}
            name={name}
            namespace={namespace}
          />
        ),
        props: getNameCellProps(name),
      },
      [tableColumnInfo[1].id]: {
        cell: <ResourceLink kind="Namespace" name={namespace} />,
      },
      [tableColumnInfo[2].id]: {
        cell: <LabelList kind={kind} labels={obj.metadata.labels} />,
      },
      [tableColumnInfo[3].id]: {
        cell: <Completions obj={obj} completions={completions} />,
      },
      [tableColumnInfo[4].id]: {
        cell: type,
      },
      [tableColumnInfo[5].id]: {
        cell: <Timestamp timestamp={obj.metadata.creationTimestamp} />,
      },
      [tableColumnInfo[6].id]: {
        cell: <LazyActionMenu context={context} />,
        props: actionsCellProps,
      },
    };

    return columns.map(({ id }) => {
      const cell = rowCells[id]?.cell || DASH;
      return {
        id,
        props: rowCells[id]?.props,
        cell,
      };
    });
  });
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
const useJobsColumns = (): TableColumn<JobKind>[] => {
  const { t } = useTranslation();
  const columns: TableColumn<JobKind>[] = React.useMemo(() => {
    return [
      {
        title: t('public~Name'),
        id: tableColumnInfo[0].id,
        sort: 'metadata.name',
        props: {
          ...cellIsStickyProps,
          modifier: 'nowrap',
        },
      },
      {
        title: t('public~Namespace'),
        id: tableColumnInfo[1].id,
        sort: 'metadata.namespace',
        props: {
          modifier: 'nowrap',
        },
      },
      {
        title: t('public~Labels'),
        id: tableColumnInfo[2].id,
        sort: 'metadata.labels',
        props: {
          modifier: 'nowrap',
          width: 20,
        },
      },
      {
        title: t('public~Completions'),
        id: tableColumnInfo[3].id,
        sort: (data, direction) =>
          data.sort(sortResourceByValue<JobKind>(direction, sorts.jobCompletionsSucceeded)),
        props: {
          modifier: 'nowrap',
        },
      },
      {
        title: t('public~Type'),
        id: tableColumnInfo[4].id,
        sort: (data, direction) =>
          data.sort(sortResourceByValue<JobKind>(direction, sorts.jobType)),
        props: {
          modifier: 'nowrap',
        },
      },
      {
        title: t('public~Created'),
        id: tableColumnInfo[5].id,
        sort: 'metadata.creationTimestamp',
        props: {
          modifier: 'nowrap',
        },
      },
      {
        title: '',
        id: tableColumnInfo[6].id,
        props: {
          ...cellIsStickyProps,
        },
      },
    ];
  }, [t]);
  return columns;
};

const JobsList: Snail.FCC<JobsListProps> = ({ data, loaded, ...props }) => {
  const columns = useJobsColumns();

  return (
    <React.Suspense fallback={<LoadingBox />}>
      <ConsoleDataView<JobKind>
        {...props}
        label={JobModel.labelPlural}
        data={data}
        loaded={loaded}
        columns={columns}
        getDataViewRows={getDataViewRows}
        hideColumnManagement={true}
      />
    </React.Suspense>
  );
};

const JobsPage: React.FC<JobsPageProps> = (props) => (
  <ListPage
    {...props}
    kind={kind}
    ListComponent={JobsList}
    canCreate={true}
    omitFilterToolbar={true}
  />
);
export { JobsList, JobsPage, JobsDetailsPage };

type JobsDetailsProps = {
  obj: JobKind;
};

type JobsListProps = {
  data: JobKind[];
  loaded: boolean;
};

type JobsPageProps = {
  showTitle?: boolean;
  namespace?: string;
  selector?: any;
};

type JobPodsProps = {
  obj: K8sResourceKind;
};

type CompletionsCellProps = {
  obj: JobKind;
  completions: number;
};
