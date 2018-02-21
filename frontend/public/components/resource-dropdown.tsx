import * as _ from 'lodash';
import * as React from 'react';
import { connect } from 'react-redux';
import * as PropTypes from 'prop-types';

import { Dropdown, ResourceIcon } from './utils';
// eslint-disable-next-line no-unused-vars
import { allModels, K8sKind } from '../module/k8s';
import { kindReducerName } from '../kinds';
import * as classNames from 'classnames';
import { ClusterServiceVersionModel, EtcdClusterModel, PrometheusModel, ServiceMonitorModel, AlertmanagerModel } from '../models';

const resources = [
  'Clusters', 'ConfigMaps', 'DaemonSets', 'Deployments', 'Jobs', 'CronJobs',
  'Namespaces', 'NetworkPolicies', 'Nodes', 'Pods', 'ReplicaSets', 'ReplicationControllers',
  'Secrets', 'ServiceAccounts', 'ServiceAccounts', 'Services', 'Ingresses', 'Roles', 'RoleBindings',
  'EtcdClusters', 'Prometheuses', 'ServiceMonitors', 'Alertmanagers', 'PodVulns', 'StatefulSets',
  'ResourceQuotas', 'PersistentVolumes', 'PersistentVolumeClaims', 'Reports',
  'ReportGenerationQuerys', 'Default', 'StorageClasses', 'CustomResourceDefinitions', 'ClusterServiceVersion-v1s'];

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
  const {selected, onChange, allkinds, showAll, className} = props;
  const items: {[s: string]: JSX.Element } = {};
  const kinds = {};
  _.each(allModels().toJS(), (ko: K8sKind) => kinds[ko.labelPlural.replace(/ /g, '')] = ko.kind);

  if (showAll) {
    items.all = <span>
      <span className="co-type-selector__icon-wrapper">
        <ResourceIcon kind="All" />
      </span>All Types</span>;
    //<DropdownItem kind={'All Categories'} />;
  }

  resources.filter(k => k !== ClusterServiceVersionModel.labelPlural)
    .sort()
    .forEach(k => {
      const kind: string = kinds[k];
      if (!kind) {
        return;
      }
      if (allkinds[kind] && allkinds[kind].crd && ![EtcdClusterModel, PrometheusModel, ServiceMonitorModel, AlertmanagerModel].some(m => m.kind === k)) {
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

export const ResourceListDropdown = connect(state => ({ allkinds: state[kindReducerName].get('kinds').toJSON()}))(ResourceListDropdown_);

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
  className?: string,
  id?: string,
  showAll?: boolean
};
/* eslint-enable no-undef */
