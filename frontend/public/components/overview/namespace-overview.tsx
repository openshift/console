import * as React from 'react';
import * as _ from 'lodash-es';

import { requirePrometheus } from '../graphs';
import { Health } from '../graphs/health';
import { deleteModal, NamespaceLineCharts, NamespaceSummary, TopPodsBarChart } from '../namespace';
import { Firehose, LoadingInline, ResourceLink, resourceListPathFromModel, StatusBox } from '../utils';
import { RoleBindingModel } from '../../models';
import { K8sResourceKind } from '../../module/k8s';
import { getQuotaResourceTypes, hasComputeResources, QuotaGaugeCharts, QuotaScopesInline } from '../resource-quota';

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

const ResourceQuotaCharts = ({quota, resourceTypes}) => {
  const scopes = _.get(quota, 'spec.scopes');
  return <div className="group">
    <div className="group__title">
      <h2 className="h3">
        <ResourceLink kind="ResourceQuota" name={quota.metadata.name} className="co-resource-item--truncate"
          namespace={quota.metadata.namespace} inline="true" title={quota.metadata.name} />
        {scopes && <QuotaScopesInline className="co-resource-quota-dashboard-scopes" scopes={scopes} />}
      </h2>
    </div>
    <div className="group__body group__graphs">
      <QuotaGaugeCharts quota={quota} resourceTypes={resourceTypes} />
    </div>
  </div>;
};

const ResourceQuotas: React.SFC<QuotaBoxesProps> = ({resourceQuotas}) => {
  const { loaded, loadError, data: quotas } = resourceQuotas;

  if (!loaded) {
    return <LoadingInline />;
  }
  if (loadError) {
    <StatusBox loadError={loadError} />;
  }
  const resourceQuotaRows = _.reduce(quotas, (accumulator, quota: K8sResourceKind) => {
    const resourceTypes = getQuotaResourceTypes(quota);
    if (hasComputeResources(resourceTypes)) {
      accumulator.push(<ResourceQuotaCharts key={quota.metadata.uid} quota={quota} resourceTypes={resourceTypes} />);
    }
    return accumulator;
  }, []);

  return <React.Fragment>
    {_.map(resourceQuotaRows, (quotaRow, index) => <div key={index}>{quotaRow}</div>)}
  </React.Fragment>;
};

const OverviewResourceQuotas = ({ns}) => {
  const quotaResources = [
    {
      kind: 'ResourceQuota',
      namespace: ns.metadata.name,
      isList: true,
      prop: 'resourceQuotas',
    },
  ];
  return <Firehose forceUpdate resources={quotaResources}>
    <ResourceQuotas />
  </Firehose>;
};

export const OverviewNamespaceDashboard = ({obj: ns}) => <React.Fragment>
  <OverviewHealth ns={ns} />
  <OverviewResourceQuotas ns={ns} />
  <OverviewResourceUsage ns={ns} />
  <OverviewNamespaceSummary ns={ns} />
</React.Fragment>;

export type QuotaBoxesProps = {
  resourceQuotas?: {loaded: boolean, loadError: string, data: K8sResourceKind};
};
