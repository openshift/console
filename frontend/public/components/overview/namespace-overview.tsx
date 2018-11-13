import * as React from 'react';

import { requirePrometheus } from '../graphs';
import { Health } from '../graphs/health';
import { deleteModal, NamespaceLineCharts, NamespaceSummary, TopPodsBarChart } from '../namespace';
import { resourceListPathFromModel } from '../utils';
import { RoleBindingModel } from '../../models';

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

export const OverviewNamespaceDashboard = ({obj: ns}) => <React.Fragment>
  <OverviewHealth ns={ns} />
  <OverviewResourceUsage ns={ns} />
  <OverviewNamespaceSummary ns={ns} />
</React.Fragment>;

