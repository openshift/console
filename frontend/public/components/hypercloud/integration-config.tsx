import * as _ from 'lodash-es';
import * as React from 'react';
import * as classNames from 'classnames';
import { sortable } from '@patternfly/react-table';

import { Status } from '@console/shared';
import { K8sResourceKind } from '../../module/k8s';
import { DetailsPage, ListPage, Table, TableRow, TableData, RowFunction } from '../factory';
import { DetailsItem,Kebab, KebabAction, detailsPage, Timestamp, navFactory, ResourceKebab, ResourceLink, ResourceSummary, SectionHeading } from '../utils';
import { IntegrationConfigModel } from '../../models/hypercloud';

export const menuActions: KebabAction[] = [...Kebab.getExtensionsActionsForKind(IntegrationConfigModel), ...Kebab.factory.common];

const kind = IntegrationConfigModel.kind;

const tableColumnClasses = [
    classNames('col-xs-2', 'col-sm-2'),
    classNames('col-xs-2', 'col-sm-2'),
    classNames('col-sm-2', 'hidden-xs'),
    classNames('col-xs-2', 'col-sm-2'),
    classNames('col-sm-2', 'hidden-xs'),
    Kebab.columnClass,
  ];

const IntegrationConfigPhase = instance => {
  let phase = '';
  if (instance.status) {
    instance.status.conditions.forEach(cur => {
      if (cur.type === 'ready') {
        if (cur.status === 'True') {
          phase = 'Ready';
        } else {
          phase = 'UnReady';
        }
      }
    });
    return phase;
  }
};

const IntegrationConfigTableHeader = () => {
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
        title: 'Image',
        sortField: 'spec.image',
        transforms: [sortable],
        props: { className: tableColumnClasses[2] },
      },
      {
        title: 'Status',
        sortField: 'status.phase',
        transforms: [sortable],
        props: { className: tableColumnClasses[3] },
      },
      {
        title: 'Created',
        sortField: 'metadata.creationTimestamp',
        transforms: [sortable],
        props: { className: tableColumnClasses[4] },
      },
      {
        title: '',
        props: { className: tableColumnClasses[5] },
      },
    ];
  };

  IntegrationConfigTableHeader.displayName = 'IntegrationConfigTableHeader';

  
const IntegrationConfigTableRow: RowFunction<K8sResourceKind> = ({ obj: registry, index, key, style }) => {
  const phase = IntegrationConfigPhase(registry);
    return (
      <TableRow id={registry.metadata.uid} index={index} trKey={key} style={style}>
        <TableData className={tableColumnClasses[0]}>
          <ResourceLink kind={kind} name={registry.metadata.name} namespace={registry.metadata.namespace} title={registry.metadata.uid} />
        </TableData>
        <TableData className={classNames(tableColumnClasses[1], 'co-break-word')}>
            <ResourceLink kind="Namespace" name={registry.metadata.namespace} title={registry.metadata.namespace} />
        </TableData>
        <TableData className={tableColumnClasses[2]}>
          {registry.spec.image}
        </TableData>
        <TableData className={tableColumnClasses[3]}>
          <Status status={phase} />
        </TableData>
        <TableData className={tableColumnClasses[4]}>
          <Timestamp timestamp={registry.metadata.creationTimestamp} />
        </TableData>
        <TableData className={tableColumnClasses[5]}>
        <ResourceKebab actions={menuActions} kind={kind} resource={registry} />
      </TableData>
      </TableRow>
    );
  };
  
export const IntegrationConfigDetailsList: React.FC<IntegrationConfigDetailsListProps> = ({ ds }) => {
  const readyCondition = ds.status.conditions.find(obj => _.lowerCase(obj.type) === 'ready');
  const time = readyCondition?.lastTransitionTime?.replace('T', ' ').replaceAll('-', '.').replace('Z', '');
  const phase = IntegrationConfigPhase(ds);

  return (
    <dl className="co-m-pane__details">
      <DetailsItem label='Last Transition Time' obj={ds} path="status.transitionTime">
        {time}
      </DetailsItem>
      <DetailsItem label='Status' obj={ds} path="status.result">
        <Status status={phase} />
      </DetailsItem>
    </dl>
  );
}

const IntegrationConfigDetails: React.FC<IntegrationConfigDetailsProps> = ({ obj: registry }) => (
    <>
      <div className="co-m-pane__body">
        <SectionHeading text="IntegrationConfig Details" />
        <div className="row">
          <div className="col-lg-6">
            <ResourceSummary resource={registry} showPodSelector showNodeSelector showTolerations />
          </div>
          <div className="col-lg-6">
            <IntegrationConfigDetailsList ds={registry} />
        </div>
        </div>
      </div>
    </>
  );

  
const { details, editYaml } = navFactory;

export const IntegrationConfigs: React.FC = props => <Table {...props} aria-label="IntegrationConfigs" Header={IntegrationConfigTableHeader} Row={IntegrationConfigTableRow} virtualize />;


export const IntegrationConfigsPage: React.FC<IntegrationConfigsPageProps> = props => <ListPage canCreate={true} ListComponent={IntegrationConfigs} kind={kind} {...props} />;

export const IntegrationConfigsDetailsPage: React.FC<IntegrationConfigsDetailsPageProps> = props => <DetailsPage {...props} kind={kind} menuActions={menuActions} pages={[details(detailsPage(IntegrationConfigDetails)), editYaml()]} />;

  type IntegrationConfigDetailsListProps = {
    ds: K8sResourceKind;
  };

  type IntegrationConfigsPageProps = {
    showTitle?: boolean;
    namespace?: string;
    selector?: any;
  };

  type IntegrationConfigDetailsProps = {
    obj: K8sResourceKind;
  };

  type IntegrationConfigsDetailsPageProps = {
    match: any;
  };