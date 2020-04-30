import * as React from 'react';
import * as _ from 'lodash-es';
import { connect } from 'react-redux';
import { Map as ImmutableMap, Set as ImmutableSet } from 'immutable';
import * as classNames from 'classnames';
import * as fuzzy from 'fuzzysearch';

import { ResourceIcon } from './utils';
import {
  apiVersionForReference,
  K8sKind,
  K8sResourceKindReference,
  referenceForModel,
} from '../module/k8s';
import { Select, SelectVariant, SelectOption } from '@patternfly/react-core';

// Blacklist known duplicate resources.
const blacklistGroups = ImmutableSet([
  // Prefer rbac.authorization.k8s.io/v1, which has the same resources.
  'authorization.openshift.io',
]);

const blacklistResources = ImmutableSet([
  // Prefer core/v1
  'events.k8s.io/v1beta1.Event',
]);

const ResourceListDropdown_: React.SFC<ResourceListDropdownProps> = (props) => {
  const { selected, onChange, allModels, showAll, className, preferredVersions } = props;
  const [isExpanded, setExpanded] = React.useState(false);

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

  const isKindSelected = (kind: string) => {
    return _.includes(selected, kind);
  };

  // Create select option for each resource.
  const items = resources.toArray().map((model) => (
    <SelectOption
      key={referenceForModel(model)}
      value={model}
      isChecked={isKindSelected(referenceForModel(model))}
    >
      <span className={'co-resource-item'}>
        <span className="co-resource-icon--fixed-width">
          <ResourceIcon kind={referenceForModel(model)} />
        </span>
        <span className="co-resource-item__resource-name">
          <span>
            {model.kind}
            {model.badge && (
              <span className="co-resource-item__tech-dev-preview">{model.badge}</span>
            )}
          </span>
          {isDup(model.kind) && (
            <span className="co-resource-item__resource-api text-muted co-truncate show co-nowrap small">
              {model.apiGroup || 'core'}/{model.apiVersion}
            </span>
          )}
        </span>
      </span>
    </SelectOption>
  ));

  // Add an "All" item to the top if `showAll`.
  const allItems = showAll
    ? [
        <SelectOption key="All" value="All" isChecked={isKindSelected('All')}>
          <span className={'co-resource-item'}>
            <span className="co-resource-icon--fixed-width">
              <ResourceIcon kind="All" />
            </span>
            <span className="co-resource-item__resource-name">All Resources</span>
          </span>
        </SelectOption>,
      ].concat(items)
    : items;

  const onFilter = (event) => {
    const textInput = event.target.value;
    if (textInput === '') {
      return allItems;
    }
    return allItems.filter((item) => fuzzy(_.toLower(textInput), _.toLower(item.props.value.kind)));
  };

  const onToggle = (isOpen) => {
    setExpanded(isOpen);
  };

  const handleSelected = (event, value: K8sKind) => {
    value === 'All' ? onChange(value) : onChange(referenceForModel(value));
  };

  return (
    <Select
      variant={SelectVariant.checkbox}
      placeholderText="Resources"
      selections={selected}
      isExpanded={isExpanded}
      ariaLabelledBy="Resources"
      isGrouped
      hasInlineFilter
      onToggle={onToggle}
      onFilter={onFilter}
      onSelect={handleSelected}
      className={classNames('co-type-selector', className)}
      noResultsFoundText=""
    >
      {allItems}
    </Select>
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
  onChange: (selection: string) => void;
  allModels: ImmutableMap<K8sResourceKindReference, K8sKind>;
  preferredVersions: { groupVersion: string; version: string }[];
  className?: string;
  id?: string;
  showAll?: boolean;
};
