import * as React from 'react';
import * as _ from 'lodash-es';
import { connect } from 'react-redux';
import { Map as ImmutableMap, Set as ImmutableSet } from 'immutable';
import * as classNames from 'classnames';
import * as fuzzy from 'fuzzysearch';

import { Dropdown, ResourceIcon } from './utils';
import {
  K8sKind,
  K8sResourceKindReference,
  modelFor,
  referenceForModel,
  DiscoveryResources,
} from '../module/k8s';
import { Badge, Checkbox } from '@patternfly/react-core';

// Blacklist known duplicate resources.
const blacklistGroups = ImmutableSet([
  // Prefer rbac.authorization.k8s.io/v1, which has the same resources.
  'authorization.openshift.io',
]);

const blacklistResources = ImmutableSet([
  // Prefer core/v1
  'events.k8s.io/v1beta1.Event',
]);

const DropdownItem: React.SFC<DropdownItemProps> = ({ model, showGroup, checked }) => (
  <>
    <span className={'co-resource-item'}>
      <Checkbox
        tabIndex={-1}
        id={`${model.apiGroup}:${model.apiVersion}:${model.kind}`}
        isChecked={checked}
      />
      <span className="co-resource-icon--fixed-width">
        <ResourceIcon kind={referenceForModel(model)} />
      </span>
      <span className="co-resource-item__resource-name">
        <span>
          {model.kind}
          {model.badge && <span className="co-resource-item__tech-dev-preview">{model.badge}</span>}
        </span>
        {showGroup && (
          <span className="co-resource-item__resource-api text-muted co-truncate show co-nowrap small">
            {model.apiGroup || 'core'}/{model.apiVersion}
          </span>
        )}
      </span>
    </span>
  </>
);

const ResourceListDropdown_: React.SFC<ResourceListDropdownProps> = (props) => {
  const { selected, onChange, allModels, className, groupToVersionMap } = props;
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
        groupToVersionMap?.[m.apiGroup]?.preferredVersion === m.apiVersion;

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
  // Create dropdown items for each resource.
  const items = resources
    .map((model) => (
      <DropdownItem
        key={referenceForModel(model)}
        model={model}
        showGroup={isDup(model.kind)}
        checked={isKindSelected(referenceForModel(model))}
      />
    ))
    .toJS();

  const autocompleteFilter = (text, item) => {
    const { model } = item.props;
    if (!model) {
      return false;
    }

    return fuzzy(_.toLower(text), _.toLower(model.kind));
  };

  const handleSelected = (value: string) => {
    onChange(referenceForModel(modelFor(value)));
  };

  return (
    <Dropdown
      menuClassName="dropdown-menu--text-wrap"
      className={classNames('co-type-selector', className)}
      items={items}
      title={
        <div key="title-resource">
          Resources <Badge isRead>{selected.length}</Badge>
        </div>
      }
      onChange={handleSelected}
      autocompleteFilter={autocompleteFilter}
      autocompletePlaceholder="Select Resource"
    />
  );
};

const resourceListDropdownStateToProps = ({ k8s }) => ({
  allModels: k8s.getIn(['RESOURCES', 'models']),
  groupToVersionMap: k8s.getIn(['RESOURCES', 'groupToVersionMap']),
});

export const ResourceListDropdown = connect<ResourceListDropdownStateToProps>(
  resourceListDropdownStateToProps,
)(ResourceListDropdown_);

export type ResourceListDropdownProps = ResourceListDropdownStateToProps & {
  selected: K8sResourceKindReference[];
  onChange: (value: string) => void;
  className?: string;
  id?: string;
};

type DropdownItemProps = {
  model: K8sKind;
  showGroup?: boolean;
  checked?: boolean;
};

type ResourceListDropdownStateToProps = {
  allModels: ImmutableMap<K8sResourceKindReference, K8sKind>;
  groupToVersionMap: DiscoveryResources['groupVersionMap'];
};
