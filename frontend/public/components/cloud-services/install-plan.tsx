/* eslint-disable no-undef, no-unused-vars */

import * as React from 'react';
import * as _ from 'lodash-es';
import { match, Link } from 'react-router-dom';
import { Map as ImmutableMap } from 'immutable';

import { ListPage, List, ListHeader, ColHead, ResourceRow, DetailsPage } from '../factory';
import { SectionHeading, MsgBox, ResourceLink, ResourceCog, Cog, ResourceIcon, navFactory, ResourceSummary } from '../utils';
import { InstallPlanKind, InstallPlanApproval, Step } from './index';
import { referenceForModel, referenceForOwnerRef, k8sUpdate } from '../../module/k8s';
import { SubscriptionModel, ClusterServiceVersionModel, InstallPlanModel, CatalogSourceModel } from '../../models';
import { breadcrumbsForOwnerRefs } from '../utils/breadcrumbs';

export const InstallPlanHeader: React.SFC<InstallPlanHeaderProps> = (props) => <ListHeader>
  <ColHead {...props} className="col-xs-6 col-sm-4 col-md-3" sortField="metadata.name">Name</ColHead>
  <ColHead {...props} className="col-xs-6 col-sm-4 col-md-3" sortField="metadata.namespace">Namespace</ColHead>
  <ColHead {...props} className="hidden-xs col-sm-4 col-md-3 col-lg-2">Components</ColHead>
  <ColHead {...props} className="hidden-xs hidden-sm col-md-3 col-lg-2">Subscriptions</ColHead>
  <ColHead {...props} className="hidden-xs hidden-sm hidden-md col-lg-2" sortField="status.phase">Status</ColHead>
</ListHeader>;

export const InstallPlanRow: React.SFC<InstallPlanRowProps> = (props) => {
  const phaseFor = (phase: InstallPlanKind["status"]["phase"]) => phase === 'RequiresApproval'
    ? <React.Fragment><i className="fa fa-exclamation-triangle text-warning" aria-hidden="true" /> {phase}</React.Fragment>
    : phase;

  return <ResourceRow obj={props.obj}>
    <div className="col-xs-6 col-sm-4 col-md-3 co-resource-link-wrapper">
      <ResourceCog actions={Cog.factory.common} kind={referenceForModel(InstallPlanModel)} resource={props.obj} />
      <ResourceLink kind={referenceForModel(InstallPlanModel)} namespace={props.obj.metadata.namespace} name={props.obj.metadata.name} title={props.obj.metadata.uid} />
    </div>
    <div className="col-xs-6 col-sm-4 col-md-3">
      <ResourceLink kind="Namespace" name={props.obj.metadata.namespace} title={props.obj.metadata.namespace} displayName={props.obj.metadata.namespace} />
    </div>
    <div className="hidden-xs col-sm-4 col-md-3 col-lg-2">
      {props.obj.spec.clusterServiceVersionNames.map((csvName, i) => <span key={i}><ResourceIcon kind={referenceForModel(ClusterServiceVersionModel)} /> {csvName}</span>)}
    </div>
    <div className="hidden-xs hidden-sm col-md-3 col-lg-2">
      { (props.obj.metadata.ownerReferences || [])
        .filter(ref => referenceForOwnerRef(ref) === referenceForModel(SubscriptionModel))
        .map(ref => <div key={ref.uid}>
          <ResourceLink kind={referenceForModel(SubscriptionModel)} name={ref.name} namespace={props.obj.metadata.namespace} title={ref.uid} />
        </div>) || <span className="text-muted">None</span> }
    </div>
    <div className="hidden-xs hidden-sm hidden-md col-lg-2">
      {phaseFor(_.get(props.obj.status, 'phase')) || 'Unknown'}
    </div>
  </ResourceRow>;
};
export const InstallPlansList: React.SFC<InstallPlansListProps> = (props) => {
  const EmptyMsg = () => <MsgBox title="No Install Plans Found" detail="Install Plans are created automatically by subscriptions or manually using kubectl." />;
  return <List {...props} Header={InstallPlanHeader} Row={InstallPlanRow} EmptyMsg={EmptyMsg} />;
};

export const InstallPlansPage: React.SFC<InstallPlansPageProps> = (props) => <ListPage
  {...props}
  title="Install Plans"
  showTitle={true}
  ListComponent={InstallPlansList}
  filterLabel="Install Plans by name"
  kind={referenceForModel(InstallPlanModel)} />;

