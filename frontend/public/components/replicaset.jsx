import React from 'react';

import {makeListPage, makeList, makeDetailsPage} from './factory';
import {Header, rowOfKind} from './workloads';
import {navFactory, ResourceHeading, ResourceSummary, ResourcePodCount} from './utils';

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

const {details, edit, pods} = navFactory;
const pages = [details(Details), edit(), pods()];
const ReplicaSetsDetailsPage = makeDetailsPage('ReplicaSetsDetailsPage', 'replicaset', pages);

const ReplicaSetsList = makeList('ReplicaSets', 'replicaset', Header, rowOfKind('replicaset'));
const ReplicaSetsPage = makeListPage('ReplicaSetsPage', 'replicaset', ReplicaSetsList);

export {ReplicaSetsList, ReplicaSetsPage, ReplicaSetsDetailsPage};
