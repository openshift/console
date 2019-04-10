/* eslint-disable no-undef, no-unused-vars */

import * as React from 'react';
import * as _ from 'lodash-es';
import { match, Link } from 'react-router-dom';
import { Map as ImmutableMap } from 'immutable';

import { MultiListPage, List, ListHeader, ColHead, ResourceRow, DetailsPage } from '../factory';
import { SectionHeading, MsgBox, ResourceLink, ResourceKebab, Kebab, ResourceIcon, navFactory, ResourceSummary, history } from '../utils';
import { InstallPlanKind, InstallPlanApproval, olmNamespace, Step, referenceForStepResource } from './index';
import { referenceForModel, referenceForOwnerRef, k8sUpdate, apiVersionForReference } from '../../module/k8s';
import { SubscriptionModel, ClusterServiceVersionModel, InstallPlanModel, CatalogSourceModel, OperatorGroupModel } from '../../models';
import { breadcrumbsForOwnerRefs } from '../utils/breadcrumbs';
import { requireOperatorGroup } from './operator-group';
import { installPlanPreviewModal } from '../modals';

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
    <div className="col-xs-6 col-sm-4 col-md-3">
      <ResourceLink kind={referenceForModel(InstallPlanModel)} namespace={props.obj.metadata.namespace} name={props.obj.metadata.name} title={props.obj.metadata.uid} />
    </div>
    <div className="col-xs-6 col-sm-4 col-md-3">
      <ResourceLink kind="Namespace" name={props.obj.metadata.namespace} title={props.obj.metadata.namespace} displayName={props.obj.metadata.namespace} />
    </div>
    <div className="hidden-xs col-sm-4 col-md-3 col-lg-2">
      <ul className="list-unstyled">
        { props.obj.spec.clusterServiceVersionNames.map((csvName, i) => <li key={i}>
          { _.get(props, 'obj.status.phase') === 'Complete'
            ? <ResourceLink kind={referenceForModel(ClusterServiceVersionModel)} name={csvName} namespace={props.obj.metadata.namespace} title={csvName} />
            : <React.Fragment><ResourceIcon kind={referenceForModel(ClusterServiceVersionModel)} />{csvName}</React.Fragment> }
        </li>) }
      </ul>
    </div>
    <div className="hidden-xs hidden-sm col-md-3 col-lg-2">
      { (props.obj.metadata.ownerReferences || [])
        .filter(ref => referenceForOwnerRef(ref) === referenceForModel(SubscriptionModel))
        .map(ref => <ul key={ref.uid} className="list-unstyled">
          <li><ResourceLink kind={referenceForModel(SubscriptionModel)} name={ref.name} namespace={props.obj.metadata.namespace} title={ref.uid} /></li>
        </ul>) || <span className="text-muted">None</span> }
    </div>
    <div className="hidden-xs hidden-sm hidden-md col-lg-2">
      {phaseFor(_.get(props.obj.status, 'phase')) || 'Unknown'}
    </div>
    <div className="dropdown-kebab-pf">
      <ResourceKebab actions={Kebab.factory.common} kind={referenceForModel(InstallPlanModel)} resource={props.obj} />
    </div>
  </ResourceRow>;
};
export const InstallPlansList = requireOperatorGroup((props: InstallPlansListProps) => {
  const EmptyMsg = () => <MsgBox title="No Install Plans Found" detail="Install Plans are created automatically by subscriptions or manually using the CLI." />;
  return <List {...props} Header={InstallPlanHeader} Row={InstallPlanRow} EmptyMsg={EmptyMsg} />;
});

export const InstallPlansPage: React.SFC<InstallPlansPageProps> = (props) => {
  const namespace = _.get(props.match, 'params.ns');
  return (
    <MultiListPage
      {...props}
      namespace={namespace}
      resources={[
        {kind: referenceForModel(InstallPlanModel), namespace, namespaced: true, prop: 'installPlan'},
        {kind: referenceForModel(OperatorGroupModel), namespace, namespaced: true, prop: 'operatorGroup'},
      ]}
      flatten={resources => _.get(resources.installPlan, 'data', [])}
      title="Install Plans"
      showTitle={false}
      ListComponent={InstallPlansList}
      filterLabel="Install Plans by name" />
  );
};

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
            <ResourceSummary resource={obj} showAnnotations={false} />
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
                <ResourceLink kind={referenceForModel(CatalogSourceModel)} name={catalogName} namespace={obj.spec.sourceNamespace || olmNamespace} title={catalogName} />
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
    const subscription = obj.metadata.ownerReferences.find(ref => referenceForOwnerRef(ref) === referenceForModel(SubscriptionModel));

    const plan = _.get(obj.status, 'plan') || [];
    const stepsByCSV = plan.reduce((acc, step) => acc.update(step.resolving, [], steps => steps.concat([step])), ImmutableMap<string, Step[]>()).toArray();

    const approve = () => k8sUpdate(InstallPlanModel, {...obj, spec: {...obj.spec, approved: true}})
      .then(() => this.setState({needsApproval: false}))
      .catch((error) => this.setState({error}));

    const stepStatus = (status: Step['status']) => <React.Fragment>
      {status === 'Present' && <i className="pficon pficon-ok co-icon-space-r" aria-hidden="true" />}
      {status === 'Created' && <i className="pficon pficon-add-circle-o co-icon-space-r" aria-hidden="true" />}
      {status}
    </React.Fragment>;

    return plan.length > 0
      ? <React.Fragment>
        { this.state.error && <div className="co-clusterserviceversion-detail__error-box">{this.state.error}</div> }
        { this.state.needsApproval && <div className="co-well">
          <h4>Review Manual Install Plan</h4>
          <p>Once approved, the following resources will be created in order to satisfy the requirements for the components specified in the plan. Click the resource name to view the resource in detail.</p>
          <button
            className="btn btn-info"
            disabled={!this.state.needsApproval}
            onClick={() => approve()}>
            {this.state.needsApproval ? 'Approve' : 'Approved'}
          </button>
          <button
            className="btn btn-default"
            disabled={false}
            onClick={() => history.push(`/k8s/ns/${obj.metadata.namespace}/${referenceForModel(SubscriptionModel)}/${subscription.name}?showDelete=true`)}>
            Deny
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
                  <td>{ ['Present', 'Created'].includes(step.status)
                    ? <ResourceLink
                      kind={referenceForStepResource(step.resource)}
                      namespace={obj.metadata.namespace}
                      name={step.resource.name}
                      title={step.resource.name} />
                    : <React.Fragment>
                      <ResourceIcon kind={referenceForStepResource(step.resource)} />
                      <button className="btn btn-link" onClick={() => installPlanPreviewModal({stepResource: step.resource})}>{step.resource.name}</button>
                    </React.Fragment>}
                  </td>
                  <td>{step.resource.kind}</td>
                  <td>{apiVersionForReference(referenceForStepResource(step.resource))}</td>
                  <td>{stepStatus(step.status)}</td>
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
  menuActions={Kebab.factory.common} />;

export type InstallPlanHeaderProps = {

};

export type InstallPlanRowProps = {
  obj: InstallPlanKind;
};

export type InstallPlansListProps = {

};

export type InstallPlansPageProps = {
  namespace?: string;
  match?: match<{ns?: string}>;
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
