import * as React from 'react';
import * as _ from 'lodash-es';

// eslint-disable-next-line no-unused-vars
import {K8sResourceKindReference} from '../module/k8s';
import {ColHead, DetailsPage, List, ListHeader, ListPage} from './factory';
import {Cog, navFactory, SectionHeading, ResourceCog, ResourceLink, ResourceSummary, Timestamp} from './utils';

const { common } = Cog.factory;

const menuActions = [
  ...common,
];

const LimitRangeReference: K8sResourceKindReference = 'LimitRange';

const LimitRangeRow: React.SFC<LimitRangeProps> = ({obj}) =>
  <div className="row co-resource-list__item">
    <div className="col-xs-4 co-resource-link-wrapper">
      <ResourceCog actions={menuActions} kind={LimitRangeReference} resource={obj} />
      <ResourceLink kind={LimitRangeReference} name={obj.metadata.name} namespace={obj.metadata.namespace} />
    </div>
    <div className="col-xs-4">
      <ResourceLink kind="Namespace" name={obj.metadata.namespace} title={obj.metadata.namespace} />
    </div>
    <div className="col-xs-4">
      <Timestamp timestamp={obj.metadata.creationTimestamp} />
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
  return <div className="row co-resource-list__item">
    <div className="col-xs-2">
      {limitType}
    </div>
    <div className="col-xs-2">
      {resource}
    </div>
    <div className="col-xs-1">
      {limit.min || '-'}
    </div>
    <div className="col-xs-1">
      {limit.max || '-'}
    </div>
    <div className="col-xs-2">
      {limit.defaultRequest || '-'}
    </div>
    <div className="col-xs-2">
      {limit.default || '-'}
    </div>
    <div className="col-xs-2">
      {limit.maxLimitRequestRatio || '-'}
    </div>
  </div>;
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
    <div className="row">
      <div className="co-m-table-grid co-m-table-grid--bordered">
        <div className="row co-m-table-grid__head">
          <div className="col-xs-2">Type</div>
          <div className="col-xs-2">Resource</div>
          <div className="col-xs-1">Min</div>
          <div className="col-xs-1">Max</div>
          <div className="col-xs-2">Default Request</div>
          <div className="col-xs-2">Default Limit</div>
          <div className="col-xs-2">Max Limit/Request Ratio</div>
        </div>
        <div className="co-m-table-grid__body">
          {_.map(resource.resource.spec.limits, (limit, index) => <LimitRangeDetailsRows limit={limit} key={index} />)}
        </div>
      </div>
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
