import React from 'react';

import { ResourceEventStream } from './events';
import { DetailsPage, List, ListPage } from './factory';
import { replicaSetMenuActions } from './replicaset';
import { Header, rowOfKind } from './workloads';
import { navFactory, Heading, ResourceSummary, ResourcePodCount } from './utils';

const Details = (replicationController) => <div>
  <Heading text="Replication Controller Overview" />
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
const pages = [details(Details), editYaml(), pods(), events(ResourceEventStream)];

export const ReplicationControllersDetailsPage = props => <DetailsPage {...props} pages={pages} menuActions={replicaSetMenuActions} />;

export const ReplicationControllersList = props => <List {...props} Header={Header} Row={rowOfKind('replicationcontroller', replicaSetMenuActions)} />;
export const ReplicationControllersPage = props => <ListPage canCreate={true} ListComponent={ReplicationControllersList} {...props} />;
