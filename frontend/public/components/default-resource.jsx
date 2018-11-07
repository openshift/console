import * as _ from 'lodash-es';
import * as React from 'react';
import { connect } from 'react-redux';

import { ColHead, DetailsPage, List, ListHeader, ListPage } from './factory';
import { fromNow } from './utils/datetime';
import { referenceFor, kindForReference } from '../module/k8s';
import {
  Cog,
  kindObj,
  navFactory,
  ResourceCog,
  ResourceLink,
  ResourceSummary,
  SectionHeading
} from './utils';

const { common } = Cog.factory;
const menuActions = [...common];
const maxNumberOfColumns = 6;

const computeClasses = (index, columnsNumber) => {
  const columnSize = Math.floor(12 / columnsNumber);
  const fistColumnSize = 12 - (columnSize * (columnsNumber-1));
  return index <= 1
    ? `col-md-${index === 0 ? fistColumnSize : columnSize} col-sm-6 col-xs-6`
    : `col-md-${columnSize} hidden-sm hidden-xs`;
};

const sortAndTrim = (allColumns) => {
  const columnsSortByPriority = _.sortBy(allColumns, [function(col) {
    return col.priority ? col.priority : 0;
  }]);
  if (_.size(columnsSortByPriority) > maxNumberOfColumns) {
    return _.dropRight(columnsSortByPriority, columnsSortByPriority - maxNumberOfColumns);
  }
  return columnsSortByPriority;
};

const stateToProps = ({k8s}) => {
  const printerColumns = k8s.get('printerColumns');
  return {printerColumns};
};

const Header_ = props => {
  if (!_.get(props, 'printerColumns')) {
    return null;
  }
  const printerColumns = sortAndTrim(props.printerColumns.toJSON());
  const columnsNumber = _.size(printerColumns);
  const columnHeaders = _.map(printerColumns, (column, index) => {
    return <ColHead {...props} key={index} className={`${computeClasses(index, columnsNumber)}`} sortField={_.trimStart(column.JSONPath, '.')}>{column.name}</ColHead>;
  });
  return <ListHeader>
    {columnHeaders}
  </ListHeader>;
};

const Header = connect(stateToProps)(Header_);

const Row_ = props => {
  if (!_.get(props, 'printerColumns')) {
    return null;
  }
  const printerColumns = sortAndTrim(props.printerColumns.toJSON());
  const { obj } = props;
  const kind = referenceFor(obj);
  const columnsNumber = _.size(printerColumns);
  const row = _.map(printerColumns, (column, index) => {
    const columnClass = computeClasses(index, columnsNumber);
    if (column.name === 'Name' && column.JSONPath === '.metadata.name') {
      return <div className={`${columnClass} co-resource-link-wrapper`} key={index}>
        <ResourceLink kind={kind} name={obj.metadata.name} namespace={obj.metadata.namespace} title={obj.metadata.name} />
      </div>;
    } else if (column.name === 'Namespace' && column.JSONPath === '.metadata.namespace') {
      return <div className={`${columnClass} co-break-word`} key={index}>
        <ResourceLink kind="Namespace" name={obj.metadata.namespace} title={obj.metadata.namespace} />
      </div>;
    }
    const data = _.get(obj, _.trimStart(column.JSONPath, '.'));
    return <div className={`${columnClass} co-break-word`} key={index}>
      { column.type === 'date' ? fromNow(data) : data }
    </div>;
  });
  return <div className="row co-resource-list__item">
    {row}
    <div className="co-resource-kebab">
      <ResourceCog actions={menuActions} kind={kind} resource={obj} />
    </div>
  </div>;
};

const Row = connect(stateToProps)(Row_);

const DetailsForKind = kind => function DetailsForKind_ ({obj}) {
  return <React.Fragment>
    <div className="co-m-pane__body">
      <SectionHeading text={`${kindForReference(kind)} Overview`} />
      <ResourceSummary resource={obj} podSelector="spec.podSelector" showNodeSelector={false} />
    </div>
  </React.Fragment>;
};

export const DefaultList = props => {
  Row.displayName = 'Row';
  return <List {...props} Header={Header} Row={Row} />;
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
