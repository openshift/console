import React from 'react';

import {makeListPage, makeList, makeDetailsPage} from './factory';
import {Header, rowOfKind} from './workloads';
import {navFactory, ResourceHeading, ResourceSummary, ResourcePodCount} from './utils';

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

const {details, edit, pods, events} = navFactory;
const pages = [details(Details), edit(), pods(), events()];
const ReplicationControllersDetailsPage = makeDetailsPage('ReplicationControllersDetailsPage', 'replicationcontroller', pages);

const ReplicationControllersList = makeList('ReplicationControllers', 'replicationcontroller', Header, rowOfKind('replicationcontroller'));
const ReplicationControllersPage = makeListPage('ReplicationControllersPage', 'replicationcontroller', ReplicationControllersList);

export {ReplicationControllersList, ReplicationControllersPage, ReplicationControllersDetailsPage};
