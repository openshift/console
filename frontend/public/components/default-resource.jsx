import * as _ from 'lodash-es';
import * as React from 'react';
import { connect } from 'react-redux';

import { ColHead, DetailsPage, List, ListHeader, ListPage } from './factory';
import { referenceFor, kindForReference } from '../module/k8s';
import { connectToModel } from '../kinds';
import {
  Cog,
  kindObj,
  navFactory,
  ResourceCog,
  ResourceLink,
  ResourceOverviewHeading,
  ResourceSummary,
  SectionHeading
} from './utils';

const { common } = Cog.factory;
const menuActions = [...common];

const computeColumnSizes = (columns, isResourceNamespaced) => {
  const columnsNumber = isResourceNamespaced ? _.size(columns) + 1 : _.size(columns);
  const columnsSize = Math.floor(12 / columnsNumber);
  const fistColumnSize = 12 - (columnsSize * (columnsNumber-1));
  return {
    fistColumnSize,
    columnsSize
  };
};

const CustomHeader_ = props => {
  if (!_.get(props, ['resourceTable', 'table'])) {
    return null;
  }
  const { table, isNamespaced } = props.resourceTable;
  const { fistColumnSize, columnsSize } = computeColumnSizes(table.columnDefinitions, isNamespaced);
  const heads = _.map(table.columnDefinitions, (column, index) => {
    const size = index === 0 ? fistColumnSize : columnsSize;
    return <ColHead key={_.uniqueId()} className={`col-xs-${size}`}>{column.name}</ColHead>;
  });
  isNamespaced && heads.splice(1, 0, (<ColHead key={_.uniqueId()} className={`col-xs-${columnsSize}`}>Namespace</ColHead>));
  return <ListHeader>
    {heads}
  </ListHeader>;
};

const stateToProps = ({UI}) => {
  const resourceTable = UI.get('resourceTable');
  return {resourceTable};
};

const CustomHeader = connect(stateToProps)(CustomHeader_);

const RowForKind = (kind, rows, isNamespaced) => function RowForKind_ ({obj, index}) {
  if (!rows) {
    return null;
  }
  const rowCells = rows[index].cells;
  const namespace = _.get(rows[index], ['object', 'metadata', 'namespace']);
  const { fistColumnSize, columnsSize } = computeColumnSizes(rowCells, isNamespaced);
  const renderedRows = _.map(rowCells, (column, i) => {
    if (i === 0 ) {
      return <div key={_.uniqueId()} className={`col-xs-${fistColumnSize} co-resource-link-wrapper`}>
        <ResourceCog actions={menuActions} kind={referenceFor(obj) || kind} resource={obj} />
        <ResourceLink kind={kind} name={obj.metadata.name} namespace={obj.metadata.namespace} title={obj.metadata.name} />
      </div>;
    }
    return <div key={_.uniqueId()} className={`col-xs-${columnsSize} co-break-word`}>{column}</div>;
  });
  isNamespaced && renderedRows.splice(1, 0, (<div key={_.uniqueId()} className={`col-xs-${columnsSize} co-break-word`}>{namespace}</div>));
  return <div className="row co-resource-list__item">
    {renderedRows}
  </div>;
};

const DetailsForKind = kind => function DetailsForKind_ ({obj}) {
  return <React.Fragment>
    <div className="co-m-pane__body">
      <SectionHeading text={`${kindForReference(kind)} Overview`} />
      <ResourceSummary resource={obj} podSelector="spec.podSelector" showNodeSelector={false} />
    </div>
  </React.Fragment>;
};

export const DefaultList_ = props => {
  const { kinds, resourceTable } = props;
  if (!_.get(resourceTable, 'table')) {
    return null;
  }
  const { table, isNamespaced } = resourceTable;
  const Row = RowForKind(kinds[0], table.rows, isNamespaced);
  Row.displayName = 'RowForKind';
  return <List {...props} Header={CustomHeader} Row={Row} />;
};

const DefaultList = connect(stateToProps)(DefaultList_);

DefaultList.displayName = DefaultList;

export const DefaultPage = props => {
  return <ListPage {...props} ListComponent={DefaultList} canCreate={props.canCreate || _.get(kindObj(props.kind), 'crd')} />;
};
DefaultPage.displayName = 'DefaultPage';


export const DefaultDetailsPage = props => {
  const pages = [navFactory.details(DetailsForKind(props.kind)), navFactory.editYaml()];
  return <DetailsPage {...props} menuActions={menuActions} pages={pages} />;
};
DefaultDetailsPage.displayName = 'DefaultDetailsPage';

export const DefaultOverviewPage = connectToModel( ({kindObj: kindObject, resource}) =>
  <div className="overview__sidebar-pane resource-overview">
    <ResourceOverviewHeading
      actions={menuActions}
      kindObj={kindObject}
      resource={resource}
    />
    <div className="overview__sidebar-pane-body resource-overview__body">
      <div className="resource-overview__summary">
        <ResourceSummary resource={resource} />
      </div>
    </div>
  </div>
);
