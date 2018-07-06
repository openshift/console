import * as _ from 'lodash-es';
import * as React from 'react';
import { connect } from 'react-redux';
import * as PropTypes from 'prop-types';

import { Dropdown, ResourceIcon } from './utils';
// eslint-disable-next-line no-unused-vars
import { allModels, K8sKind } from '../module/k8s';
import { FLAGS, featureReducerName, flagPending } from '../features';
import * as classNames from 'classnames';
import { ClusterServiceVersionModel, EtcdClusterModel, PrometheusModel, ServiceMonitorModel, AlertmanagerModel } from '../models';

/*  ------------------------------- NOTE -------------------------------

To avoid circular imports, the keys in this list are manually duplicated in ./resource-pages.tsx !

------------------------------------------------------------------------
*/
const resources = [
  'Alertmanagers',
  'ClusterServiceVersion-v1s',
  'Clusters',
  'ConfigMaps',
  'CronJobs',
  'CustomResourceDefinitions',
  'DaemonSets',
  'Default',
  'Deployments',
  'EtcdClusters',
  'HorizontalPodAutoscalers',
  'Ingresses',
  'Jobs',
  'Namespaces',
  'NetworkPolicies',
  'Nodes',
  'PersistentVolumeClaims',
  'PersistentVolumes',
  'PodVulns',
  'Pods',
  'Prometheuses',
  'ReplicaSets',
  'ReplicationControllers',
  'ReportGenerationQuerys',
  'Reports',
  'ResourceQuotas',
  'RoleBindings',
  'Roles',
  'Secrets',
  'ServiceAccounts',
  'ServiceMonitors',
  'Services',
  'StatefulSets',
  'StorageClasses',
];

const openshiftResources = [
  'BuildConfigs',
  'Builds',
  'DeploymentConfigs',
  'ImageStreamTags',
  'ImageStreams',
  'Projects',
  'Routes',
];

const DropdownItem = ({kind}) => {
  const [modelRef, kindObj] = allModels().findEntry((v) => v.kind === kind);
  return <span>
    <span className="co-type-selector__icon-wrapper">
      <ResourceIcon kind={modelRef} />
    </span>
    {kindObj.labelPlural}
  </span>;
};

const ResourceListDropdown_: React.StatelessComponent<ResourceListDropdownProps> = props => {
  const { selected, onChange, allkinds, openshiftFlag, showAll, className } = props;
  if (flagPending(openshiftFlag)) {
    return null;
  }

  const items: {[s: string]: JSX.Element} = {};
  const kinds = {};
  _.each(allModels().toJS(), (ko: K8sKind) => kinds[ko.labelPlural.replace(/ /g, '')] = ko.kind);

  if (showAll) {
    items.all = <span>
      <span className="co-type-selector__icon-wrapper">
        <ResourceIcon kind="All" />
      </span>All Types</span>;
  }

  const allResources = openshiftFlag ? _.concat(resources, openshiftResources) : resources;
  allResources.filter(k => k !== ClusterServiceVersionModel.labelPlural)
    .sort()
    .forEach(k => {
      const kind: string = kinds[k];
      if (!kind) {
        return;
      }
      const model = allkinds[kind];
      if (model && model.crd && ![EtcdClusterModel, PrometheusModel, ServiceMonitorModel, AlertmanagerModel].some(m => m.kind === k)) {
        return;
      }
      items[kind] = <DropdownItem kind={kind} />;
    });

  // If user somehow gets to the search page with Kind=(a CRD kind), show something in the dropdown
  if (selected && !items[selected]) {
    items[selected] = <DropdownItem kind={selected} />;
  }
  return <Dropdown className={classNames('co-type-selector', {[className]: className})} items={items} title={items[selected]} onChange={onChange} selectedKey={selected} />;
};

const resourceListDropdownStateToProps = (state): any => {
  const allkinds = state.k8s.getIn(['RESOURCES', 'models']).toJSON();
  const openshiftFlag = state[featureReducerName].get(FLAGS.OPENSHIFT);

  return { allkinds, openshiftFlag };
};

export const ResourceListDropdown = connect(resourceListDropdownStateToProps)(ResourceListDropdown_);

ResourceListDropdown.propTypes = {
  onChange: PropTypes.func.isRequired,
  selected: PropTypes.string,
  showAll: PropTypes.bool,
  className: PropTypes.string,
  id: PropTypes.string,
};

/* eslint-disable no-undef */
export type ResourceListDropdownProps = {
  selected: string,
  onChange: Function,
  allkinds: {[s: string]: K8sKind},
  openshiftFlag?: boolean,
  className?: string,
  id?: string,
  showAll?: boolean,
};
/* eslint-enable no-undef */
