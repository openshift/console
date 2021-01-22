import * as _ from 'lodash-es';
import * as React from 'react';
import * as classNames from 'classnames';
import { sortable } from '@patternfly/react-table';

import { K8sKind } from '../../module/k8s';
import { DetailsPage, ListPage, Table, TableRow, TableData, RowFunction } from '../factory';
import { FirehoseResult } from '@console/internal/components/utils';
import { Kebab, KebabAction, detailsPage, Timestamp, navFactory, ResourceLink, ResourceSummary, SectionHeading, Firehose } from '../utils';
import { PipelineModel, PipelineRunModel, TaskModel, ClusterTaskModel } from '../../models';
import PipelineVisualization from '../../../packages/dev-console/src/components/pipelines/detail-page-tabs/pipeline-details/PipelineVisualization';
import DynamicResourceLinkList from '../../../packages/dev-console/src/components/pipelines/resource-overview/DynamicResourceLinkList';
import { Pipeline, PipelineRun } from './utils/pipeline-augment';
import { PipelineForm, PipelineParametersForm, PipelineResourcesForm, parametersValidationSchema, resourcesValidationSchema } from '../../../packages/dev-console/src/components/pipelines/detail-page-tabs';
import { addTrigger } from '../../../packages/dev-console/src/utils/pipeline-actions';
import { PipelineRunsPage } from './pipeline-run';
import { pipelineRunStatus } from './utils/pipeline-filter-reducer';
import LinkedPipelineRunTaskStatus from './pipelineruns/linked-pipeline-run-task-status';
import PipelineRowKebabActions from './pipelines/pipeline-row-kebab-actions';
import { Status } from '@console/shared';
//import { LoadingInline } from '@console/internal/components/utils';

export const menuActions: KebabAction[] = [addTrigger, ...Kebab.getExtensionsActionsForKind(PipelineModel), ...Kebab.factory.common];

const kind = PipelineModel.kind;
const pipelineRunKind = PipelineRunModel.kind;

const tableColumnClasses = [
  'col-lg-2 col-md-3 col-sm-4 col-xs-4', // name
  'col-lg-2 col-md-3 col-sm-3 col-xs-3', // namespace
  'col-lg-2 col-md-4 col-sm-5 col-xs-5', // last run
  'col-lg-2 col-md-2 hidden-sm hidden-xs', // task status
  'col-lg-2 hidden-md hidden-sm hidden-xs', // last run status
  'col-lg-2 hidden-md hidden-sm hidden-xs', // last run time
  Kebab.columnClass,
];

const PipelineTableHeader = () => {
  return [
    {
      title: 'Name',
      sortField: 'metadata.name',
      transforms: [sortable],
      props: { className: tableColumnClasses[0] },
    },
    {
      title: 'Namespace',
      sortField: 'metadata.namespace',
      transforms: [sortable],
      props: { className: tableColumnClasses[1] },
    },
    {
      title: 'Last Run',
      sortField: 'latestRun.metadata.name',
      transforms: [sortable],
      props: { className: tableColumnClasses[2] },
    },
    {
      title: 'Task Status',
      sortField: 'latestRun.status.succeededCondition',
      transforms: [sortable],
      props: { className: tableColumnClasses[3] },
    },
    {
      title: 'Last Run Status',
      sortField: 'latestRun.status.succeededCondition',
      transforms: [sortable],
      props: { className: tableColumnClasses[4] },
    },
    {
      title: 'Last Run Time',
      sortField: 'latestRun.status.completionTime',
      transforms: [sortable],
      props: { className: tableColumnClasses[5] },
    },
    {
      title: '',
      props: { className: tableColumnClasses[6] },
    },
  ];
};

PipelineTableHeader.displayName = 'PipelineTableHeader';

type LatestRunRowProps = {
  resource?: FirehoseResult<PipelineRun[]>;
  pipeline: Pipeline;
};

const LatestRunRow: React.FC<LatestRunRowProps> = ({ pipeline, resource }) => {
  const latestPipelineRun = resource.loaded && resource.data.sort((a, b) => a.status.completionTime > b.status.completionTime ? -1 : 1)[0];
  return <>
    <TableData className={tableColumnClasses[2]}>
      {latestPipelineRun?.metadata?.name ? (
        <ResourceLink
          kind={pipelineRunKind}
          name={latestPipelineRun.metadata.name}
          namespace={latestPipelineRun.metadata.namespace}
        />
      ) : ('-')}
    </TableData>
    <TableData className={tableColumnClasses[3]}>
      {latestPipelineRun ? (
        <LinkedPipelineRunTaskStatus pipeline={pipeline} pipelineRun={latestPipelineRun} />
      ) : ('-')}
    </TableData>
    <TableData className={tableColumnClasses[4]}>
      {latestPipelineRun ? (<Status status={pipelineRunStatus(latestPipelineRun)} />
      ) : ('-')
      }
    </TableData>
    <TableData className={tableColumnClasses[5]}>
      {latestPipelineRun?.status?.completionTime ? (
        <Timestamp timestamp={latestPipelineRun.status.completionTime} />
      ) : ('-')}
    </TableData>
    <TableData className={tableColumnClasses[6]}>
      <PipelineRowKebabActions pipeline={pipeline} pipelineRun={latestPipelineRun}/>
    </TableData>
  </>
};

