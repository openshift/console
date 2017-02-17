import React from 'react';

import {DetailsPage, ListPage, makeList} from './factory';
import {Header, rowOfKind} from './workloads';
import {Cog, navFactory, ResourceHeading, ResourceSummary, ResourcePodCount} from './utils';

const menuActions = _.at(Cog.factory, [
  'ModifyCount',
  'ModifyPodSelector',
  'ModifyNodeSelector',
  'ModifyLabels',
  'Edit',
  'Delete',
]);

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

const {details, editYaml, pods, events} = navFactory;
const pages = [details(Details), editYaml(), pods(), events()];
const ReplicationControllersDetailsPage = props => <DetailsPage pages={pages} menuActions={menuActions} {...props} />;

const ReplicationControllersList = makeList('ReplicationControllers', 'replicationcontroller', Header, rowOfKind('replicationcontroller', menuActions));
const ReplicationControllersPage = props => <ListPage canCreate={true} ListComponent={ReplicationControllersList} {...props} />;

export {ReplicationControllersList, ReplicationControllersPage, ReplicationControllersDetailsPage};
