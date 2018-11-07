import * as React from 'react';
import * as _ from 'lodash-es';

// eslint-disable-next-line no-unused-vars
import {K8sResourceKindReference} from '../module/k8s';
import {ColHead, DetailsPage, List, ListHeader, ListPage} from './factory';
import {Cog, navFactory, SectionHeading, ResourceCog, ResourceLink, ResourceSummary, Timestamp} from './utils';

const { common } = Cog.factory;
const menuActions = [...common];

const LimitRangeReference: K8sResourceKindReference = 'LimitRange';

const LimitRangeRow: React.SFC<LimitRangeProps> = ({obj}) =>
  <div className="row co-resource-list__item">
    <div className="col-xs-4">
      <ResourceLink kind={LimitRangeReference} name={obj.metadata.name} namespace={obj.metadata.namespace} />
    </div>
    <div className="col-xs-4">
      <ResourceLink kind="Namespace" name={obj.metadata.namespace} title={obj.metadata.namespace} />
    </div>
    <div className="col-xs-4">
      <Timestamp timestamp={obj.metadata.creationTimestamp} />
    </div>
    <div className="co-resource-kebab">
      <ResourceCog actions={menuActions} kind={LimitRangeReference} resource={obj} />
    </div>
  </div>;

const LimitRangeHeader: React.SFC<LimitRangeHeaderProps> = props =>
  <ListHeader>
    <ColHead {...props} className="col-xs-4" sortField="metadata.name">Name</ColHead>
    <ColHead {...props} className="col-xs-4" sortField="metadata.namespace">Namespace</ColHead>
    <ColHead {...props} className="col-xs-4" sortField="metadata.creationTimestamp">Created</ColHead>
  </ListHeader>;

export const LimitRangeList: React.SFC = props =>
  <List
    {...props}
    Header={LimitRangeHeader}
    Row={LimitRangeRow}
  />;

export const LimitRangeListPage: React.SFC<LimitRangeListPageProps> = props =>
  <ListPage
    {...props}
    title="Limit Ranges"
    kind={LimitRangeReference}
    ListComponent={LimitRangeList}
    canCreate={true}
  />;

const LimitRangeDetailsRow: React.SFC<LimitRangeDetailsRowProps> = ({limitType, resource, limit}) => {
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
    <ResourceSummary resource={rq} podSelector="spec.podSelector" showNodeSelector={false} />
  </div>
  <LimitRangeDetailsList resource={rq} />
</React.Fragment>;

export const LimitRangeDetailsPage = props => <DetailsPage
  {...props}
  menuActions={menuActions}
  pages={[navFactory.details(Details), navFactory.editYaml()]}
/>;

/*  eslint-disable no-undef, no-unused-vars  */
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
