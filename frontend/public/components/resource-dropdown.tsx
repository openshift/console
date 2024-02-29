import * as React from 'react';
import * as _ from 'lodash-es';
import { connect } from 'react-redux';
import { Map as ImmutableMap, Set as ImmutableSet } from 'immutable';
import * as classNames from 'classnames';
import { useTranslation } from 'react-i18next';
import { ResourceIcon } from './utils';
import { K8sKind, K8sResourceKindReference, modelFor, referenceForModel } from '../module/k8s';
import { DiscoveryResources } from '@console/dynamic-plugin-sdk/src/api/common-types';
import {
  Select as SelectDeprecated,
  SelectGroup as SelectGroupDeprecated,
  SelectOption as SelectOptionDeprecated,
  SelectVariant as SelectVariantDeprecated,
} from '@patternfly/react-core/deprecated';
import { useUserSettings } from '@console/shared/src';
import { Divider, Tooltip } from '@patternfly/react-core';
import CloseButton from '@console/shared/src/components/close-button';

const RECENT_SEARCH_ITEMS = 5;

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
  const { selected, onChange, recentList, allModels, groupToVersionMap, className } = props;
  const { t } = useTranslation();

  const [isOpen, setOpen] = React.useState(false);
  const [clearItems, setClearItems] = React.useState(false);

  const [recentSelected, setRecentSelected] = useUserSettings<string>(
    'console.search.recentlySearched',
    '[]',
    true,
  );

  const [selectedOptions, setSelectedOptions] = React.useState(selected);

  const filterGroupVersionKind = (resourceList: string[]): string[] => {
    return resourceList.filter((resource) => {
      const parts = resource.split('~');
      return parts.length === 3 && parts.every((part) => part.trim() !== '');
    });
  };

  const recentSelectedList = (data: string[] | string): string[] => {
    return (
      (data &&
        data !== '[]' &&
        data !== 'undefined' &&
        JSON.parse(_.isString(data) ? data : JSON.stringify(data))) ??
      []
    );
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
    !_.isEmpty(selected) &&
      setRecentSelected(
        JSON.stringify(
          _.union(
            !clearItems ? filterGroupVersionKind(selected.reverse()) : [],
            recentSelectedList(recentSelected),
          ),
        ),
      );
    // eslint-disable-next-line react-hooks/exhaustive-deps
    setClearItems(false);
  }, [selected, setRecentSelected]);

  const onClear = () => {
    setSelectedOptions([]);
    setClearItems(true);
    setRecentSelected(JSON.stringify([]));
  };

  const items = resources
    .map((model: K8sKind) => (
      <SelectOptionDeprecated
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
              <div className="co-resource-item__resource-api text-muted co-truncate co-nowrap small">
                {model.apiGroup || 'core'}/{model.apiVersion}
              </div>
            )}
          </span>
        </span>
      </SelectOptionDeprecated>
    ))
    .toArray();

  const recentSearches: JSX.Element[] =
    !_.isEmpty(recentSelectedList(recentSelected)) &&
    recentSelectedList(recentSelected)
      .splice(0, RECENT_SEARCH_ITEMS)
      .map((modelRef: K8sResourceKindReference) => {
        const model: K8sKind = resources.find((m) => referenceForModel(m) === modelRef);
        if (model) {
          return (
            <SelectOptionDeprecated
              key={modelRef}
              value={modelRef}
              data-filter-text={`${model.abbr}${model.labelKey ? t(model.labelKey) : model.kind}`}
            >
              <span className="co-resource-item">
                <span className="co-resource-icon--fixed-width">
                  <ResourceIcon kind={modelRef} />
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
                    <div className="co-resource-item__resource-api text-muted co-truncate co-nowrap small">
                      {model.apiGroup || 'core'}/{model.apiVersion}
                    </div>
                  )}
                </span>
              </span>
            </SelectOptionDeprecated>
          );
        }
        return null;
      })
      .filter((item) => item !== null);

  const renderedOptions = () => {
    const options: JSX.Element[] = [];
    if (!_.isEmpty(recentSelectedList(recentSelected)) && !!recentList) {
      options.push(
        <Tooltip position="right" content={t('public~Clear history')}>
          <CloseButton
            additionalClassName="co-select-group-close-button"
            dataTestID="close-icon"
            onClick={onClear}
          />
        </Tooltip>,
      );
      options.push(
        <SelectGroupDeprecated
          label={t('public~Recently used')}
          className="co-select-group-dismissible"
        >
          {recentSearches}
        </SelectGroupDeprecated>,
      );
      options.push(<Divider key={3} className="co-select-group-divider" />);
    }
    options.push(<SelectGroupDeprecated>{items}</SelectGroupDeprecated>);
    return options;
  };

  const onCustomFilter = (event: React.ChangeEvent<HTMLInputElement>) => {
    const filterText = event?.target.value.toLocaleLowerCase();
    if (filterText === null || filterText === '' || filterText === undefined) {
      if (!_.isEmpty(recentSelectedList(recentSelected)) && !!recentList) {
        return renderedOptions();
      }
      return items;
    }
    return items.filter((item) => {
      return item.props['data-filter-text'].toLowerCase().includes(filterText);
    });
  };

  const handleSelected = (event: React.MouseEvent | React.ChangeEvent, value: string) => {
    onChange(referenceForModel(modelFor(value)));
  };

  const onToggle = (_event, newOpenState: boolean) => {
    setOpen(newOpenState);
  };

  return (
    <SelectDeprecated
      variant={SelectVariantDeprecated.checkbox}
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
      isGrouped
    >
      {renderedOptions()}
    </SelectDeprecated>
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
  recentList?: boolean;
  className?: string;
  id?: string;
};

type ResourceListDropdownStateToProps = {
  allModels: ImmutableMap<K8sResourceKindReference, K8sKind>;
  groupToVersionMap: DiscoveryResources['groupVersionMap'];
};
