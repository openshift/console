/* eslint-disable no-undef, no-unused-vars */

import * as React from 'react';
import * as _ from 'lodash-es';
import { connect } from 'react-redux';
import * as PropTypes from 'prop-types';
import { Map as ImmutableMap, OrderedMap, Set as ImmutableSet } from 'immutable';
import * as classNames from 'classnames';
import * as fuzzy from 'fuzzysearch';

import { Dropdown, ResourceIcon } from './utils';
import { K8sKind, K8sResourceKindReference, referenceForModel, apiVersionForReference, kindForReference } from '../module/k8s';

// Blacklist known duplicate resources.
const blacklistGroups = ImmutableSet([
  // Prefer rbac.authorization.k8s.io/v1, which has the same resources.
  'authorization.openshift.io',
]);

const blacklistResources = ImmutableSet([
  // Unfortunately a few resources we want to show like Ingress exist only in extensions/v1beta1,
  // so we can't blacklist the entire group. The API group is eventually going away.
  // https://github.com/kubernetes/kubernetes/issues/43214

  // Prefer apps/v1
  'extensions/v1beta1.DaemonSet',
  'extensions/v1beta1.Deployment',
  'extensions/v1beta1.NetworkPolicy',
  'extensions/v1beta1.ReplicaSet',

  // Prefer policy/v1beta1
  'extensions/v1beta1.PodSecurityPolicy',

  // Prefer core/v1
  'events.k8s.io/v1beta1.Event',
  'security.openshift.io/v1.SecurityContextConstraints',

  // Hide dummy resource
  'extensions/v1beta1.ReplicationControllerDummy',
]);

const DropdownItem: React.SFC<DropdownItemProps> = ({model, showGroup}) => <React.Fragment>
  <span className="co-resource-link">
    <span className="co-resource-icon--fixed-width">
      <ResourceIcon kind={model.kind} />
    </span>
    <span className="co-resource-link__resource-name">
      {model.kind}
      {showGroup && <React.Fragment>&nbsp;<small className="text-muted">&ndash; {model.apiGroup || 'core'}/{model.apiVersion}</small></React.Fragment>}
    </span>
  </span>
</React.Fragment>;

const ResourceListDropdown_: React.SFC<ResourceListDropdownProps> = props => {
  const { selected, onChange, allModels, showAll, className, preferredVersions } = props;

  const resources = allModels
    .filter(({apiGroup, apiVersion, kind, verbs}) => {
      // Remove blacklisted items.
      if (blacklistGroups.has(apiGroup) || blacklistResources.has(`${apiGroup}/${apiVersion}.${kind}`)) {
        return false;
      }

      // Only show resources that can be listed.
      if (!_.isEmpty(verbs) && !_.includes(verbs, 'list')) {
        return false;
      }

      // Only show preferred version for resources in the same API group.
      const preferred = (m: K8sKind) => preferredVersions.some(v => v.groupVersion === apiVersionForReference(referenceForModel(m)));
      const sameGroupKind = (m: K8sKind) => m.kind === kind && m.apiGroup === apiGroup && m.apiVersion !== apiVersion;

      return !allModels.find(m => sameGroupKind(m) && preferred(m));
    })
    .toOrderedMap()
    .sortBy(({kind, apiGroup}) => `${kind} ${apiGroup}`);

  // Track duplicate names so we know when to show the group.
  const kinds = resources.groupBy(m => m.kind);
  const isDup = kind => kinds.get(kind).size > 1;

  // Create dropdown items for each resource.
  const items = resources.map((model) => <DropdownItem key={referenceForModel(model)} model={model} showGroup={isDup(model.kind)} />) as OrderedMap<string, JSX.Element>;

  // Add an "All" item to the top if `showAll`.
  const allItems = (showAll
    ? OrderedMap({all: <React.Fragment>
      <span className="co-resource-link">
        <span className="co-resource-icon--fixed-width">
          <ResourceIcon kind="All" />
        </span>
        <span className="co-resource-link__resource-name">All Types</span>
      </span>
      {/* <ResourceIcon kind="All" /> */}
    </React.Fragment>}).concat(items)
    : items
    )
    .toJS() as {[s: string]: JSX.Element};

  const selectedKey = allItems[selected] ? selected : kindForReference(selected);
  const autocompleteFilter = (text, item) => {
    const { model } = item.props;
    if (!model) {
      return false;
    }

    return fuzzy(_.toLower(text), _.toLower(model.kind));
  };

  return <Dropdown
    menuClassName="dropdown-menu--text-wrap"
    className={classNames('co-type-selector', className)}
    items={allItems}
    title={allItems[selectedKey]}
    onChange={onChange}
    autocompleteFilter={autocompleteFilter}
    autocompletePlaceholder="Select Resource"
    selectedKey={selectedKey} />;
};

const resourceListDropdownStateToProps = ({k8s}) => ({
  allModels: k8s.getIn(['RESOURCES', 'models']),
  preferredVersions: k8s.getIn(['RESOURCES', 'preferredVersions']),
});

export const ResourceListDropdown = connect(resourceListDropdownStateToProps)(ResourceListDropdown_);

ResourceListDropdown.propTypes = {
  onChange: PropTypes.func.isRequired,
  selected: PropTypes.string,
  showAll: PropTypes.bool,
  className: PropTypes.string,
  id: PropTypes.string,
};

export type ResourceListDropdownProps = {
  // FIXME: `selected` should be GroupVersionKind
  selected: K8sResourceKindReference;
  onChange: Function;
  allModels: ImmutableMap<K8sResourceKindReference, K8sKind>;
  preferredVersions: {groupVersion: string, version: string}[];
  className?: string;
  id?: string;
  showAll?: boolean;
};

type DropdownItemProps = {
  model: K8sKind;
  showGroup?: boolean;
};