export const InstallPlanDetails: React.SFC<InstallPlanDetailsProps> = ({obj}) => {
  const needsApproval = obj.spec.approval === InstallPlanApproval.Manual && obj.spec.approved === false;

  return <React.Fragment>
    { needsApproval && <div className="co-well">
      <h4>Review Manual Install Plan</h4>
      <p>Inspect the requirements for the components specified in this install plan before approving.</p>
      <Link to={`/k8s/ns/${obj.metadata.namespace}/${referenceForModel(InstallPlanModel)}/${obj.metadata.name}/components`}>
        <button className="btn btn-info">Preview Install Plan</button>
      </Link>
    </div> }
    <div className="co-m-pane__body">
      <SectionHeading text="Install Plan Overview" />
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
                { obj.status.phase === 'Complete'
                  ? <ResourceLink kind={referenceForModel(ClusterServiceVersionModel)} name={csvName} namespace={obj.metadata.namespace} title={csvName} />
                  : <React.Fragment><ResourceIcon kind={referenceForModel(ClusterServiceVersionModel)} />{csvName}</React.Fragment> }
              </dd>) }
              <dt>Catalog Sources</dt>
              { (_.get(obj.status, 'catalogSources') || []).map((catalogName, i) => <dd key={i}>
                <ResourceLink kind={referenceForModel(CatalogSourceModel)} name={catalogName} namespace="openshift" title={catalogName} />
              </dd>) }
            </dl>
          </div>
        </div>
      </div>
    </div>
  </React.Fragment>;
};

export class InstallPlanPreview extends React.Component<InstallPlanPreviewProps, InstallPlanPreviewState> {
  constructor(props) {
    super(props);
    this.state = {needsApproval: this.props.obj.spec.approval === InstallPlanApproval.Manual && this.props.obj.spec.approved === false};
  }

  render() {
    const {obj} = this.props;

    const plan = _.get(obj.status, 'plan') || [];
    const stepsByCSV = plan.reduce((acc, step) => acc.update(step.resolving, [], steps => steps.concat([step])), ImmutableMap<string, Step[]>()).toArray();

    const approve = () => k8sUpdate(InstallPlanModel, {...obj, spec: {...obj.spec, approved: true}})
      .then(() => this.setState({needsApproval: false}))
      .catch((error) => this.setState({error}));

    const stepStatus = (status: Step['status']) => <React.Fragment>
      {status === 'Present' && <i className="fa fa-check-circle co-icon-space-r" aria-hidden="true" />}
      {status === 'Created' && <i className="fa fa-plus-circle co-icon-space-r" aria-hidden="true" />}
      {status}
    </React.Fragment>;

    return plan.length > 0
      ? <React.Fragment>
        { this.state.error && <div className="co-clusterserviceversion-detail__error-box">{this.state.error}</div> }
        { this.state.needsApproval && <div className="co-well">
          <h4>Review Manual Install Plan</h4>
          <p>Once approved, the following resources will be created in order to satisfy the requirements for the components specified in the plan.</p>
          <button
            className="btn btn-info"
            disabled={!this.state.needsApproval}
            onClick={() => approve()}>
            {this.state.needsApproval ? 'Approve' : 'Approved'}
          </button>
        </div> }
        { stepsByCSV.map((steps, i) => <div key={i} className="co-m-pane__body">
          <SectionHeading text={steps[0].resolving} />
          <div className="co-table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Kind</th>
                  <th>API Version</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                { steps.map((step, key) => <tr key={key}>
                  <td>{step.resource.name}</td>
                  <td>
                    <ResourceIcon kind={step.resource.kind === ClusterServiceVersionModel.kind ? referenceForModel(ClusterServiceVersionModel) : step.resource.kind} />
                    {step.resource.kind}
                  </td>
                  <td>{step.resource.group}/{step.resource.version}</td>
                  <td>
                    {stepStatus(step.status)}
                  </td>
                </tr>) }
              </tbody>
            </table>
          </div>
        </div>) }
      </React.Fragment>
      : <div className="co-m-pane__body">
        <MsgBox title="No Components Resolved" detail="This install plan has not been fully resolved yet." />
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
    {href: 'components', name: 'Components', component: InstallPlanPreview},
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

export type InstallPlanDetailsPageProps = {
  match: match<{ns: string, name: string}>;
};

export type InstallPlanPreviewProps = {
  obj: InstallPlanKind;
};

export type InstallPlanPreviewState = {
  needsApproval: boolean;
  error?: string;
};

InstallPlanHeader.displayName = 'InstallPlanHeader';
InstallPlanRow.displayName = 'InstallPlanRow';
InstallPlansList.displayName = 'InstallPlansList';
InstallPlansPage.displayName = 'InstallPlansPage';
