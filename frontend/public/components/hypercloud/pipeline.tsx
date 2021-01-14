import * as _ from 'lodash-es';
import * as React from 'react';
import * as classNames from 'classnames';
import { sortable } from '@patternfly/react-table';

import { K8sResourceKind, K8sKind } from '../../module/k8s';
import { DetailsPage, ListPage, Table, TableRow, TableData, RowFunction } from '../factory';
import { Kebab, KebabAction, detailsPage, Timestamp, navFactory, ResourceKebab, ResourceLink, ResourceSummary, SectionHeading } from '../utils';
import { PipelineModel, TaskModel, ClusterTaskModel } from '../../models';
import PipelineVisualization from '../../../packages/dev-console/src/components/pipelines/detail-page-tabs/pipeline-details/PipelineVisualization';
import DynamicResourceLinkList from '../../../packages/dev-console/src/components/pipelines/resource-overview/DynamicResourceLinkList';
import { Pipeline } from '../../../packages/dev-console/src/utils/pipeline-augment';
import { PipelineForm, PipelineParametersForm, PipelineResourcesForm, parametersValidationSchema, resourcesValidationSchema } from '../../../packages/dev-console/src/components/pipelines/detail-page-tabs';
// import { addTrigger } from '../../../packages/dev-console/src/utils/pipeline-actions';

// TODO: 기획에 add trigger부분 추가되면 menuActions 이 부분으로 대체하기
// export const menuActions: KebabAction[] = [addTrigger, ...Kebab.getExtensionsActionsForKind(PipelineModel), ...Kebab.factory.common];
export const menuActions: KebabAction[] = [...Kebab.getExtensionsActionsForKind(PipelineModel), ...Kebab.factory.common];

const kind = PipelineModel.kind;

const tableColumnClasses = [classNames('col-xs-6', 'col-sm-4'), classNames('col-xs-6', 'col-sm-4'), classNames('col-sm-4', 'hidden-xs'), Kebab.columnClass];

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
      title: 'Created',
      sortField: 'metadata.creationTimestamp',
      transforms: [sortable],
      props: { className: tableColumnClasses[2] },
    },
    {
      title: '',
      props: { className: tableColumnClasses[3] },
    },
  ];
};

PipelineTableHeader.displayName = 'PipelineTableHeader';

const PipelineTableRow: RowFunction<K8sResourceKind> = ({ obj: pipeline, index, key, style }) => {
  return (
    <TableRow id={pipeline.metadata.uid} index={index} trKey={key} style={style}>
      <TableData className={tableColumnClasses[0]}>
        <ResourceLink kind={kind} name={pipeline.metadata?.name} namespace={pipeline.metadata?.namespace} title={pipeline.metadata?.uid} />
      </TableData>
      <TableData className={classNames(tableColumnClasses[1], 'co-break-word')}>
        <ResourceLink kind="Namespace" name={pipeline.metadata?.namespace} title={pipeline.metadata?.namespace} />
      </TableData>
      <TableData className={tableColumnClasses[2]}>
        <Timestamp timestamp={pipeline.metadata.creationTimestamp} />
      </TableData>
      <TableData className={tableColumnClasses[3]}>
        <ResourceKebab actions={menuActions} kind={kind} resource={pipeline} />
      </TableData>
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
