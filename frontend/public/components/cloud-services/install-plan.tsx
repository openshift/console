/* eslint-disable no-undef, no-unused-vars */

import * as React from 'react';
import * as _ from 'lodash-es';
import { match } from 'react-router-dom';
import * as classNames from 'classnames';

import { ListPage, List, ListHeader, ColHead, ResourceRow, DetailsPage } from '../factory';
import { MsgBox, ResourceLink, ResourceCog, Cog, ResourceIcon, navFactory, ResourceSummary, LoadingInline } from '../utils';
import { InstallPlanKind, InstallPlanApproval } from './index';
import { referenceForModel, referenceForOwnerRef, k8sUpdate } from '../../module/k8s';
import { SubscriptionModel, ClusterServiceVersionModel, InstallPlanModel, CatalogSourceModel } from '../../models';
import { breadcrumbsForOwnerRefs } from '../utils/breadcrumbs';

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

export class InstallPlanDetails extends React.Component<InstallPlanDetailsProps, InstallPlanDetailsState> {
  constructor(props) {
    super(props);
    this.state = {waitingForUpdate: false};
  }

  render() {
    const {obj} = this.props;
    const needsApproval = obj.spec.approval === InstallPlanApproval.Manual && obj.spec.approved === false;

    const approve = () => k8sUpdate(InstallPlanModel, {...obj, spec: {...obj.spec, approved: true}})
      .then(() => this.setState({waitingForUpdate: true}))
      .catch((error) => this.setState({error}));

    return <div className="co-m-pane__body">
      <div className="co-m-pane__body-group">
        { this.state.error && <div style={{marginBottom: '10px'}} className="co-clusterserviceversion-detail__error-box">{this.state.error}</div> }
        { this.state.waitingForUpdate
          ? <span><LoadingInline /> Approving</span>
          : <button
            className={classNames('btn', needsApproval ? 'btn-primary' : 'btn-default')}
            disabled={!needsApproval}
            onClick={() => approve()}>
            {needsApproval ? 'Approve' : 'Approved'}
          </button> }
      </div>
      <div className="co-m-pane__body-group">
        <div className="row">
          <div className="col-sm-6">
            <ResourceSummary resource={obj} showNodeSelector={false} showPodSelector={false} showAnnotations={false} />
          </div>
          <div className="col-sm-6">
            <dl className="co-m-pane__details">
              <dt>Status</dt>
              <dd>{_.get(obj.status, 'phase', 'Unknown')}</dd>
              <dt>Components</dt>
              { (obj.spec.clusterServiceVersionNames || []).map((csvName, i) => <dd key={i}>
                <ResourceLink kind={referenceForModel(ClusterServiceVersionModel)} name={csvName} namespace={obj.metadata.namespace} title={csvName} />
              </dd>) }
              <dt>Catalog Sources</dt>
              { (_.get(obj.status, 'catalogSources') || []).map((catalogName, i) => <dd key={i}>
                <ResourceLink kind={referenceForModel(CatalogSourceModel)} name={catalogName} namespace="tectonic-system" title={catalogName} />
              </dd>) }
            </dl>
          </div>
        </div>
      </div>
    </div>;
  }
}

export const InstallPlanDetailsPage: React.SFC<InstallPlanDetailsPageProps> = (props) => <DetailsPage
  {...props}
  namespace={props.match.params.ns}
  kind={referenceForModel(InstallPlanModel)}
  name={props.match.params.name}
  pages={[
    navFactory.details(InstallPlanDetails),
    navFactory.editYaml(),
  ]}
  breadcrumbsFor={(obj) => breadcrumbsForOwnerRefs(obj).concat({
    name: 'Install Plan Details',
    path: props.match.url,
  })}
  menuActions={Cog.factory.common} />;

export type InstallPlanHeaderProps = {

};

export type InstallPlanRowProps = {
  obj: InstallPlanKind;
};

export type InstallPlansListProps = {

};

export type InstallPlansPageProps = {

};

export type InstallPlanDetailsProps = {
  obj: InstallPlanKind;
};

export type InstallPlanDetailsState = {
  waitingForUpdate: boolean;
  error?: string;
};

export type InstallPlanDetailsPageProps = {
  match: match<{ns: string, name: string}>;
};

InstallPlanHeader.displayName = 'InstallPlanHeader';
InstallPlanRow.displayName = 'InstallPlanRow';
InstallPlansList.displayName = 'InstallPlansList';
InstallPlansPage.displayName = 'InstallPlansPage';
