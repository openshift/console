import React from 'react';

import {angulars} from './react-wrapper';

import withPodList from './withPodList';
import createListComponent from './list-factory';
import createPageComponent from './page-factory';

import {Cog, LabelList, ResourceIcon, Selector} from './utils'

const DSCog = ({pod}) => {
  const kind = angulars.kinds.DAEMONSET;
  const {factory: {ModifyLabels, Delete}} = Cog;
  return <Cog options={[ModifyLabels, Delete].map(f => f(kind, pod))} size="small" anchor="left"></Cog>;
}

const DSHeader = () => <div className="row co-m-table-grid__head">
  <div className="col-lg-3 col-md-3 col-sm-3 col-xs-6">Name</div>
  <div className="col-lg-3 col-md-3 col-sm-5 col-xs-6">Labels</div>
  <div className="col-lg-3 col-md-3 col-sm-4 hidden-xs">Status</div>
  <div className="col-lg-3 col-md-3 hidden-sm hidden-xs">Node Selector</div>
</div>

const DSRow = (ds) => <div className="row co-m-table-grid--clickable co-resource-list__item">
  <div className="col-lg-3 col-md-3 col-sm-3 col-xs-12">
    <DSCog pod={ds}></DSCog>
    <ResourceIcon kind="daemonset"></ResourceIcon>
    {ds.metadata.name}
  </div>
  <div className="col-lg-3 col-md-3 col-sm-5 col-xs-6">
    <LabelList kind="daemonset" labels={ds.metadata.labels}  />
  </div>
  <div className="col-lg-3 col-md-3 col-sm-4 hidden-xs">
    {ds.status.currentNumberScheduled} of {ds.status.desiredNumberScheduled} pods
  </div>
  <div className="col-lg-3 col-md-3 hidden-sm hidden-xs">
    <Selector selector={ds.spec.selector.matchLabels}></Selector>
  </div>
</div>

const DaemonSets = createListComponent('DaemonSets', 'DAEMONSET', DSHeader, withPodList(DSRow));
const DaemonSetsPage = createPageComponent('DaemonSetsPage', 'DAEMONSET', DaemonSets);

export {DaemonSets, DaemonSetsPage};

