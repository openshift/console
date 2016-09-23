import React from 'react';

import {makeListPage, makeList, makeDetailsPage} from './factory';
import {Header, rowOfKindstring} from './workloads';
import {detailsPage, ResourceHeading, ResourceSummary, ResourcePodCount} from './utils'

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
</div>

// TODO: Edit page and Events page are still routed to Angular code for now
const Edit = null;
const Events = null;

const kind = 'REPLICATIONCONTROLLER';

const {factory: {pods}} = detailsPage;
const pages = [
  {href: 'details', name: 'Overview', component: Details},
  pods(),
  {href: 'edit', name: 'Desired State', component: Edit},
  {href: 'events', name: 'Events', component: Events},
];
const ReplicationControllersDetailsPage = makeDetailsPage('ReplicationControllersDetailsPage', kind, pages);

const ReplicationControllersList = makeList('ReplicationControllers', kind, Header, rowOfKindstring(kind));
const ReplicationControllersPage = makeListPage('ReplicationControllersPage', kind, ReplicationControllersList);

export {ReplicationControllersList, ReplicationControllersPage, ReplicationControllersDetailsPage};
