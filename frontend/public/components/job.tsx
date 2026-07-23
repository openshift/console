import type { FC } from 'react';
import { useMemo, Suspense } from 'react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Status } from '@console/shared/src/components/status/Status';
import { ActionServiceProvider } from '@console/shared/src/components/actions/ActionServiceProvider';
import { ActionMenu } from '@console/shared/src/components/actions/menu/ActionMenu';
import { ActionMenuVariant } from '@console/shared/src/components/actions/types';
import { DASH } from '@console/shared/src/constants/ui';
import { LazyActionMenu } from '@console/shared/src/components/actions/LazyActionMenu';
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
import { Selector } from './utils/selector';
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
  getNameCellProps,
  ConsoleDataView,
  nameCellProps,
  getLabelsColumnWidthStyleProp,
} from '@console/app/src/components/data-view/ConsoleDataView';
import { useColumnWidthSettings } from '@console/app/src/components/data-view/useResizableColumnProps';
import { GetDataViewRows } from '@console/app/src/components/data-view/types';
import { getGroupVersionKindForModel } from '@console/dynamic-plugin-sdk/src/utils/k8s/k8s-ref';
import { sortResourceByValue } from './factory/Table/sort';
import { sorts } from './factory/table';

const kind = referenceForModel(JobModel);

const tableColumnInfo = [
  { id: 'name' },
  { id: 'namespace' },
  { id: 'labels' },
  { id: 'selector' },
  { id: 'completions' },
  { id: 'type' },
  { id: 'created' },
  { id: '' },
];

