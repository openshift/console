import React from 'react';
import { Link } from 'react-router';

import {DetailsPage, List, ListPage} from './factory';
import {Cog, LabelList, ResourceCog, ResourceLink, ResourceSummary, Selector, navFactory, detailsPage} from './utils';

const menuActions = [Cog.factory.ModifyPodSelector, Cog.factory.ModifyNodeSelector, ...Cog.factory.common];

const DaemonSetHeader = () => <div className="row co-m-table-grid__head">
  <div className="col-lg-3 col-md-3 col-sm-3 col-xs-6">Name</div>
  <div className="col-lg-3 col-md-3 col-sm-5 col-xs-6">Labels</div>
  <div className="col-lg-3 col-md-3 col-sm-4 hidden-xs">Status</div>
  <div className="col-lg-3 col-md-3 hidden-sm hidden-xs">Node Selector</div>
</div>;

const DaemonSetRow = ({obj: daemonset}) => <div className="row co-resource-list__item">
  <div className="col-lg-3 col-md-3 col-sm-3 col-xs-12">
    <ResourceCog actions={menuActions} kind="daemonset" resource={daemonset} />
    <ResourceLink kind="daemonset" name={daemonset.metadata.name} namespace={daemonset.metadata.namespace} title={daemonset.metadata.uid} />
  </div>
  <div className="col-lg-3 col-md-3 col-sm-5 col-xs-6">
    <LabelList kind="daemonset" labels={daemonset.metadata.labels} />
  </div>
  <div className="col-lg-3 col-md-3 col-sm-4 hidden-xs">
    <Link to={`ns/${daemonset.metadata.namespace}/daemonsets/${daemonset.metadata.name}/pods`} title="pods">
      {daemonset.status.currentNumberScheduled} of {daemonset.status.desiredNumberScheduled} pods
    </Link>
  </div>
  <div className="col-lg-3 col-md-3 hidden-sm hidden-xs">
    <Selector selector={daemonset.spec.selector.matchLabels} />
  </div>
</div>;

const Details = (daemonset) => <div>
  <div className="col-lg-6">
    <div className="co-m-pane">
      <div className="co-m-pane__body">
        <ResourceSummary resource={daemonset} />
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

const {details, pods, editYaml} = navFactory;
const pages = [details(detailsPage(Details)), editYaml(), pods()];

const DaemonSets = props => <List {...props} Header={DaemonSetHeader} Row={DaemonSetRow} />;
const DaemonSetsPage = props => <ListPage canCreate={true} ListComponent={DaemonSets} {...props} />;
const DaemonSetsDetailsPage = props => <DetailsPage pages={pages} menuActions={menuActions} {...props} />;

export {DaemonSets, DaemonSetsPage, DaemonSetsDetailsPage};
