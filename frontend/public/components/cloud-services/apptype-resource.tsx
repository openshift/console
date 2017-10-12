/* eslint-disable no-undef, no-unused-vars, no-case-declarations */

import * as React from 'react';
import { Link } from 'react-router-dom';
import * as _ from 'lodash';

import { AppTypeResourceKind, CustomResourceDefinitionKind, ALMCapabilites, AppTypeKind } from './index';
import { List, MultiListPage, ListHeader, ColHead, DetailsPage } from '../factory';
import { ResourceLink, StatusBox, navFactory, Timestamp, LabelList } from '../utils';
import { connectToPlural, K8sKind } from '../../kinds';

export const AppTypeResourceOutput = (props: AppTypeResourceOutputProps) => {
  const {outputDefinition, outputValue} = props;

  return outputDefinition['x-alm-capabilities'].reduce((result, output) => {
    switch (output) {
      case ALMCapabilites.tectonicLink:
      case ALMCapabilites.w3Link:
        return <a href={outputValue}>{outputValue.replace(/https?:\/\//, '')}</a>;

      case ALMCapabilites.metrics:
        const metricsData = JSON.parse(props.outputValue);
        const metrics = metricsData.metrics || [];

        return <div className="co-apptype-resource-output--metrics">
          { metrics.map((value, i) => <a href={`${metricsData.endpoint}/graphs?g0.expr=${value.query}`} key={i}>{value.name}</a>) }
        </div>;

      default:
        return result;
    }
  }, <span>{outputValue || 'None'}</span>);
};

export const AppTypeResourceHeader = (props: AppTypeResourceHeaderProps) => <ListHeader>
  <ColHead {...props} className="col-xs-2" sortField="metadata.name">Name</ColHead>
  <ColHead {...props} className="col-xs-2" sortField="metadata.labels">Labels</ColHead>
  <ColHead {...props} className="col-xs-2" sortField="kind">Type</ColHead>
  <ColHead {...props} className="col-xs-2">Status</ColHead>
  <ColHead {...props} className="col-xs-2">Version</ColHead>
  <ColHead {...props} className="col-xs-2">Last Updated</ColHead>
</ListHeader>;

export const AppTypeResourceRow = (props: AppTypeResourceRowProps) => {
  const {obj} = props;

  return <div className="row co-resource-list__item">
    <div className="col-xs-2">
      <ResourceLink kind={obj.kind} namespace={obj.metadata.namespace} title={obj.metadata.name} name={obj.metadata.name} />
    </div>
    <div className="col-xs-2">
      <LabelList kind={obj.kind} labels={obj.metadata.labels} />
    </div>
    <div className="col-xs-2">
      {obj.kind}
    </div>
    <div className="col-xs-2">
      {'Running'}
    </div>
    <div className="col-xs-2">
      {obj.spec.version || 'None'}
    </div>
    <div className="col-xs-2">
      <Timestamp timestamp={obj.metadata.creationTimestamp} />
    </div>
  </div>;
};

export const AppTypeResourceList = (props: AppTypeResourceListProps) => (
  <List {...props} Header={AppTypeResourceHeader} Row={AppTypeResourceRow} />
);

export const AppTypeResourcesPage = (props: AppTypeResourcesPageProps) => {
  const resources = props.data ? props.data.map((resource) => ({kind: resource.spec.names.kind, namespaced: true})) : [];

  return props.loaded && props.data.length > 0
    ? <MultiListPage
      {...props}
      createButtonText="New resource"
      ListComponent={AppTypeResourceList}
      filterLabel="Resources by name"
      resources={resources}
      flatten={(resources) => _.flatMap(resources, (resource: any) => _.map(resource.data, item => item))}
      rowFilters={[{
        type: 'apptype-resource-kind',
        selected: props.data.map((resource) => resource.spec.names.kind),
        reducer: (obj) => obj.kind,
        items: props.data.map((resource) => ({id: resource.spec.names.kind, title: resource.spec.names.kind})),
      }]}
    />
    : <StatusBox label="Application Resources" loaded={props.loaded} />;
};

export const AppTypeResourceDetails = connectToPlural((props: AppTypeResourcesDetailsProps) => {
  const {kind, metadata, spec} = props.obj;
  const matchLabels = spec.selector ? _.map(spec.selector.matchLabels, (val, key) => `${key}=${val}`) : [];

  const customOutputs = _.map(JSON.parse(_.get(props.kindObj, 'annotations.outputs', '{}')), (outputDefinition, name) => {
    return Object.assign({}, outputDefinition, {value: _.get(props.obj, 'outputs', {})[name]});
  });

  return <div className="co-apptype-resource-details co-m-pane">
    <div className="co-m-pane__body">
      <h1 className="co-section-title">{`${kind} Overview`}</h1>
      <div className="co-apptype-resource-details__section co-apptype-resource-details__section--info">
        <div className="co-apptype-resource-details__section--info__item">
          <dt>Name</dt>
          <dd>{metadata.name}</dd>
          <dt>Created At</dt>
          <dd><Timestamp timestamp={metadata.creationTimestamp} /></dd>
        </div>
        { matchLabels.length > 0 && <div className="co-apptype-resource-details__section--info__item">
          <dt>Resources</dt>
          <dd>
            <Link to={`/ns/${metadata.namespace}/search?q=${matchLabels.map(pair => `${pair},`)}`} title="View resources">
              View resources
            </Link>
          </dd>
        </div> }
        <div className="co-apptype-resource-details__section--info__item">
          <dt>Important Metrics</dt>
          { customOutputs.filter(output => output['x-alm-capabilities'].indexOf(ALMCapabilites.metrics) !== -1).map((output: any, i) => <dd key={i}>
            <AppTypeResourceOutput outputDefinition={output} outputValue={output.value} />
          </dd>) }
        </div>
      </div>
    </div>
  </div>;
});

export const AppTypeResourcesDetailsPage = (props: AppTypeResourcesDetailsPageProps) => <DetailsPage
  {...props}
  pages={[
    navFactory.details(AppTypeResourceDetails),
    navFactory.editYaml(),
  ]}
/>;

export type AppTypeResourceListProps = {
  loaded: boolean;
  data: AppTypeResourceKind[];
  filters: {[key: string]: any};
  reduxID?: string;
  reduxIDs?: string[];
  rowSplitter?: any;
  staticFilters?: any;
};

export type AppTypeResourceHeaderProps = {
  data: AppTypeResourceKind[];
};

export type AppTypeResourceRowProps = {
  obj: AppTypeResourceKind;
};

export type AppTypeResourceOutputProps = {
  outputDefinition: {
    name: string;
    displayName: string;
    description: string;
    'x-alm-capabilities': string[];
  };
  outputValue: any;
};

export type AppTypeResourcesPageProps = {
  data: CustomResourceDefinitionKind[]
  loaded: boolean;
  appType: AppTypeKind;
};

export type AppTypeResourcesDetailsProps = {
  obj: AppTypeResourceKind;
  kindObj: K8sKind;
  kindsInFlight: boolean;
};

export type AppTypeResourcesDetailsPageProps = {
  kind: string;
  name: string;
  namespace: string;
};