const Completions: FC<CompletionsCellProps> = ({ obj, completions }) => {
  const { t } = useTranslation('public');
  return (
    <Link to={`/k8s/ns/${obj.metadata.namespace}/jobs/${obj.metadata.name}/pods`} title="pods">
      {t('{{jobsSucceeded}} of {{completions}}', {
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
        cell: <Selector selector={obj.spec.selector} namespace={namespace} />,
      },
      [tableColumnInfo[4].id]: {
        cell: <Completions obj={obj} completions={completions} />,
      },
      [tableColumnInfo[5].id]: {
        cell: type,
      },
      [tableColumnInfo[6].id]: {
        cell: <Timestamp timestamp={obj.metadata.creationTimestamp} />,
      },
      [tableColumnInfo[7].id]: {
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

const JobDetails: FC<JobsDetailsProps> = ({ obj: job }) => {
  const { t } = useTranslation('public');
  return (
    <>
      <PaneBody>
        <Grid hasGutter>
          <GridItem md={6}>
            <SectionHeading text={t('Job details')} />
            <ResourceSummary resource={job} showPodSelector>
              <DetailsItem label={t('Desired completions')} obj={job} path="spec.completions" />
              <DetailsItem label={t('Parallelism')} obj={job} path="spec.parallelism" />
              <DetailsItem
                label={t('Active deadline seconds')}
                obj={job}
                path="spec.activeDeadlineSeconds"
              >
                {job.spec.activeDeadlineSeconds
                  ? t('{{count}} second', { count: job.spec.activeDeadlineSeconds })
                  : t('Not configured')}
              </DetailsItem>
            </ResourceSummary>
          </GridItem>
          <GridItem md={6}>
            <SectionHeading text={t('Job status')} />
            <DescriptionList>
              <DescriptionListGroup>
                <DescriptionListTerm>{t('Status')}</DescriptionListTerm>
                <DescriptionListDescription>
                  <Status
                    status={
                      job?.status ? job?.status?.conditions?.[0]?.type || 'In progress' : null
                    }
                  />
                </DescriptionListDescription>
              </DescriptionListGroup>
              <DetailsItem label={t('Start time')} obj={job} path="status.startTime">
                <Timestamp timestamp={job.status.startTime} />
              </DetailsItem>
              <DetailsItem label={t('Completion time')} obj={job} path="status.completionTime">
                <Timestamp timestamp={job.status.completionTime} />
              </DetailsItem>
              <DetailsItem
                label={t('Succeeded pods')}
                obj={job}
                path="status.succeeded"
                defaultValue="0"
              />
              <DetailsItem
                label={t('Active pods')}
                obj={job}
                path="status.active"
                defaultValue="0"
              />
              <DetailsItem
                label={t('Failed pods')}
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
        <SectionHeading text={t('Containers')} />
        <ContainerTable containers={job.spec.template.spec.containers} />
      </PaneBody>
      <PaneBody>
        <SectionHeading text={t('Conditions')} />
        <Conditions conditions={job.status.conditions} />
      </PaneBody>
    </>
  );
};

const JobPods: FC<JobPodsProps> = (props) => <PodsComponent {...props} showNodes />;

const { details, pods, editYaml, events } = navFactory;
const JobsDetailsPage: FC = (props) => {
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
const useJobsColumns = (): {
  columns: TableColumn<JobKind>[];
  resetAllColumnWidths: () => void;
} => {
  const { t } = useTranslation('public');
  const { getResizableProps, getWidth, resetAllColumnWidths } = useColumnWidthSettings(JobModel);

  const columns = useMemo(() => {
    return [
      {
        title: t('Name'),
        id: tableColumnInfo[0].id,
        sort: 'metadata.name',
        resizableProps: getResizableProps(tableColumnInfo[0].id),
        props: {
          ...nameCellProps,
          modifier: 'nowrap',
        },
      },
      {
        title: t('Namespace'),
        id: tableColumnInfo[1].id,
        sort: 'metadata.namespace',
        resizableProps: getResizableProps(tableColumnInfo[1].id),
        props: {
          modifier: 'nowrap',
        },
      },
      {
        title: t('Labels'),
        id: tableColumnInfo[2].id,
        sort: 'metadata.labels',
        resizableProps: getResizableProps(tableColumnInfo[2].id),
        props: {
          modifier: 'nowrap',
          ...getLabelsColumnWidthStyleProp(getWidth(tableColumnInfo[2].id)),
        },
      },
      {
        title: t('Pod selector'),
        id: tableColumnInfo[3].id,
        sort: 'spec.selector',
        resizableProps: getResizableProps(tableColumnInfo[3].id),
        props: {
          modifier: 'nowrap',
        },
      },
      {
        title: t('Completions'),
        id: tableColumnInfo[4].id,
        sort: (data, direction) =>
          data.sort(sortResourceByValue<JobKind>(direction, sorts.jobCompletionsSucceeded)),
        resizableProps: getResizableProps(tableColumnInfo[4].id),
        props: {
          modifier: 'nowrap',
        },
      },
      {
        title: t('Type'),
        id: tableColumnInfo[5].id,
        sort: (data, direction) =>
          data.sort(sortResourceByValue<JobKind>(direction, sorts.jobType)),
        resizableProps: getResizableProps(tableColumnInfo[5].id),
        props: {
          modifier: 'nowrap',
        },
      },
      {
        title: t('Created'),
        id: tableColumnInfo[6].id,
        sort: 'metadata.creationTimestamp',
        resizableProps: getResizableProps(tableColumnInfo[6].id),
        props: {
          modifier: 'nowrap',
        },
      },
      {
        title: '',
        id: tableColumnInfo[7].id,
        props: {
          ...actionsCellProps,
        },
      },
    ];
  }, [t, getResizableProps, getWidth]);

  return { columns, resetAllColumnWidths };
};

const JobsList: FC<JobsListProps> = ({ data, loaded, ...props }) => {
  const { columns, resetAllColumnWidths } = useJobsColumns();

  return (
    <Suspense fallback={<LoadingBox />}>
      <ConsoleDataView<JobKind>
        {...props}
        label={JobModel.labelPlural}
        data={data}
        loaded={loaded}
        columns={columns}
        getDataViewRows={getDataViewRows}
        hideColumnManagement={true}
        isResizable
        resetAllColumnWidths={resetAllColumnWidths}
      />
    </Suspense>
  );
};

const JobsPage: FC<JobsPageProps> = (props) => (
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
