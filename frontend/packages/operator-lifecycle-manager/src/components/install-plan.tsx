import * as React from 'react';
import * as _ from 'lodash';
import { match, Link } from 'react-router-dom';
import { Map as ImmutableMap, Set as ImmutableSet, fromJS } from 'immutable';
import { sortable } from '@patternfly/react-table';
import * as classNames from 'classnames';
import { Button } from '@patternfly/react-core';
import {
  MultiListPage,
  DetailsPage,
  Table,
  TableRow,
  TableData,
  RowFunction,
} from '@console/internal/components/factory';
import { Conditions } from '@console/internal/components/conditions';
import {
  SectionHeading,
  MsgBox,
  ResourceLink,
  ResourceKebab,
  Kebab,
  ResourceIcon,
  navFactory,
  ResourceSummary,
  history,
  HintBlock,
} from '@console/internal/components/utils';
import {
  K8sResourceKind,
  referenceForModel,
  referenceForOwnerRef,
  k8sUpdate,
  apiVersionForReference,
} from '@console/internal/module/k8s';
import { GreenCheckCircleIcon, Status } from '@console/shared';
import {
  SubscriptionModel,
  ClusterServiceVersionModel,
  InstallPlanModel,
  OperatorGroupModel,
  CatalogSourceModel,
} from '../models';
import { InstallPlanKind, InstallPlanApproval, Step } from '../types';
import { requireOperatorGroup } from './operator-group';
import { installPlanPreviewModal } from './modals/installplan-preview-modal';
import { referenceForStepResource } from './index';

const tableColumnClasses = [
  '',
  '',
  classNames('pf-m-hidden', 'pf-m-visible-on-sm', 'pf-u-w-16-on-lg'),
  classNames('pf-m-hidden', 'pf-m-visible-on-lg'),
  classNames('pf-m-hidden', 'pf-m-visible-on-xl'),
  Kebab.columnClass,
];

const componentsTableColumnClasses = [
  '',
  '',
  classNames('pf-m-hidden', 'pf-m-visible-on-sm', 'pf-u-w-16-on-lg'),
  classNames('pf-m-hidden', 'pf-m-visible-on-lg'),
];

export const InstallPlanTableHeader = () => {
  return [
    {
      title: 'Name',
      sortField: 'metadata.name',
      transforms: [sortable],
      props: { className: tableColumnClasses[0] },
    },
    {
      title: 'Namespace',
      sortField: 'metadata.namespace',
      transforms: [sortable],
      props: { className: tableColumnClasses[1] },
    },
    {
      title: 'Status',
      sortField: 'status.phase',
      transforms: [sortable],
      props: { className: tableColumnClasses[2] },
    },
    {
      title: 'Components',
      props: { className: tableColumnClasses[3] },
    },
    {
      title: 'Subscriptions',
      props: { className: tableColumnClasses[4] },
    },
    {
      title: '',
      props: { className: tableColumnClasses[5] },
    },
  ];
};
InstallPlanTableHeader.displayName = 'InstallPlanTableHeader';

export const InstallPlanTableRow: RowFunction<K8sResourceKind> = ({ obj, index, key, style }) => {
  const phaseFor = (phase: InstallPlanKind['status']['phase']) => <Status status={phase} />;
  return (
    <TableRow id={obj.metadata.uid} index={index} trKey={key} style={style}>
      {/* Name */}
      <TableData className={tableColumnClasses[0]}>
        <ResourceLink
          kind={referenceForModel(InstallPlanModel)}
          namespace={obj.metadata.namespace}
          name={obj.metadata.name}
          title={obj.metadata.uid}
        />
      </TableData>

      {/* Namespace */}
      <TableData className={tableColumnClasses[1]}>
        <ResourceLink
          kind="Namespace"
          name={obj.metadata.namespace}
          title={obj.metadata.namespace}
          displayName={obj.metadata.namespace}
        />
      </TableData>

      {/* Status */}
      <TableData className={tableColumnClasses[2]}>
        {phaseFor(_.get(obj, 'status.phase') || 'Unknown')}
      </TableData>

      {/* Components */}
      <TableData className={tableColumnClasses[3]}>
        <ul className="list-unstyled">
          {obj.spec.clusterServiceVersionNames.map((csvName) => (
            <li key={csvName}>
              {_.get(obj, 'status.phase') === 'Complete' ? (
                <ResourceLink
                  kind={referenceForModel(ClusterServiceVersionModel)}
                  name={csvName}
                  namespace={obj.metadata.namespace}
                  title={csvName}
                />
              ) : (
                <>
                  <ResourceIcon kind={referenceForModel(ClusterServiceVersionModel)} />
                  {csvName}
                </>
              )}
            </li>
          ))}
        </ul>
      </TableData>

      {/* Subscriptions */}
      <TableData className={tableColumnClasses[4]}>
        {(obj.metadata.ownerReferences || [])
          .filter((ref) => referenceForOwnerRef(ref) === referenceForModel(SubscriptionModel))
          .map((ref) => (
            <ul key={ref.uid} className="list-unstyled">
              <li>
                <ResourceLink
                  kind={referenceForModel(SubscriptionModel)}
                  name={ref.name}
                  namespace={obj.metadata.namespace}
                  title={ref.uid}
                />
              </li>
            </ul>
          )) || <span className="text-muted">None</span>}
      </TableData>

      {/* Kebab */}
      <TableData className={tableColumnClasses[5]}>
        <ResourceKebab
          actions={[...Kebab.factory.common]}
          kind={referenceForModel(InstallPlanModel)}
          resource={obj}
        />
      </TableData>
    </TableRow>
  );
};