const PipelineTableRow: RowFunction<Pipeline> = ({ obj: pipeline, index, key, style }) => {
  return (
    <TableRow id={pipeline.metadata.uid} index={index} trKey={key} style={style}>
      <TableData className={tableColumnClasses[0]}>
        <ResourceLink kind={kind} name={pipeline.metadata?.name} namespace={pipeline.metadata?.namespace} title={pipeline.metadata?.uid} />
      </TableData>
      <TableData className={classNames(tableColumnClasses[1], 'co-break-word')}>
        <ResourceLink kind="Namespace" name={pipeline.metadata?.namespace} title={pipeline.metadata?.namespace} />
      </TableData>
      <Firehose resources={[{
        namespace: pipeline.metadata?.namespace,
        kind: PipelineRunModel.kind,
        selector: { 'tekton.dev/pipeline': pipeline.metadata.name, },
        isList: true,
        prop: 'resource',

      }]}>
        <LatestRunRow pipeline={pipeline} />
      </Firehose>
    </TableRow>
  );
};

export const getResourceModelFromTaskKind = (kind: string): K8sKind => (kind === ClusterTaskModel.kind ? ClusterTaskModel : TaskModel);

export const PipelineDetailsList: React.FC<PipelineDetailsListProps> = ({ ds: pipeline }) => {
  const taskLinks = pipeline.spec.tasks
    .filter((pipelineTask: PipelineTask) => !!pipelineTask.taskRef)
    .map(task => ({
      model: getResourceModelFromTaskKind(task.taskRef.kind),
      name: task.taskRef.name,
      displayName: task.name,
    }));

  return (
    <dl className="co-m-pane__details">
      <DynamicResourceLinkList namespace={pipeline.metadata.namespace} links={taskLinks} title="Tasks" />
    </dl>
  );
};


const PipelineDetails: React.FC<PipelineDetailsProps> = ({ obj: pipeline }) => (
  <>
    <div className="co-m-pane__body">
      <SectionHeading text="Pipeline Details" />
      <PipelineVisualization pipeline={pipeline} />
      <div className="row">
        <div className="col-lg-6">
          <ResourceSummary resource={pipeline} />
        </div>
        <div className="col-lg-6">
          <PipelineDetailsList ds={pipeline} />
        </div>
      </div>
    </div>
  </>
);

const { details, editYaml } = navFactory;

export const Pipelines: React.FC = props => <Table {...props} aria-label="Pipelines" Header={PipelineTableHeader} Row={PipelineTableRow} virtualize />;

export const PipelinesPage: React.FC<PipelinesPageProps> = props => <ListPage canCreate={true} ListComponent={Pipelines} kind={kind} {...props} />;

export const PipelinesDetailsPage: React.FC<PipelinesDetailsPageProps> = props => (
  <DetailsPage
    {...props}
    kind={kind}
    menuActions={menuActions}
    pages={[
      details(detailsPage(PipelineDetails)),
      editYaml(),
      {
        href: 'runs',
        name: 'Pipeline Runs',
        component: pageProps => <PipelineRunsPage showTitle={false} canCreate={false} namespace={pageProps.obj.metadata.namespace} selector={{ 'tekton.dev/pipeline': pageProps.obj.metadata.name, }} />,
      },
      {
        href: 'parameters',
        name: 'Parameters',
        component: pageProps => <PipelineForm PipelineFormComponent={PipelineParametersForm} formName="parameters" validationSchema={parametersValidationSchema} obj={pageProps.obj} {...pageProps} />,
      },
      {
        href: 'resources',
        name: 'Resources',
        component: pageProps => <PipelineForm PipelineFormComponent={PipelineResourcesForm} formName="resources" validationSchema={resourcesValidationSchema} obj={pageProps.obj} {...pageProps} />,
      },
    ]}
  />
);

type PipelineDetailsListProps = {
  ds: Pipeline;
};

type PipelinesPageProps = {
  showTitle?: boolean;
  namespace?: string;
  selector?: any;
};

type PipelineDetailsProps = {
  obj: Pipeline;
};

type PipelinesDetailsPageProps = {
  match: any;
};
export interface PipelineTaskRef {
  kind?: string;
  name: string;
}

export interface PipelineTaskParam {
  name: string;
  value: any;
}
export interface PipelineTaskResources {
  inputs?: PipelineTaskResource[];
  outputs?: PipelineTaskResource[];
}
export interface PipelineTaskResource {
  name: string;
  resource?: string;
  from?: string[];
}
export interface PipelineTask {
  name: string;
  runAfter?: string[];
  taskRef: PipelineTaskRef;
  params?: PipelineTaskParam[];
  resources?: PipelineTaskResources;
}
