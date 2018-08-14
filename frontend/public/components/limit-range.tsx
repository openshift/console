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

const LimitRangeDetailsRow: React.SFC<LimitRangeRowProps> = ({row}) => {
  return <div className="row co-resource-list__item">
    <div className="col-sm-2 col-xs-2">
      {row.resourceType}
    </div>
    <div className="col-sm-2 col-xs-2">
      {row.min || '-'}
    </div>
    <div className="col-sm-2 col-xs-2">
      {row.max || '-'}
    </div>
    <div className="col-sm-2 col-xs-2">
      {row.defaultRequest || '-'}
    </div>
    <div className="col-sm-2 col-xs-2">
      {row.default || '-'}
    </div>
    <div className="col-sm-2 col-xs-2">
      {row.maxLimitRequestRatio || '-'}
    </div>
  </div>;
};

const LimitRangeDetailsRows: React.SFC<LimitRangeRowsProps> = ({limit}) => {
  const type = limit.type; //We have nested types, top level type is something like "Container"
  const properties = ['max', 'min', 'default', 'defaultRequest', 'maxLimitRequestRatio'];
  const cpuLimits = {};
  const memoryLimits = {};

  _.forEach(properties, function(property){
    if (limit[property]) {
      if (limit[property].hasOwnProperty('cpu')) {
        cpuLimits[property] = limit[property].cpu;
      }
      if (limit[property].hasOwnProperty('memory')) {
        memoryLimits[property] = limit[property].memory;
      }
    }
  });

  if (!_.isEmpty(cpuLimits)){
    _.merge(cpuLimits, {resourceType: `${type} CPU`});
  }

  if (!_.isEmpty(memoryLimits)){
    _.merge(memoryLimits, {resourceType: `${type} Memory`});
  }

  return <React.Fragment>
    {!_.isEmpty(cpuLimits) && <LimitRangeDetailsRow row={cpuLimits} />}
    {!_.isEmpty(memoryLimits) && <LimitRangeDetailsRow row={memoryLimits} />}
  </React.Fragment>;
};

export const LimitRangeDetailsList = (resource) => {
  return <div className="co-m-pane__body">
    <h1 className="co-section-title">Details</h1>
    <div className="row">
      <div className="co-m-table-grid co-m-table-grid--bordered">
        <div className="row co-m-table-grid__head">
          <div className="col-sm-2 col-xs-2">Resource Type</div>
          <div className="col-sm-2 col-xs-2">Min</div>
          <div className="col-sm-2 col-xs-2">Max</div>
          <div className="col-sm-2 col-xs-2">Default Request</div>
          <div className="col-sm-2 col-xs-2">Default Limit</div>
          <div className="col-sm-2 col-xs-2">Max Limit/Request Ratio</div>
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
export type LimitRangeRowsProps = {
  limit: any,
};
export type LimitRangeRowProps = {
  row: any,
};
export type LimitRangeHeaderProps = {
  obj: any,
};
