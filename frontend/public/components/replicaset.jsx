import React from 'react';

import {makeListPage, makeList, makeDetailsPage} from './factory';
import {Header, rowOfKind} from './workloads';
import {Cog, navFactory, ResourceHeading, ResourceSummary, ResourcePodCount} from './utils';

const {ModifyCount, ModifyPodSelector, ModifyLabels, Edit, Delete} = Cog.factory;
const cogActions = [ModifyCount, ModifyPodSelector, ModifyLabels, Edit, Delete];
const menuActions = _.without(cogActions, Edit);

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

const {details, edit, pods, editYaml} = navFactory;
const pages = [details(Details), edit(), editYaml(), pods()];
const ReplicaSetsDetailsPage = makeDetailsPage('ReplicaSetsDetailsPage', 'replicaset', pages, menuActions);

const ReplicaSetsList = makeList('ReplicaSets', 'replicaset', Header, rowOfKind('replicaset', cogActions));
const ReplicaSetsPage = makeListPage('ReplicaSetsPage', 'replicaset', ReplicaSetsList);

export {ReplicaSetsList, ReplicaSetsPage, ReplicaSetsDetailsPage};
