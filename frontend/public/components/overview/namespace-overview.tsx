/* eslint-disable no-undef, no-unused-vars */

import * as React from 'react';
import * as _ from 'lodash-es';

import { requirePrometheus } from '../graphs';
import { Health } from '../graphs/health';
import { deleteModal, NamespaceLineCharts, NamespaceSummary, TopPodsBarChart } from '../namespace';
import { Firehose, LoadingInline, ResourceLink, resourceListPathFromModel, StatusBox } from '../utils';
import { RoleBindingModel } from '../../models';
import { K8sResourceKind } from '../../module/k8s';
import { getQuotaResourceTypes, hasComputeResources, QuotaGaugeCharts, QuotaScopes } from '../resource-quota';

const editRoleBindings = (kind, obj) => ({
  label: 'Edit Role Bindings',
  href: resourceListPathFromModel(RoleBindingModel, obj.metadata.name),
});

export const overviewMenuActions = [editRoleBindings, deleteModal];

const OverviewHealth = requirePrometheus(({ns}) => <div className="group">
  <div className="group__title">
    <h2 className="h3">Health</h2>
  </div>
  <div className="container-fluid group__body">
    <Health namespace={ns.metadata.name} />
  </div>
</div>);

const OverviewResourceUsage = requirePrometheus(({ns}) => <div className="group">
  <div className="group__title">
    <h2 className="h3">Resource Usage</h2>
  </div>
  <div className="container-fluid group__body group__graphs">
    <NamespaceLineCharts ns={ns} />
    <TopPodsBarChart ns={ns} />
  </div>
</div>);

const OverviewNamespaceSummary = ({ns}) => <div className="group">
  <div className="group__title">
    <h2 className="h3">Details</h2>
  </div>
  <div className="container-fluid group__body group__namespace-details">
    <NamespaceSummary ns={ns} />
  </div>
</div>;

const QuotaBox = ({quota, resourceTypes}) => {
  const scopes = _.get(quota, 'spec.scopes');
  return <div className="col-xs-6 quota-dashboard-column">
    <div className="group group__body full-width-and-height" key={quota.metadata.name}>
      <div className="group__title group__title--no-side-borders">
        <h2 className="h3 full-width-and-height">
          <ResourceLink kind="ResourceQuota" name={quota.metadata.name} className="co-resource-link-truncate"
            namespace={quota.metadata.namespace} title={quota.metadata.name} />
        </h2>
      </div>
      <div className="container-fluid group__graphs">
        <QuotaGaugeCharts quota={quota} resourceTypes={resourceTypes} compact />
        {scopes && <dl className="co-m-pane__details quota-dashboard-scopes">
          <QuotaScopes scopes={scopes} compact />
        </dl>}
      </div>
    </div>
  </div>;
};

const QuotaBoxes: React.SFC<QuotaBoxesProps> = ({resourceQuotas}) => {
  const { loaded, loadError, data: quotas } = resourceQuotas;

  if (!loaded) {
    return <LoadingInline />;
  }
  if (loadError) {
    <StatusBox loadError={loadError} />;
  }
  const quotaBoxes = _.reduce(quotas, (accumulator, quota: K8sResourceKind) => {
    const resourceTypes = getQuotaResourceTypes(quota);
    if (hasComputeResources(resourceTypes)) {
      accumulator.push(<QuotaBox key={quota.metadata.uid} quota={quota} resourceTypes={resourceTypes} />);
    }
    return accumulator;
  }, []);
  const rows = _.chunk(quotaBoxes, 2);
  return <React.Fragment>
    {_.map(rows, (row, index) => <div key={index} className="row quota-dashboard-row">{row}</div>)}
  </React.Fragment>;
};

const NamespaceQuotas = ({ns}) => {
  const quotaResources = [
    {
      kind: 'ResourceQuota',
      namespace: ns.metadata.name,
      isList: true,
      prop: 'resourceQuotas',
    },
  ];
  return <Firehose forceUpdate resources={quotaResources}>
    <QuotaBoxes />
  </Firehose>;
};

export const OverviewNamespaceDashboard = ({obj: ns}) => <React.Fragment>
  <OverviewHealth ns={ns} />
  <NamespaceQuotas ns={ns} />
  <OverviewResourceUsage ns={ns} />
  <OverviewNamespaceSummary ns={ns} />
</React.Fragment>;

export type QuotaBoxesProps = {
  resourceQuotas?: {loaded: boolean, loadError: string, data: K8sResourceKind};
};
