import React from 'react';

import {angulars} from './react-wrapper';
import {makeDetailsPage, makeListPage, makeList} from './factory';
import {Cog, LabelList, ResourceIcon, Selector, Timestamp, detailsPage} from './utils';

const DaemonSetCog = ({daemonset}) => {
  const kind = angulars.kinds.DAEMONSET;
  const {factory: {ModifyLabels, Delete}} = Cog;
  return <Cog options={[ModifyLabels, Delete].map(f => f(kind, daemonset))} size="small" anchor="left" />;
};

const DaemonSetHeader = () => <div className="row co-m-table-grid__head">
  <div className="col-lg-3 col-md-3 col-sm-3 col-xs-6">Name</div>
  <div className="col-lg-3 col-md-3 col-sm-5 col-xs-6">Labels</div>
  <div className="col-lg-3 col-md-3 col-sm-4 hidden-xs">Status</div>
  <div className="col-lg-3 col-md-3 hidden-sm hidden-xs">Node Selector</div>
</div>;

const DaemonSetRow = ({obj: daemonset}) => <div className="row co-resource-list__item">
  <div className="col-lg-3 col-md-3 col-sm-3 col-xs-12">
    <DaemonSetCog daemonset={daemonset} />
    <ResourceIcon kind="daemonset" />
    <a href={`ns/${daemonset.metadata.namespace}/daemonsets/${daemonset.metadata.name}/details`} title={daemonset.metadata.uid}>
      {daemonset.metadata.name}
    </a>
  </div>
  <div className="col-lg-3 col-md-3 col-sm-5 col-xs-6">
    <LabelList kind="daemonset" labels={daemonset.metadata.labels} />
  </div>
  <div className="col-lg-3 col-md-3 col-sm-4 hidden-xs">
    <a href={`ns/${daemonset.metadata.namespace}/daemonsets/${daemonset.metadata.name}/pods`} title="pods">
      {daemonset.status.currentNumberScheduled} of {daemonset.status.desiredNumberScheduled} pods
    </a>
  </div>
  <div className="col-lg-3 col-md-3 hidden-sm hidden-xs">
    <Selector selector={daemonset.spec.selector.matchLabels} />
  </div>
</div>;

const Details = (daemonset) => <div>
  <div className="col-lg-6">
    <div className="co-m-pane">
      <div className="co-m-pane__body">
        <dl>
          <dt>Name</dt>
          <dd>{daemonset.metadata.name || '-'}</dd>
          <dt>Labels</dt>
          <dd><LabelList kind="daemonset" labels={daemonset.metadata.labels} /></dd>
          <dt>Pod Selector</dt>
          <dd><Selector selector={daemonset.spec.selector.matchLabels} expand={true} /></dd>
          <dt>Created At</dt>
          <dd><Timestamp timestamp={daemonset.metadata.creationTimestamp} /></dd>
        </dl>
      </div>
    </div>
  </div>
  <div className="col-lg-6">
    <div className="co-m-pane">
      <div className="co-m-pane__body">
        <dl>
          <dt>Current Count</dt>
          <dd>{daemonset.status.currentNumberScheduled || '-'}</dd>
          <dt>Desired Count</dt>
          <dd>{daemonset.status.desiredNumberScheduled || '-'}</dd>
        </dl>
      </div>
    </div>
  </div>
</div>;

const {factory: {pods}} = detailsPage;
const pages = [{href: 'details', name: 'Overview', component: detailsPage(Details)}, pods()];

const DaemonSets = makeList('DaemonSets', 'daemonset', DaemonSetHeader, DaemonSetRow);
const DaemonSetsPage = makeListPage('DaemonSetsPage', 'DAEMONSET', DaemonSets);
const DaemonSetsDetailsPage = makeDetailsPage('DaemonSetsDetailsPage', 'DAEMONSET', pages);

export {DaemonSets, DaemonSetsPage, DaemonSetsDetailsPage};
