import * as React from 'react';
import * as _ from 'lodash-es';
import { sortable } from '@patternfly/react-table';
import * as classNames from 'classnames';
import { MachineAutoscalerModel } from '../models';
import {
  groupVersionFor,
  K8sResourceKind,
  referenceForGroupVersionKind,
  referenceForModel,
} from '../module/k8s';
import { DetailsPage, ListPage, Table, TableRow, TableData, RowFunction } from './factory';
import {
  Kebab,
  navFactory,
  ResourceKebab,
  ResourceLink,
  ResourceSummary,
  SectionHeading,
} from './utils';

const menuActions = [...Kebab.factory.common];
const machineAutoscalerReference = referenceForModel(MachineAutoscalerModel);

const MachineAutoscalerTargetLink: React.FC<MachineAutoscalerTargetLinkProps> = ({ obj }) => {
  const targetAPIVersion: string = _.get(obj, 'spec.scaleTargetRef.apiVersion');
  const targetKind: string = _.get(obj, 'spec.scaleTargetRef.kind');
  const targetName: string = _.get(obj, 'spec.scaleTargetRef.name');
  if (!targetAPIVersion || !targetKind || !targetName) {
    return <>-</>;
  }

  const groupVersion = groupVersionFor(targetAPIVersion);
  const reference = referenceForGroupVersionKind(groupVersion.group)(groupVersion.version)(
    targetKind,
  );
  return <ResourceLink kind={reference} name={targetName} namespace={obj.metadata.namespace} />;
};

const tableColumnClasses = [
  classNames('col-md-4', 'col-sm-4', 'col-xs-6'),
  classNames('col-md-3', 'col-sm-4', 'col-xs-6'),
  classNames('col-md-3', 'col-sm-4', 'hidden-xs'),
  classNames('col-md-1', 'hidden-sm', 'hidden-xs'),
  classNames('col-md-1', 'hidden-sm', 'hidden-xs'),
  Kebab.columnClass,
];

const MachineAutoscalerTableHeader = () => {
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
      title: 'Scale Target',
      sortField: 'spec.scaleTargetRef.name',
      transforms: [sortable],
      props: { className: tableColumnClasses[2] },
    },
    {
      title: 'Min',
      sortField: 'spec.minReplicas',
      transforms: [sortable],
      props: { className: tableColumnClasses[3] },
    },
    {
      title: 'Max',
      sortField: 'spec.maxReplicas',
      transforms: [sortable],
      props: { className: tableColumnClasses[4] },
    },
    {
      title: '',
      props: { className: tableColumnClasses[5] },
    },
  ];
};
MachineAutoscalerTableHeader.displayName = 'MachineAutoscalerTableHeader';

const MachineAutoscalerTableRow: RowFunction<K8sResourceKind> = ({ obj, index, key, style }) => {
  return (
    <TableRow id={obj.metadata.uid} index={index} trKey={key} style={style}>
      <TableData className={tableColumnClasses[0]}>
        <ResourceLink
          kind={machineAutoscalerReference}
          name={obj.metadata.name}
          namespace={obj.metadata.namespace}
        />
      </TableData>
      <TableData className={classNames(tableColumnClasses[1], 'co-break-word')}>
        <ResourceLink kind="Namespace" name={obj.metadata.namespace} />
      </TableData>
      <TableData className={classNames(tableColumnClasses[2], 'co-break-word')}>
        <MachineAutoscalerTargetLink obj={obj} />
      </TableData>
      <TableData className={tableColumnClasses[3]}>
        {_.get(obj, 'spec.minReplicas') || '-'}
      </TableData>
      <TableData className={tableColumnClasses[4]}>
        {_.get(obj, 'spec.maxReplicas') || '-'}
      </TableData>
      <TableData className={tableColumnClasses[5]}>
        <ResourceKebab actions={menuActions} kind={machineAutoscalerReference} resource={obj} />
      </TableData>
    </TableRow>
  );
};

const MachineAutoscalerList: React.FC = (props) => (
  <Table
    {...props}
    aria-label="Machine Autoscalers"
    Header={MachineAutoscalerTableHeader}
    Row={MachineAutoscalerTableRow}
    virtualize
  />
);

const MachineAutoscalerDetails: React.FC<MachineAutoscalerDetailsProps> = ({ obj }) => {
  return (
    <>
      <div className="co-m-pane__body">
        <SectionHeading text="Machine Autoscaler Details" />
        <ResourceSummary resource={obj}>
          <dt>Scale Target</dt>
          <dd>
            <MachineAutoscalerTargetLink obj={obj} />
          </dd>
          <dt>Min Replicas</dt>
          <dd>{_.get(obj, 'spec.minReplicas') || '-'}</dd>
          <dt>Max Replicas</dt>
          <dd>{_.get(obj, 'spec.maxReplicas') || '-'}</dd>
        </ResourceSummary>
      </div>
    </>
  );
};

export const MachineAutoscalerPage: React.FC<MachineAutoscalerPageProps> = (props) => (
  <ListPage
    {...props}
    ListComponent={MachineAutoscalerList}
    kind={machineAutoscalerReference}
    canCreate={true}
  />
);

export const MachineAutoscalerDetailsPage: React.FC<MachineAutoscalerDetailsPageProps> = (
  props,
) => (
  <DetailsPage
    {...props}
    menuActions={menuActions}
    kind={machineAutoscalerReference}
    pages={[navFactory.details(MachineAutoscalerDetails), navFactory.editYaml()]}
  />
);

type MachineAutoscalerPageProps = {
  showTitle?: boolean;
  namespace?: string;
  selector?: any;
};

type MachineAutoscalerTargetLinkProps = {
  obj: K8sResourceKind;
};

export type MachineAutoscalerDetailsProps = {
  obj: K8sResourceKind;
};

export type MachineAutoscalerDetailsPageProps = {
  match: any;
};
