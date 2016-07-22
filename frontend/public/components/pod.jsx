import React from 'react';

import {angulars} from './react-wrapper';
import {podPhase} from '../module/filter/pods';

import createListComponent from './list-factory';
import createPageComponent from './page-factory';

import {Cog, LabelList, ResourceIcon} from './utils'

const PodCog = ({pod}) => {
  const kind = angulars.kinds.POD;
  const {factory: {ModifyLabels, Delete}} = Cog;
  return <Cog options={[ModifyLabels, Delete].map(f => f(kind, pod))} size="small" anchor="left"></Cog>;
}

const PodRow = (p) => <div className="row co-resource-list__item">
  <div className="col-lg-3 col-md-3 col-sm-3 col-xs-6">
    <PodCog pod={p}></PodCog>
    <ResourceIcon kind="pod"></ResourceIcon>
    <a href={`ns/${p.metadata.namespace}/pods/${p.metadata.name}`} title={p.metadata.uid}>{p.metadata.name}</a>
  </div>
  <div className="col-lg-3 col-md-3 col-sm-4 col-xs-6">
    <LabelList kind="pod" labels={p.metadata.labels}  />
  </div>
  <div className="col-lg-2 col-md-2 col-sm-2 hidden-xs">{podPhase(p)}</div>
  <div className="col-lg-2 col-md-2 hidden-sm hidden-xs">{p.spec.containers.length}</div>
  <div className="col-lg-2 col-md-2 col-sm-2 hidden-xs">
    {!p.spec.nodeName ? '-' : <a href={`nodes/${p.spec.nodeName}`}>{p.spec.nodeName}</a> }
  </div>
</div>;

const PodHeader = () => <div className="row co-m-table-grid__head">
  <div className="col-lg-3 col-md-3 col-sm-3 col-xs-6">Pod Name</div>
  <div className="col-lg-3 col-md-3 col-sm-4 col-xs-6">Pod Labels</div>
  <div className="col-lg-2 col-md-2 col-sm-2 hidden-xs">Status</div>
  <div className="col-lg-2 col-md-2 hidden-sm hidden-xs">Containers</div>
  <div className="col-lg-2 col-md-2 col-sm-2 hidden-xs">Node</div>
</div>;

const dropdownFilters = [{
  type: 'pod-status',
  title: 'Pod Status',
  items: {
    'All Statuses': '',
    'Pending': 'Pending',
    'Running': 'Running',
    'Terminating': 'Terminating',
  },
}];

const PodList = createListComponent('Pods', 'POD', PodHeader, PodRow);
const PodsPage = createPageComponent('PodsPage', 'POD', PodList, dropdownFilters);

export {PodList, PodsPage};

