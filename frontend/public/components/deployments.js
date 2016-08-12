import React from 'react';
import {angulars} from './react-wrapper';
import {PodList} from './pods';

import createListComponent from './list-factory';
import createPageComponent from './page-factory';
import withPodList from './withPodList';

import {Cog, Selector, LabelList, ResourceIcon} from './utils'

const DeploymentCog = ({d}) => {
  const {factory: {Edit, Delete, ModifyLabels, ModifyCount, ModifyPodSelector}} = Cog;
  const kind = angulars.kinds.DEPLOYMENT;
  const options = [ModifyCount, ModifyPodSelector, ModifyLabels, Edit, Delete].map(f => f(kind, d));

  return <Cog options={options} size="small" anchor="left"></Cog>;
}

const DeploymentHeader = () => <div className="row co-m-table-grid__head">
  <div className="col-lg-3 col-md-3 col-sm-3 col-xs-6">Name</div>
  <div className="col-lg-3 col-md-3 col-sm-5 col-xs-6">Labels</div>
  <div className="col-lg-3 col-md-3 col-sm-4 hidden-xs">Status</div>
  <div className="col-lg-3 col-md-3 hidden-sm hidden-xs">Pod Selector</div>
</div>;

const DeploymentRow = (d) => <div className="row co-m-table-grid--clickable co-resource-list__item">
  <div className="col-lg-3 col-md-3 col-sm-3 col-xs-12">
    <DeploymentCog d={d} />
    <ResourceIcon kind="deployment"></ResourceIcon>
    <a href={`/ns/${d.metadata.namespace}/deployments/${d.metadata.name}`} title={d.metadata.uid}>{d.metadata.name}</a>
  </div>
  <div className="col-lg-3 col-md-3 col-sm-5 col-xs-6">
    <LabelList kind="deployment" labels={d.metadata.labels}  />
  </div>
  <div className="col-lg-3 col-md-3 col-sm-4 hidden-xs">
    {d.status.replicas} of {d.spec.replicas} pods
  </div>
  <div className="col-lg-3 col-md-3 hidden-sm hidden-xs">
    <Selector selector={d.spec.selector}></Selector>
  </div>
</div>

const DeploymentList = createListComponent('Deployments', 'deployments', DeploymentHeader, withPodList(DeploymentRow));
const DeploymentsPage = createPageComponent('DeploymentsPage', 'DEPLOYMENT', DeploymentList);

export {DeploymentHeader, DeploymentRow, DeploymentList, DeploymentsPage};
