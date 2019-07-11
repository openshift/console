import * as React from 'react';
import * as _ from 'lodash-es';
import { sortable } from '@patternfly/react-table';
import * as classNames from 'classnames';
import { MachineAutoscalerModel } from '../models';
import { groupVersionFor, K8sResourceKind, referenceForGroupVersionKind, referenceForModel } from '../module/k8s';
import { DetailsPage, ListPage, VirtualTable, VirtualTableRow, VirtualTableData } from './factory';
import {
  Kebab,
  navFactory,
  ResourceKebab,
  ResourceLink,
  ResourceSummary,
  SectionHeading,
} from './utils';

const { common } = Kebab.factory;
const menuActions = [...common];
const machineAutoscalerReference = referenceForModel(MachineAutoscalerModel);

const MachineAutoscalerTargetLink: React.FC<MachineAutoscalerTargetLinkProps> = ({obj}) => {
  const targetAPIVersion: string = _.get(obj, 'spec.scaleTargetRef.apiVersion');
  const targetKind: string = _.get(obj, 'spec.scaleTargetRef.kind');
  const targetName: string = _.get(obj, 'spec.scaleTargetRef.name');
  if (!targetAPIVersion || !targetKind || !targetName) {
    return <React.Fragment>-</React.Fragment>;
  }

  const groupVersion = groupVersionFor(targetAPIVersion);
  const reference = referenceForGroupVersionKind(groupVersion.group)(groupVersion.version)(targetKind);
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
      title: 'Name', sortField: 'metadata.name', transforms: [sortable],
      props: { className: tableColumnClasses[0] },
    },
    {
      title: 'Namespace', sortField: 'metadata.namespace', transforms: [sortable],
      props: { className: tableColumnClasses[1] },
    },
    {
      title: 'Scale Target', sortField: 'spec.scaleTargetRef.name', transforms: [sortable],
      props: { className: tableColumnClasses[2] },
    },
    {
      title: 'Min', sortField: 'spec.minReplicas', transforms: [sortable],
      props: { className: tableColumnClasses[3] },
    },
    {
      title: 'Max', sortField: 'spec.maxReplicas', transforms: [sortable],
      props: { className: tableColumnClasses[4] },
    },
    {
      title: '', props: { className: tableColumnClasses[5] },
    },
  ];
};
MachineAutoscalerTableHeader.displayName = 'MachineAutoscalerTableHeader';

const MachineAutoscalerTableRow: React.FC<MachineAutoscalerTableRowProps> = ({obj, index, key, style}) => {
  return (
    <VirtualTableRow id={obj.metadata.uid} index={index} trKey={key} style={style}>
      <VirtualTableData className={tableColumnClasses[0]}>
        <ResourceLink kind={machineAutoscalerReference} name={obj.metadata.name} namespace={obj.metadata.namespace} />
      </VirtualTableData>
      <VirtualTableData className={classNames(tableColumnClasses[1], 'co-break-word')}>
        <ResourceLink kind="Namespace" name={obj.metadata.namespace} />
      </VirtualTableData>
      <VirtualTableData className={classNames(tableColumnClasses[2], 'co-break-word')}>
        <MachineAutoscalerTargetLink obj={obj} />
      </VirtualTableData>
      <VirtualTableData className={tableColumnClasses[3]}>
        {_.get(obj, 'spec.minReplicas') || '-'}
      </VirtualTableData>
      <VirtualTableData className={tableColumnClasses[4]}>
        {_.get(obj, 'spec.maxReplicas') || '-'}
      </VirtualTableData>
      <VirtualTableData className={tableColumnClasses[5]}>
        <ResourceKebab actions={menuActions} kind={machineAutoscalerReference} resource={obj} />
      </VirtualTableData>
    </VirtualTableRow>
  );
};
MachineAutoscalerTableRow.displayName = 'MachineAutoscalerTableRow';
type MachineAutoscalerTableRowProps = {
  obj: K8sResourceKind;
  index: number;
  key?: string;
  style: object;
};

const MachineAutoscalerList: React.FC = props => <VirtualTable
  {...props}
  aria-label="Machine Autoscalers"
  Header={MachineAutoscalerTableHeader}
  Row={MachineAutoscalerTableRow} />;

const MachineAutoscalerDetails: React.FC<MachineAutoscalerDetailsProps> = ({obj}) => {
  return <React.Fragment>
    <div className="co-m-pane__body">
      <SectionHeading text="Machine Autoscaler Overview" />
      <ResourceSummary resource={obj}>
        <dt>Scale Target</dt>
        <dd><MachineAutoscalerTargetLink obj={obj} /></dd>
        <dt>Min Replicas</dt>
        <dd>
          {_.get(obj, 'spec.minReplicas') || '-'}
        </dd>
        <dt>Max Replicas</dt>
        <dd>
          {_.get(obj, 'spec.maxReplicas') || '-'}
        </dd>
      </ResourceSummary>
    </div>
  </React.Fragment>;
};

export const MachineAutoscalerPage: React.FC<MachineAutoscalerPageProps> = props =>
  <ListPage
    {...props}
    ListComponent={MachineAutoscalerList}
    kind={machineAutoscalerReference}
    canCreate={true}
  />;

export const MachineAutoscalerDetailsPage: React.FC<MachineAutoscalerDetailsPageProps> = props => <DetailsPage
  {...props}
  menuActions={menuActions}
  kind={machineAutoscalerReference}
  pages={[
    navFactory.details(MachineAutoscalerDetails),
    navFactory.editYaml(),
  ]}
/>;

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
