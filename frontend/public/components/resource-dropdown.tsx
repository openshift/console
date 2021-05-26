import * as React from 'react';
import * as _ from 'lodash-es';
import { connect } from 'react-redux';
import { Map as ImmutableMap, Set as ImmutableSet } from 'immutable';
import * as classNames from 'classnames';
import { useTranslation } from 'react-i18next';

import { ResourceIcon } from './utils';
import {
  K8sKind,
  K8sResourceKindReference,
  modelFor,
  referenceForModel,
  DiscoveryResources,
} from '../module/k8s';
import { Select, SelectOption, SelectVariant } from '@patternfly/react-core';

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
  const { selected, onChange, allModels, groupToVersionMap, className } = props;
  const { t } = useTranslation();

  const [isOpen, setOpen] = React.useState(false);
  const [selectedOptions, setSelectedOptions] = React.useState(selected);
  const [filterText, setFilterText] = React.useState<string>(null);

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

  React.useEffect(() => {
    setSelectedOptions(selected);
  }, [selected]);

  const items = resources
    .map((model: K8sKind) => (
      <SelectOption
        key={referenceForModel(model)}
        value={referenceForModel(model)}
        data-filter-text={`${model.abbr}${model.labelKey ? t(model.labelKey) : model.kind}`}
      >
        <span className="co-resource-item">
          <span className="co-resource-icon--fixed-width">
            <ResourceIcon kind={referenceForModel(model)} />
          </span>
          <span className="co-resource-item__resource-name">
            <span>
              {model.labelKey ? t(model.labelKey) : model.kind}
              {model.badge && model.badge === 'Tech Preview' && (
                <span className="co-resource-item__tech-dev-preview">
                  {t('public~Tech Preview')}
                </span>
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
    ))
    .toArray();

  const onCustomFilter = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event) {
      setFilterText(event.target.value.toLowerCase());
    }
    if (filterText === null || filterText === '') {
      return items;
    }
    return items.filter((item) => {
      return item.props['data-filter-text'].toLowerCase().includes(filterText);
    });
  };

  const handleSelected = (event: React.MouseEvent | React.ChangeEvent, value: string) => {
    onChange(referenceForModel(modelFor(value)));
  };

  const onToggle = (newOpenState: boolean) => {
    setFilterText(null);
    setOpen(newOpenState);
  };

  return (
    <Select
      variant={SelectVariant.checkbox}
      onToggle={onToggle}
      onSelect={handleSelected}
      selections={selectedOptions}
      isOpen={isOpen}
      placeholderText={t('public~Resources')}
      inlineFilterPlaceholderText={t('public~Select Resource')}
      onFilter={onCustomFilter}
      hasInlineFilter
      customBadgeText={selected.length}
      className={classNames('co-type-selector', className)}
      maxHeight="60vh"
    >
      {items}
    </Select>
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

type ResourceListDropdownStateToProps = {
  allModels: ImmutableMap<K8sResourceKindReference, K8sKind>;
  groupToVersionMap: DiscoveryResources['groupVersionMap'];
};
