/* eslint-disable no-undef */

import * as React from 'react';
import * as _ from 'lodash-es';

import { ListPage, List, ListHeader, ColHead, ResourceRow } from '../factory';
import { MsgBox, ResourceLink, ResourceCog, Cog, ResourceIcon } from '../utils';
import { InstallPlanKind } from './index';
import { referenceForModel, referenceForOwnerRef } from '../../module/k8s';
import { SubscriptionModel, ClusterServiceVersionModel, InstallPlanModel } from '../../models';

export const InstallPlanHeader: React.SFC<InstallPlanHeaderProps> = (props) => <ListHeader>
  <ColHead {...props} className="col-md-3" sortField="metadata.name">Name</ColHead>
  <ColHead {...props} className="col-md-2" sortField="metadata.namespace">Namespace</ColHead>
  <ColHead {...props} className="col-md-3">Components</ColHead>
  <ColHead {...props} className="col-md-2">Subscriptions</ColHead>
  <ColHead {...props} className="col-md-2" sortField="status.phase">Status</ColHead>
</ListHeader>;

export const InstallPlanRow: React.SFC<InstallPlanRowProps> = (props) => {
  return <ResourceRow obj={props.obj}>
    <div className="col-md-3">
      <ResourceCog actions={Cog.factory.common} kind={referenceForModel(InstallPlanModel)} resource={props.obj} />
      <ResourceLink kind={referenceForModel(InstallPlanModel)} namespace={props.obj.metadata.namespace} name={props.obj.metadata.name} title={props.obj.metadata.uid} />
    </div>
    <div className="col-md-2">
      <ResourceLink kind="Namespace" name={props.obj.metadata.namespace} title={props.obj.metadata.namespace} displayName={props.obj.metadata.namespace} />
    </div>
    <div className="col-md-3">
      {props.obj.spec.clusterServiceVersionNames.map((csvName, i) => <span key={i}><ResourceIcon kind={referenceForModel(ClusterServiceVersionModel)} /> {csvName}</span>)}
    </div>
    <div className="col-md-2">
      { (props.obj.metadata.ownerReferences || [])
        .filter(ref => referenceForOwnerRef(ref) === referenceForModel(SubscriptionModel))
        .map(ref => <div key={ref.uid}>
          <ResourceLink kind={referenceForModel(SubscriptionModel)} name={ref.name} namespace={props.obj.metadata.namespace} title={ref.uid} />
        </div>) || <span className="text-muted">None</span> }
    </div>
    <div className="col-md-2">
      {_.get(props.obj.status, 'phase', 'Unknown')}
    </div>
  </ResourceRow>;
};

export const InstallPlansList: React.SFC<InstallPlansListProps> = (props) => {
  const EmptyMsg = () => <MsgBox title="No Install Plans Found" detail="Install Plans are created automatically by subscriptions or manually using kubectl." />;
  return <List {...props} Header={InstallPlanHeader} Row={InstallPlanRow} label="Install Plans" EmptyMsg={EmptyMsg} />;
};

export const InstallPlansPage: React.SFC<InstallPlansPageProps> = (props) => <ListPage
  {...props}
  title="Install Plans"
  showTitle={true}
  ListComponent={InstallPlansList}
  filterLabel="Install Plans by name"
  kind={referenceForModel(InstallPlanModel)} />;

export type InstallPlanHeaderProps = {

};

export type InstallPlanRowProps = {
  obj: InstallPlanKind;
};

export type InstallPlansListProps = {

};

export type InstallPlansPageProps = {

};

InstallPlanHeader.displayName = 'InstallPlanHeader';
InstallPlanRow.displayName = 'InstallPlanRow';
InstallPlansList.displayName = 'InstallPlansList';
InstallPlansPage.displayName = 'InstallPlansPage';
