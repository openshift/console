import React from 'react';

import {makeListPage, makeList, makeDetailsPage} from './factory';
import {Header, rowOfKindstring} from './workloads';
import {detailsPage, ResourceHeading, ResourceSummary, ResourcePodCount} from './utils';

const Details = (replicaSet) => <div>
  <ResourceHeading resourceName="Replica Set" />
  <div className="co-m-pane__body-group">
    <div className="co-m-pane__body-section--bordered">
      <div className="row no-gutter">
        <div className="col-md-6">
          <ResourceSummary resource={replicaSet} />
        </div>
        <div className="col-md-6">
          <ResourcePodCount resource={replicaSet} />
        </div>
      </div>
    </div>
  </div>
</div>;

// TODO: Edit page is still routed to Angular code for now
const Edit = null;

const kind = 'REPLICASET';

const {factory: {pods}} = detailsPage;
const pages = [
  {href: 'details', name: 'Overview', component: Details},
  pods(),
  {href: 'edit', name: 'Desired State', component: Edit},
];
const ReplicaSetsDetailsPage = makeDetailsPage('ReplicaSetsDetailsPage', kind, pages);

const ReplicaSetsList = makeList('ReplicaSets', kind, Header, rowOfKindstring(kind));
const ReplicaSetsPage = makeListPage('ReplicaSetsPage', kind, ReplicaSetsList);

export {ReplicaSetsList, ReplicaSetsPage, ReplicaSetsDetailsPage};
