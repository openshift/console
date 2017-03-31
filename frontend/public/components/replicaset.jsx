import React from 'react';

import {DetailsPage, ListPage, makeList} from './factory';
import {Header, rowOfKind} from './workloads';
import {Cog, navFactory, ResourceHeading, ResourceSummary, ResourcePodCount} from './utils';

const {ModifyCount, ModifyPodSelector, ModifyNodeSelector, common} = Cog.factory;
export const replicaSetMenuActions = [ModifyCount, ModifyPodSelector, ModifyNodeSelector, ...common];

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

const {details, editYaml, pods} = navFactory;
const pages = [details(Details), editYaml(), pods()];
const ReplicaSetsDetailsPage = props => <DetailsPage pages={pages} menuActions={replicaSetMenuActions} {...props} />;

const ReplicaSetsList = makeList('replicaset', Header, rowOfKind('replicaset', replicaSetMenuActions));
const ReplicaSetsPage = props => <ListPage canCreate={true} ListComponent={ReplicaSetsList} {...props} />;

export {ReplicaSetsList, ReplicaSetsPage, ReplicaSetsDetailsPage};
