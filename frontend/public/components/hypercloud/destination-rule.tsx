import * as _ from 'lodash-es';
import * as React from 'react';
import * as classNames from 'classnames';
import { sortable } from '@patternfly/react-table';

import { K8sResourceKind } from '../../module/k8s';
import { DetailsPage, ListPage, Table, TableRow, TableData, RowFunction } from '../factory';
import { Kebab, KebabAction, detailsPage, Timestamp, navFactory, ResourceKebab, ResourceLink, ResourceSummary, SectionHeading } from '../utils';
import { Status } from '@console/shared';
import { DestinationRuleModel } from '../../models';

export const menuActions: KebabAction[] = [...Kebab.getExtensionsActionsForKind(DestinationRuleModel), ...Kebab.factory.common];

const kind = DestinationRuleModel.kind;

const tableColumnClasses = ['', '', classNames('pf-m-hidden', 'pf-m-visible-on-sm', 'pf-u-w-16-on-lg'), classNames('pf-m-hidden', 'pf-m-visible-on-lg'), Kebab.columnClass];

const DestinationRuleTableHeader = () => {
  return [
    {
      title: 'Name',
      sortField: 'metadata.name',
      transforms: [sortable],
      props: { className: tableColumnClasses[0] },
    },
    {
      title: 'Namespace',
      sortFunc: 'metadata.namespace',
      transforms: [sortable],
      props: { className: tableColumnClasses[1] },
    },
    {
      title: 'Host',
      sortField: 'spec.hosts',
      transforms: [sortable],
      props: { className: tableColumnClasses[2] },
    },
    {
      title: 'Created',
      sortField: 'metadata.creationTimestamp',
      transforms: [sortable],
      props: { className: tableColumnClasses[3] },
    },
    {
      title: '',
      props: { className: tableColumnClasses[4] },
    },
  ];
};
DestinationRuleTableHeader.displayName = 'DestinationRuleTableHeader';

const DestinationRuleTableRow: RowFunction<K8sResourceKind> = ({ obj: destinationrule, index, key, style }) => {
  return (
    <TableRow id={destinationrule.metadata.uid} index={index} trKey={key} style={style}>
      <TableData className={tableColumnClasses[0]}>
        <ResourceLink kind={kind} name={destinationrule.metadata.name} namespace={destinationrule.metadata.namespace} title={destinationrule.metadata.uid} />
      </TableData>
      <TableData className={tableColumnClasses[1]}>
        <Status status={destinationrule.metadata.namespace} />
      </TableData>
      <TableData className={classNames(tableColumnClasses[2], 'co-break-word')}>
        {destinationrule.spec.host}
      </TableData>
      <TableData className={tableColumnClasses[3]}>
        <Timestamp timestamp={destinationrule.metadata.creationTimestamp} />
      </TableData>
      <TableData className={tableColumnClasses[4]}>
        <ResourceKebab actions={menuActions} kind={kind} resource={destinationrule} />
      </TableData>
    </TableRow>
  );
};

const DestinationRuleDetails: React.FC<DestinationRuleDetailsProps> = ({ obj: destinationrule }) => (
  <>
    <div className="co-m-pane__body">
      <SectionHeading text="Destination Rule Details" />
      <div className="row">
        <div className="col-lg-6">
          <ResourceSummary resource={destinationrule} />
        </div>
      </div>
    </div>
    <div className="co-m-pane__body">
    </div>
  </>
);

const { details, editYaml } = navFactory;
export const DestinationRules: React.FC = props => <Table {...props} aria-label="Destination Rules" Header={DestinationRuleTableHeader} Row={DestinationRuleTableRow} virtualize />;

export const DestinationRulesPage: React.FC<DestinationRulesPageProps> = props => <ListPage canCreate={true} ListComponent={DestinationRules} kind={kind} {...props} />;

export const DestinationRulesDetailsPage: React.FC<DestinationRulesDetailsPageProps> = props => <DetailsPage {...props} kind={kind} menuActions={menuActions} pages={[details(detailsPage(DestinationRuleDetails)), editYaml()]} />;

type DestinationRuleDetailsProps = {
  obj: K8sResourceKind;
};

type DestinationRulesPageProps = {
  showTitle?: boolean;
  namespace?: string;
  selector?: any;
};

type DestinationRulesDetailsPageProps = {
  match: any;
};