import * as React from 'react';
import * as _ from 'lodash-es';
import * as classNames from 'classnames';
import { sortable } from '@patternfly/react-table';
import {K8sResourceKindReference, K8sResourceKind} from '../module/k8s';
import {DetailsPage, ListPage, Table, TableRow, TableData } from './factory';
import {Kebab, navFactory, SectionHeading, ResourceKebab, ResourceLink, ResourceSummary, Timestamp} from './utils';

const { common } = Kebab.factory;
const menuActions = [...common];

const LimitRangeReference: K8sResourceKindReference = 'LimitRange';

const tableColumnClasses = [
  classNames('col-sm-4', 'col-xs-6'),
  classNames('col-sm-4', 'col-xs-6'),
  classNames('col-sm-4', 'hidden-xs'),
  Kebab.columnClass,
];

export const LimitRangeTableRow: React.FC<LimitRangeTableRowProps> = ({obj, index, key, style}) => {
  return (
    <TableRow id={obj.metadata.uid} index={index} trKey={key} style={style}>
      <TableData className={tableColumnClasses[0]}>
        <ResourceLink kind={LimitRangeReference} name={obj.metadata.name} namespace={obj.metadata.namespace} />
      </TableData>
      <TableData className={tableColumnClasses[1]}>
        <ResourceLink kind="Namespace" name={obj.metadata.namespace} title={obj.metadata.namespace} />
      </TableData>
      <TableData className={tableColumnClasses[2]}>
        <Timestamp timestamp={obj.metadata.creationTimestamp} />
      </TableData>
      <TableData className={tableColumnClasses[3]}>
        <ResourceKebab actions={menuActions} kind={LimitRangeReference} resource={obj} />
      </TableData>
    </TableRow>
  );
};
LimitRangeTableRow.displayName = 'LimitRangeTableRow';
type LimitRangeTableRowProps = {
  obj: K8sResourceKind;
  index: number;
  key?: string;
  style: object;
};

export const LimitRangeTableHeader = () => {
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
LimitRangeTableHeader.displayName = 'LimitRangeTableHeader';

export const LimitRangeList: React.SFC = props => <Table {...props} aria-label="Limit Ranges" Header={LimitRangeTableHeader} Row={LimitRangeTableRow} virtualize />;

export const LimitRangeListPage: React.SFC<LimitRangeListPageProps> = props =>
  <ListPage
    {...props}
    title="Limit Ranges"
    kind={LimitRangeReference}
    ListComponent={LimitRangeList}
    canCreate={true}
  />;

export const LimitRangeDetailsRow: React.SFC<LimitRangeDetailsRowProps> = ({limitType, resource, limit}) => {
  return <tr className="co-resource-list__item">
    <td>{limitType}</td>
    <td>{resource}</td>
    <td>{limit.min || '-'}</td>
    <td>{limit.max || '-'}</td>
    <td>{limit.defaultRequest || '-'}</td>
    <td>{limit.default || '-'}</td>
    <td>{limit.maxLimitRequestRatio || '-'}</td>
  </tr>;
};

const LimitRangeDetailsRows: React.SFC<LimitRangeDetailsRowsProps> = ({limit}) => {
  const properties = ['max', 'min', 'default', 'defaultRequest', 'maxLimitRequestRatio'];
  const resources = {};
  _.each(properties, property => {
    _.each(limit[property], (value, resource) => _.set(resources, [resource, property], value));
  });

  return <React.Fragment>
    {_.map(resources, (resourceLimit, resource) => <LimitRangeDetailsRow key={resource} limitType={limit.type} resource={resource} limit={resourceLimit} />)}
  </React.Fragment>;
};

export const LimitRangeDetailsList = (resource) => {
  return <div className="co-m-pane__body">
    <SectionHeading text="Limits" />
    <div className="table-responsive">
      <table className="co-m-table-grid co-m-table-grid--bordered table">
        <thead className="co-m-table-grid__head">
          <tr>
            <td>Type</td>
            <td>Resource</td>
            <td>Min</td>
            <td>Max</td>
            <td>Default Request</td>
            <td>Default Limit</td>
            <td>Max Limit/Request Ratio</td>
          </tr>
        </thead>
        <tbody className="co-m-table-grid__body">
          {_.map(resource.resource.spec.limits, (limit, index) => <LimitRangeDetailsRows limit={limit} key={index} />)}
        </tbody>
      </table>
    </div>
  </div>;
};

const Details = ({obj: rq}) => <React.Fragment>
  <div className="co-m-pane__body">
    <SectionHeading text="Limit Range Overview" />
    <ResourceSummary resource={rq} />
  </div>
  <LimitRangeDetailsList resource={rq} />
</React.Fragment>;

export const LimitRangeDetailsPage = props => <DetailsPage
  {...props}
  menuActions={menuActions}
  pages={[navFactory.details(Details), navFactory.editYaml()]}
/>;

export type LimitRangeProps = {
  obj: any,
};
export type LimitRangeListPageProps = {
  filterLabel: string,
};
export type LimitRangeDetailsRowsProps = {
  limit: any,
};
export type LimitRangeDetailsRowProps = {
  limitType: string,
  resource: string,
  limit: any,
};
export type LimitRangeHeaderProps = {
  obj: any,
};