export const InstallPlansList = requireOperatorGroup((props: InstallPlansListProps) => {
  const EmptyMsg = () => (
    <MsgBox
      title="No Install Plans Found"
      detail="Install Plans are created automatically by subscriptions or manually using the CLI."
    />
  );
  return (
    <Table
      {...props}
      aria-label="Install Plans"
      Header={InstallPlanTableHeader}
      Row={InstallPlanTableRow}
      EmptyMsg={EmptyMsg}
    />
  );
});

const getCatalogSources = (
  installPlan: InstallPlanKind,
): { sourceName: string; sourceNamespace: string }[] =>
  _.reduce(
    _.get(installPlan, 'status.plan') || [],
    (accumulator, { resource: { sourceName, sourceNamespace } }) =>
      accumulator.add(fromJS({ sourceName, sourceNamespace })),
    ImmutableSet(),
  ).toJS();

export const InstallPlansPage: React.SFC<InstallPlansPageProps> = (props) => {
  const namespace = _.get(props.match, 'params.ns');
  return (
    <MultiListPage
      {...props}
      namespace={namespace}
      resources={[
        {
          kind: referenceForModel(InstallPlanModel),
          namespace,
          namespaced: true,
          prop: 'installPlan',
        },
        {
          kind: referenceForModel(OperatorGroupModel),
          namespace,
          namespaced: true,
          prop: 'operatorGroup',
        },
      ]}
      flatten={(resources) => _.get(resources.installPlan, 'data', [])}
      title="Install Plans"
      showTitle={false}
      ListComponent={InstallPlansList}
    />
  );
};

export const InstallPlanDetails: React.SFC<InstallPlanDetailsProps> = ({ obj }) => {
  const needsApproval =
    obj.spec.approval === InstallPlanApproval.Manual && obj.spec.approved === false;

  return (
    <>
      {needsApproval && (
        <div className="co-m-pane__body">
          <HintBlock title="Review Manual Install Plan">
            <p>
              Inspect the requirements for the components specified in this install plan before
              approving.
            </p>
            <Link
              to={`/k8s/ns/${obj.metadata.namespace}/${referenceForModel(InstallPlanModel)}/${
                obj.metadata.name
              }/components`}
            >
              <Button variant="primary">Preview Install Plan</Button>
            </Link>
          </HintBlock>
        </div>
      )}
      <div className="co-m-pane__body">
        <SectionHeading text="Install Plan Details" />
        <div className="co-m-pane__body-group">
          <div className="row">
            <div className="col-sm-6">
              <ResourceSummary resource={obj} showAnnotations={false} />
            </div>
            <div className="col-sm-6">
              <dl className="co-m-pane__details">
                <dt>Status</dt>
                <dd>
                  <Status status={_.get(obj.status, 'phase', 'Unknown')} />
                </dd>
                <dt>Components</dt>
                {(obj.spec.clusterServiceVersionNames || []).map((csvName) => (
                  <dd key={csvName}>
                    {obj.status.phase === 'Complete' ? (
                      <ResourceLink
                        kind={referenceForModel(ClusterServiceVersionModel)}
                        name={csvName}
                        namespace={obj.metadata.namespace}
                        title={csvName}
                      />
                    ) : (
                      <>
                        <ResourceIcon kind={referenceForModel(ClusterServiceVersionModel)} />
                        {csvName}
                      </>
                    )}
                  </dd>
                ))}
                <dt>Catalog Sources</dt>
                {getCatalogSources(obj).map(({ sourceName, sourceNamespace }) => (
                  <dd key={`${sourceNamespace}-${sourceName}`}>
                    <ResourceLink
                      kind={referenceForModel(CatalogSourceModel)}
                      name={sourceName}
                      namespace={sourceNamespace}
                      title={sourceName}
                    />
                  </dd>
                ))}
              </dl>
            </div>
          </div>
        </div>
      </div>
      <div className="co-m-pane__body">
        <SectionHeading text="Conditions" />
        <Conditions conditions={obj.status?.conditions} />
      </div>
    </>
  );
};

export class InstallPlanPreview extends React.Component<
  InstallPlanPreviewProps,
  InstallPlanPreviewState
