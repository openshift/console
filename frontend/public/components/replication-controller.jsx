import React from 'react';

import {makeListPage, makeList, makeDetailsPage} from './factory';
import {Header, rowOfKind} from './workloads';
import {detailsPage, ResourceHeading, ResourceSummary, ResourcePodCount} from './utils';

const Details = (replicationController) => <div>
  <ResourceHeading resourceName="Replication Controller" />
  <div className="co-m-pane__body-group">
    <div className="co-m-pane__body-section--bordered">
      <div className="row no-gutter">
        <div className="col-md-6">
          <ResourceSummary resource={replicationController} />
        </div>
        <div className="col-md-6">
          <ResourcePodCount resource={replicationController} />
        </div>
      </div>
    </div>
  </div>
</div>;

// TODO: Edit page and Events page are still routed to Angular code for now
const Edit = null;
const Events = null;

const {factory: {pods}} = detailsPage;
const pages = [
  {href: 'details', name: 'Overview', component: Details},
  {href: 'edit', name: 'Edit', component: Edit},
  pods(),
  {href: 'events', name: 'Events', component: Events},
];
const ReplicationControllersDetailsPage = makeDetailsPage('ReplicationControllersDetailsPage', 'replicationcontroller', pages);

const ReplicationControllersList = makeList('ReplicationControllers', 'replicationcontroller', Header, rowOfKind('replicationcontroller'));
const ReplicationControllersPage = makeListPage('ReplicationControllersPage', 'replicationcontroller', ReplicationControllersList);

export {ReplicationControllersList, ReplicationControllersPage, ReplicationControllersDetailsPage};
