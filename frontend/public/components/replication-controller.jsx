import React from 'react';

import {makeListPage, makeList, makeDetailsPage} from './factory';
import {Header, rowOfKind} from './workloads';
import {Cog, navFactory, ResourceHeading, ResourceSummary, ResourcePodCount} from './utils';

const {ModifyCount, ModifyPodSelector, ModifyLabels, Edit, Delete} = Cog.factory;
const cogActions = [ModifyCount, ModifyPodSelector, ModifyLabels, Edit, Delete];
const menuActions = _.without(cogActions, Edit);

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
const ReplicationControllersDetailsPage = makeDetailsPage('ReplicationControllersDetailsPage', 'replicationcontroller', pages, menuActions);

const ReplicationControllersList = makeList('ReplicationControllers', 'replicationcontroller', Header, rowOfKind('replicationcontroller', cogActions));
const ReplicationControllersPage = makeListPage('ReplicationControllersPage', 'replicationcontroller', ReplicationControllersList);

export {ReplicationControllersList, ReplicationControllersPage, ReplicationControllersDetailsPage};