> {
  constructor(props) {
    super(props);
    this.state = {
      needsApproval:
        this.props.obj.spec.approval === InstallPlanApproval.Manual &&
        this.props.obj.spec.approved === false,
    };
  }

  render() {
    const { obj } = this.props;
    const subscription = obj.metadata.ownerReferences.find(
      (ref) => referenceForOwnerRef(ref) === referenceForModel(SubscriptionModel),
    );

    const plan = _.get(obj.status, 'plan') || [];
    const stepsByCSV = plan
      .reduce(
        (acc, step) => acc.update(step.resolving, [], (steps) => steps.concat([step])),
        ImmutableMap<string, Step[]>(),
      )
      .toArray();

    const approve = () =>
      k8sUpdate(InstallPlanModel, { ...obj, spec: { ...obj.spec, approved: true } })
        .then(() => this.setState({ needsApproval: false }))
        .catch((error) => this.setState({ error }));

    const stepStatus = (status: Step['status']) => (
      <>
        {status === 'Present' && <GreenCheckCircleIcon className="co-icon-space-r" />}
        {status === 'Created' && <GreenCheckCircleIcon className="co-icon-space-r" />}
        {status}
      </>
    );

    return plan.length > 0 ? (
      <>
        {this.state.error && (
          <div className="co-clusterserviceversion-detail__error-box">{this.state.error}</div>
        )}
        {this.state.needsApproval && (
          <div className="co-m-pane__body">
            <HintBlock title="Review Manual Install Plan">
              <p>
                Once approved, the following resources will be created in order to satisfy the
                requirements for the components specified in the plan. Click the resource name to
                view the resource in detail.
              </p>
              <div className="pf-c-form">
                <div className="pf-c-form__actions">
                  <Button
                    variant="primary"
                    isDisabled={!this.state.needsApproval}
                    onClick={() => approve()}
                  >
                    {this.state.needsApproval ? 'Approve' : 'Approved'}
                  </Button>
                  <Button
                    variant="secondary"
                    isDisabled={false}
                    onClick={() =>
                      history.push(
                        `/k8s/ns/${obj.metadata.namespace}/${referenceForModel(
                          SubscriptionModel,
                        )}/${subscription.name}?showDelete=true`,
                      )
                    }
                  >
                    Deny
                  </Button>
                </div>
              </div>
            </HintBlock>
          </div>
        )}
        {stepsByCSV.map((steps) => (
          <div key={steps[0].resolving} className="co-m-pane__body">
            <SectionHeading text={steps[0].resolving} />
            <div className="co-table-container">
              <table className="pf-c-table pf-m-compact pf-m-border-rows">
                <thead>
                  <tr>
                    <th className={componentsTableColumnClasses[0]}>Name</th>
                    <th className={componentsTableColumnClasses[1]}>Kind</th>
                    <th className={componentsTableColumnClasses[2]}>Status</th>
                    <th className={componentsTableColumnClasses[3]}>API Version</th>
                  </tr>
                </thead>
                <tbody>
                  {steps.map((step) => (
                    <tr key={`${referenceForStepResource(step.resource)}-${step.resource.name}`}>
                      <td className={componentsTableColumnClasses[0]}>
                        {['Present', 'Created'].includes(step.status) ? (
                          <ResourceLink
                            kind={referenceForStepResource(step.resource)}
                            namespace={obj.metadata.namespace}
                            name={step.resource.name}
                            title={step.resource.name}
                          />
                        ) : (
                          <>
                            <ResourceIcon kind={referenceForStepResource(step.resource)} />
                            <Button
                              type="button"
                              onClick={() =>
                                installPlanPreviewModal({ stepResource: step.resource })
                              }
                              variant="link"
                            >
                              {step.resource.name}
                            </Button>
                          </>
                        )}
                      </td>
                      <td className={componentsTableColumnClasses[1]}>{step.resource.kind}</td>
                      <td className={componentsTableColumnClasses[2]}>{stepStatus(step.status)}</td>
                      <td className={componentsTableColumnClasses[3]}>
                        {apiVersionForReference(referenceForStepResource(step.resource))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </>
    ) : (
      <div className="co-m-pane__body">
        <MsgBox
          title="No Components Resolved"
          detail="This install plan has not been fully resolved yet."
        />
      </div>
    );
  }
}

export const InstallPlanDetailsPage: React.SFC<InstallPlanDetailsPageProps> = (props) => (
  <DetailsPage
    {...props}
    namespace={props.match.params.ns}
    kind={referenceForModel(InstallPlanModel)}
    name={props.match.params.name}
    pages={[
      navFactory.details(InstallPlanDetails),
      navFactory.editYaml(),
      { href: 'components', name: 'Components', component: InstallPlanPreview },
    ]}
    menuActions={[...Kebab.factory.common]}
  />
);

export type InstallPlansListProps = {};

export type InstallPlansPageProps = {
  namespace?: string;
  match?: match<{ ns?: string }>;
};

export type InstallPlanDetailsProps = {
  obj: InstallPlanKind;
};

export type InstallPlanDetailsPageProps = {
  match: match<{ ns: string; name: string }>;
};

export type InstallPlanPreviewProps = {
  obj: InstallPlanKind;
};

export type InstallPlanPreviewState = {
  needsApproval: boolean;
  error?: string;
};

InstallPlansList.displayName = 'InstallPlansList';
InstallPlansPage.displayName = 'InstallPlansPage';
