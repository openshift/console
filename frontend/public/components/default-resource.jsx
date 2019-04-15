import * as _ from 'lodash-es';
import * as React from 'react';
import * as classNames from 'classnames';
import { sortable } from '@patternfly/react-table';
import { DetailsPage, ListPage, Table, TableRow, TableData } from './factory';
import { fromNow } from './utils/datetime';
import { referenceFor, kindForReference } from '../module/k8s';
import {
  Kebab,
  kindObj,
  navFactory,
  ResourceKebab,
  ResourceLink,
  ResourceSummary,
  SectionHeading,
} from './utils';

const { common } = Kebab.factory;
const menuActions = [...common];

const tableColumnClasses = [
  classNames('pf-m-6-col-on-sm', 'pf-m-4-col-on-md'),
  classNames('pf-m-6-col-on-sm', 'pf-m-4-col-on-md'),
  classNames('pf-m-4-col-on-md', 'pf-m-hidden', 'pf-m-visible-on-md'),
  Kebab.columnClass,
];

const TableHeader = () => {
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
      title: 'Created', sortField: 'metadata.creationTimestamp', transforms: [sortable],
      props: { className: tableColumnClasses[2] },
    },
    {
      title: '', props: { className: tableColumnClasses[3] },
    },
  ];
};
TableHeader.displayName = 'TableHeader';

const TableRowForKind = ({obj, index, key, style, customData}) => {
  return (
    <TableRow id={obj.metadata.uid} index={index} trKey={key} style={style}>
      <TableData className={tableColumnClasses[0]}>
        <ResourceLink kind={customData.kind} name={obj.metadata.name} namespace={obj.metadata.namespace} title={obj.metadata.name} />
      </TableData>
      <TableData className={classNames(tableColumnClasses[1], 'co-break-word')}>
        { obj.metadata.namespace
          ? <ResourceLink kind="Namespace" name={obj.metadata.namespace} title={obj.metadata.namespace} />
          : 'None'
        }
      </TableData>
      <TableData className={tableColumnClasses[2]}>
        { fromNow(obj.metadata.creationTimestamp) }
      </TableData>
      <TableData className={tableColumnClasses[3]}>
        <ResourceKebab actions={menuActions} kind={referenceFor(obj) || customData.kind} resource={obj} />
      </TableData>
    </TableRow>
  );
};
TableRowForKind.displayName = 'TableRowForKind';

const DetailsForKind = kind => function DetailsForKind_({obj}) {
  return <React.Fragment>
    <div className="co-m-pane__body">
      <SectionHeading text={`${kindForReference(kind)} Overview`} />
      <ResourceSummary resource={obj} podSelector="spec.podSelector" showNodeSelector={false} />
    </div>
  </React.Fragment>;
};

export const DefaultList = props => {
  const { kinds } = props;

  return <Table {...props}
    aria-label="Default Resource"
    kinds={[kinds[0]]}
    customData={{kind: kinds[0]}}
    Header={TableHeader}
    Row={TableRowForKind}
    virtualize />;
};
DefaultList.displayName = DefaultList;

export const DefaultPage = props =>
  <ListPage {...props} ListComponent={DefaultList} canCreate={props.canCreate || _.get(kindObj(props.kind), 'crd')} />;
DefaultPage.displayName = 'DefaultPage';


export const DefaultDetailsPage = props => {
  const pages = [navFactory.details(DetailsForKind(props.kind)), navFactory.editYaml()];
  return <DetailsPage {...props} menuActions={menuActions} pages={pages} />;
};
DefaultDetailsPage.displayName = 'DefaultDetailsPage';
