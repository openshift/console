/* eslint-disable no-undef, no-unused-vars, no-case-declarations */

import * as React from 'react';
import * as _ from 'lodash';

import { AppTypeResourceKind, CustomResourceDefinitionKind, ALMCapabilites } from './index';
import { List, ListHeader, ColHead } from '../factory';
import { FirehoseHoC, ResourceLink, StatusBox } from '../utils';

const maxOutputs = 4;

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

export const AppTypeResourceHeader = (props: AppTypeResourceHeaderProps) => {
  const outputs = JSON.parse(_.get<string>(props.kindObj, 'metadata.annotations.outputs', '{}'));

  return <ListHeader>
    <ColHead {...props} className="col-sm-8 col-md-2" sortField="metadata.name">Name</ColHead>
    { Object.keys(outputs).slice(0, maxOutputs).map((name, i) => (
      <ColHead key={i} className="hidden-sm col-md-2" {...props}>{outputs[name].displayName}</ColHead>
    )) }
    { Object.keys(outputs).length > maxOutputs && (
      <ColHead {...props} className="hidden-sm col-md-1">{`${Object.keys(outputs).length - maxOutputs} more...`}</ColHead>)
    }
  </ListHeader>;
};

export const AppTypeResourceRow = (props: AppTypeResourceRowProps) => {
  const {obj, kindObj} = props;
  const outputs = JSON.parse(_.get<string>(kindObj, 'metadata.annotations.outputs', '{}'));
  
  return <div className="row co-resource-list__item">
    <div className="col-sm-8 col-md-2">
      <ResourceLink kind={obj.kind} namespace={obj.metadata.namespace} title={obj.metadata.name} name={obj.metadata.name} />
    </div>
    { Object.keys(outputs).slice(0, maxOutputs).map((name, i) => (<div className="hidden-sm col-md-2" key={i}>
      { obj.outputs && obj.outputs[name]
        ? <AppTypeResourceOutput outputDefinition={outputs[name]} outputValue={obj.outputs[name]} /> 
        : <div>None</div> }
    </div>
    )) } 
  </div>;
};

export const AppTypeResourceList = (props: AppTypeResourceListProps) => {
  return <List {...props} kindObj={props.kindObj} Header={AppTypeResourceHeader} Row={AppTypeResourceRow} />;
};

export const AppTypeResources = (props: AppTypeResourcesProps) => {
  return props.loaded && props.data.length > 0
    ? <div>
      { props.data.map((resource, i) => (
        <div key={i}>
          <h4 style={{marginBottom: '15px'}}>{`${resource.metadata.annotations.displayName}`}</h4>
          <FirehoseHoC kind={resource.spec.names.kind} Component={(props) => <AppTypeResourceList {...props} kindObj={resource} />} isList={true} />
        </div>
      )) }
    </div>
    : <StatusBox label="Application Resources" loaded={props.loaded} />;
};

export type AppTypeResourcesProps = {
  loaded: boolean;
  data: CustomResourceDefinitionKind[];  
};   
 
export type AppTypeResourceListProps = {
  loaded: boolean;
  kindObj: CustomResourceDefinitionKind;
  data: AppTypeResourceKind[];
  filters: {[key: string]: any};
  reduxID?: string;
  reduxIDs?: string[];
  rowSplitter?: any;
  staticFilters?: any; 
};

export type AppTypeResourceHeaderProps = {
  kindObj: CustomResourceDefinitionKind;
  data: AppTypeResourceKind[];
};

export type AppTypeResourceRowProps = {
  obj: AppTypeResourceKind;
  kindObj: CustomResourceDefinitionKind;
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
