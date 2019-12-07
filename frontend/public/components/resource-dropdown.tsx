import * as React from 'react';
import * as _ from 'lodash-es';
import { connect } from 'react-redux';
import { Map as ImmutableMap, Set as ImmutableSet } from 'immutable';
import { Select, SelectOption, SelectVariant } from '@patternfly/react-core';
import { ResourceIcon } from './utils';
import {
  K8sKind,
  K8sResourceKindReference,
  referenceForModel,
  apiVersionForReference,
} from '../module/k8s';

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

const ResourceListDropdown_: React.SFC<ResourceListDropdownProps> = (props) => {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const { clearSelection, selected, onChange, allModels, showAll, preferredVersions } = props;

  const onToggle = (expand: boolean) => {
    setIsExpanded(expand);
  };

  const onClearSelection = () => {
    setIsExpanded(false);
    clearSelection();
  };

  const resources = allModels
    .filter(({ apiGroup, apiVersion, kind, verbs }) => {
      // Remove blacklisted items.
      if (
        blacklistGroups.has(apiGroup) ||
        blacklistResources.has(`${apiGroup}/${apiVersion}.${kind}`)
      ) {
        return false;
      }

      // Only show resources that can be listed.
      if (!_.isEmpty(verbs) && !_.includes(verbs, 'list')) {
        return false;
      }

      // Only show preferred version for resources in the same API group.
      const preferred = (m: K8sKind) =>
        preferredVersions.some(
          (v) => v.groupVersion === apiVersionForReference(referenceForModel(m)),
        );
      const sameGroupKind = (m: K8sKind) =>
        m.kind === kind && m.apiGroup === apiGroup && m.apiVersion !== apiVersion;

      return !allModels.find((m) => sameGroupKind(m) && preferred(m));
    })
    .toOrderedMap()
    .sortBy(({ kind, apiGroup }) => `${kind} ${apiGroup}`);

  // Track duplicate names so we know when to show the group.
  const kinds = resources.groupBy((m) => m.kind);
  const isDup = (kind) => kinds.get(kind).size > 1;

  const selectItem = (model: K8sKind, showGroup: boolean) => {
    return (
      <SelectOption
        key={referenceForModel(model)}
        isDisabled={false}
        value={referenceForModel(model)}
      >
        <span className={'co-resource-item'}>
          <span className="co-resource-icon--fixed-width">
            <ResourceIcon kind={referenceForModel(model)} />
          </span>
          <span className="co-resource-item__resource-name">
            {model.kind}
            {showGroup && (
              <>
                &nbsp;
                <div className="co-resource-item__resource-api text-muted co-truncate show co-nowrap small">
                  {model.apiGroup || 'core'}/{model.apiVersion}
                </div>
              </>
            )}
          </span>
        </span>
      </SelectOption>
    );
  };

  const getItems = () => {
    const options = [];
    if (showAll) {
      options.push(
        <SelectOption key={'All'} isDisabled={false} value={'All'}>
          <span className="co-resource-item">
            <span className="co-resource-icon--fixed-width">
              <ResourceIcon kind="All" />
            </span>
            <span className="co-resource-item__resource-name">All Resources</span>
          </span>
        </SelectOption>,
      );
    }
    resources.map((model) => {
      options.push(selectItem(model, isDup(model.kind)));
    });
    return options;
  };

  const titleId = 'multi-typeahead-select-id';
  return (
    <div>
      <span id={titleId} hidden>
        Select Resource
      </span>
      <Select
        variant={SelectVariant.typeaheadMulti}
        aria-label="Select Resource"
        onToggle={onToggle}
        onSelect={onChange}
        onClear={onClearSelection}
        selections={selected}
        isExpanded={isExpanded}
        ariaLabelledBy={titleId}
        placeholderText="Select Resource"
        isCreatable={false}
        maxHeight={400}
      >
        {getItems()}
        {/* {allItems} */}
      </Select>
    </div>
  );
};

const resourceListDropdownStateToProps = ({ k8s }) => ({
  allModels: k8s.getIn(['RESOURCES', 'models']),
  preferredVersions: k8s.getIn(['RESOURCES', 'preferredVersions']),
});

export const ResourceListDropdown = connect(resourceListDropdownStateToProps)(
  ResourceListDropdown_,
);

export type ResourceListDropdownProps = {
  selected: K8sResourceKindReference[];
  onChange: any;
  allModels?: ImmutableMap<K8sResourceKindReference, K8sKind>;
  preferredVersions?: { groupVersion: string; version: string }[];
  id?: string;
  showAll?: boolean;
  clearSelection: any;
};
