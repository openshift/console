import type { FC, FormEvent, KeyboardEvent, Ref } from 'react';
import { useState, useRef, useEffect, useMemo, Fragment } from 'react';
import * as _ from 'lodash';
import { connect } from 'react-redux';
import { Map as ImmutableMap, Set as ImmutableSet } from 'immutable';
import { css } from '@patternfly/react-styles';
import { CloseButton } from '@patternfly/react-component-groups';
import { useTranslation } from 'react-i18next';
import { ResourceIcon } from './utils/resource-icon';
import { K8sKind, K8sResourceKindReference, referenceForModel } from '../module/k8s';
import { DiscoveryResources } from '@console/dynamic-plugin-sdk/src/api/common-types';
import { useUserPreference } from '@console/shared/src/hooks/useUserPreference';
import {
  Button,
  Divider,
  MenuToggle,
  MenuToggleElement,
  Select,
  SelectGroup,
  SelectList,
  SelectOption,
  SelectOptionProps,
  TextInputGroup,
  TextInputGroupMain,
  TextInputGroupUtilities,
  Tooltip,
} from '@patternfly/react-core';
import { TimesIcon } from '@patternfly/react-icons';

const RECENT_SEARCH_ITEMS = 5;
const MAX_VISIBLE_ITEMS = 100;

// Blocklist known duplicate resources.
const blocklistGroups = ImmutableSet([
  // Prefer rbac.authorization.k8s.io/v1, which has the same resources.
  'authorization.openshift.io',
]);

const blocklistResources = ImmutableSet([
  // Prefer core/v1
  'events.k8s.io/v1beta1.Event',
]);

const isVisible = (m: K8sKind) =>
  !blocklistGroups.has(m.apiGroup) &&
  !blocklistResources.has(`${m.apiGroup}/${m.apiVersion}.${m.kind}`) &&
  (_.isEmpty(m.verbs) || _.includes(m.verbs, 'list'));

export const ResourceListDropdown_: FC<ResourceListDropdownProps> = (props) => {
  const { selected, onChange, recentList, allModels, groupToVersionMap, className } = props;
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [recentSelected, setRecentSelected] = useUserPreference<string>(
    'console.search.recentlySearched',
    '[]',
    true,
  );
  const [selectedOptions, setSelectedOptions] = useState(selected);
  const [inputValue, setInputValue] = useState<string>('');
  const [focusedItemIndex, setFocusedItemIndex] = useState<number | null>(null);
  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const placeholderTextDefault = t('public~Resources');
  const [placeholder, setPlaceholder] = useState(placeholderTextDefault);
  const textInputRef = useRef<HTMLInputElement>();

  const resources = useMemo(() => {
    // Pre-compute which group+kind combinations have a visible preferred version (O(n))
    const preferredGroupKinds = new Set<string>();
    allModels.forEach((m) => {
      if (groupToVersionMap?.[m.apiGroup]?.preferredVersion === m.apiVersion && isVisible(m)) {
        preferredGroupKinds.add(`${m.kind}~${m.apiGroup}`);
      }
    });

    return allModels
      .filter((m) => {
        if (!isVisible(m)) {
          return false;
        }

        // Only show preferred version for resources in the same API group.
        // If a preferred version exists for this group+kind and this isn't it, skip.
        const key = `${m.kind}~${m.apiGroup}`;
        if (
          preferredGroupKinds.has(key) &&
          groupToVersionMap?.[m.apiGroup]?.preferredVersion !== m.apiVersion
        ) {
          return false;
        }

        return true;
      })
      .toOrderedMap()
      .sortBy(({ kind, apiGroup }) => `${kind} ${apiGroup}`);
  }, [allModels, groupToVersionMap]);

  const initialSelectOptions = useMemo<ExtendedSelectOptionProps[]>(
    () =>
      resources.toArray().map((resource) => {
        const reference = referenceForModel(resource);
        return {
          value: reference,
          children: reference,
          shortNames: resource.shortNames,
          // Pre-compute lowercase for filtering so we don't repeat it on every keystroke
          searchableText: reference.toLowerCase(),
          searchableShortNames: resource.shortNames?.map((s) => s.toLowerCase()),
        };
      }),
    [resources],
  );

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

  useEffect(() => {
    setSelectedOptions(selected);
  }, [selected]);

  const selectOptions = useMemo(() => {
    if (!inputValue) {
      return initialSelectOptions;
    }
    const lower = inputValue.toLowerCase();
    return initialSelectOptions.filter(
      (menuItem) =>
        menuItem.searchableText?.includes(lower) ||
        menuItem.searchableShortNames?.some((shortName) => shortName.includes(lower)),
    );
  }, [inputValue, initialSelectOptions]);

  useEffect(() => {
    setPlaceholder(
      selectedOptions.length > 0
        ? t('public~Resources ({{total}})', { total: selectedOptions.length })
        : placeholderTextDefault,
    );
  }, [placeholderTextDefault, selectedOptions, t]);

  const createItemId = (value: any) => `resource-dropdown-${value.replace(' ', '-')}`;

  // Pre-compute a reference-to-model lookup map (O(1) per lookup instead of O(n))
  const referenceToModelMap = useMemo(() => {
    const map = new Map<string, K8sKind>();
    resources.forEach((r) => map.set(referenceForModel(r), r));
    return map;
  }, [resources]);

  // Track duplicate names so we know when to show the group.
  const kinds = useMemo(() => resources.groupBy((m) => m.kind), [resources]);
  const isDup = (kind) => kinds.get(kind).size > 1;

  const visibleSelectOptions = selectOptions.slice(0, MAX_VISIBLE_ITEMS);
  const items = visibleSelectOptions.map((option: SelectOptionProps, index) => {
    const ref = option.value as string;
    const model = referenceToModelMap.get(ref);
    if (!model) {
      return null;
    }

    return (
      <SelectOption
        key={ref}
        value={ref}
        hasCheckbox
        isSelected={selected.includes(ref)}
        isFocused={focusedItemIndex === index}
        id={createItemId(ref)}
      >
        <span className="co-resource-item">
          <span className="co-resource-icon--fixed-width">
            <ResourceIcon kind={ref} />
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
              <div className="pf-v6-u-font-size-xs pf-v6-u-text-color-subtle co-truncate co-nowrap">
                {model.apiGroup || 'core'}/{model.apiVersion}
              </div>
            )}
          </span>
        </span>
      </SelectOption>
    );
  });

  const recentSearches: JSX.Element[] =
    !_.isEmpty(recentSelectedList(recentSelected)) &&
    recentSelectedList(recentSelected)
      .slice(0, RECENT_SEARCH_ITEMS)
      .map((modelRef: K8sResourceKindReference) => {
        const model = referenceToModelMap.get(modelRef);
        if (model) {
          return (
            <SelectOption
              key={modelRef}
              value={modelRef}
              hasCheckbox
              isSelected={selected.includes(modelRef)}
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
                    <div className="pf-v6-u-font-size-xs pf-v6-u-text-color-subtle co-truncate co-nowrap">
                      {model.apiGroup || 'core'}/{model.apiVersion}
                    </div>
                  )}
                </span>
              </span>
            </SelectOption>
          );
        }
        return null;
      })
      .filter((item) => item !== null);

  const onClear = () => {
    setRecentSelected(JSON.stringify([]));
  };
  const NO_RESULTS = 'no results';

  const renderedOptions = () => {
    const options: JSX.Element[] = [];
    if (!_.isEmpty(recentSelectedList(recentSelected)) && !!recentList) {
      options.push(
        <Tooltip position="right" content={t('public~Clear history')} key="clear-history">
          <CloseButton
            className="co-select-group-close-button"
            dataTestID="close-icon"
            onClick={onClear}
          />
        </Tooltip>,
      );
      options.push(
        <SelectGroup
          label={t('public~Recently used')}
          className="co-select-group-dismissible"
          key="recently-used-resources"
        >
          <SelectList key="recently-used-resource-items">{recentSearches}</SelectList>
        </SelectGroup>,
      );
      options.push(<Divider key={3} className="co-select-group-divider" />);
    }
    const cleanItems = items.filter(Boolean);
    options.push(
      <Fragment key="resource-items">
        {cleanItems.length > 0
          ? cleanItems
          : [
              <SelectOption
                value={NO_RESULTS}
                key="select-multi-typeahead-no-results"
                isAriaDisabled={true}
              >
                {t('public~No results found')}
              </SelectOption>,
            ]}
        {selectOptions.length > MAX_VISIBLE_ITEMS && (
          <SelectOption
            value="type-to-filter"
            key="select-multi-typeahead-type-to-filter"
            isAriaDisabled={true}
          >
            {t('public~Showing {{visible}} of {{total}} resources. Type to filter.', {
              visible: MAX_VISIBLE_ITEMS,
              total: selectOptions.length,
            })}
          </SelectOption>
        )}
      </Fragment>,
    );
    return options;
  };

  const setActiveAndFocusedItem = (itemIndex: number) => {
    setFocusedItemIndex(itemIndex);
    const focusedItem = selectOptions[itemIndex];
    setActiveItemId(createItemId(focusedItem.value));
  };

  const resetActiveAndFocusedItem = () => {
    setFocusedItemIndex(null);
    setActiveItemId(null);
  };

  const closeMenu = () => {
    setIsOpen(false);
    resetActiveAndFocusedItem();
  };

  const onInputClick = () => {
    if (!isOpen) {
      setIsOpen(true);
    } else if (!inputValue) {
      closeMenu();
    }
  };

  const onTextInputChange = (_event: FormEvent<HTMLInputElement>, value: string) => {
    setInputValue(value);
    resetActiveAndFocusedItem();
    if (value && !isOpen) {
      setIsOpen(true);
    }
  };

  const onSelect = (value: string) => {
    if (value && value !== NO_RESULTS) {
      const newSelected = selected.includes(value)
        ? selected.filter((selection) => selection !== value)
        : [...selected, value];
      setSelectedOptions(newSelected);
      onChange(value);

      // Update recently used resources
      if (!_.isEmpty(newSelected)) {
        setRecentSelected(
          JSON.stringify(
            _.union(
              filterGroupVersionKind([...newSelected].reverse()),
              recentSelectedList(recentSelected),
            ),
          ),
        );
      }
    }

    textInputRef.current?.focus();
  };

  const handleMenuArrowKeys = (key: string) => {
    let indexToFocus = 0;
    const maxIndex = Math.min(selectOptions.length, MAX_VISIBLE_ITEMS) - 1;

    if (!isOpen) {
      setIsOpen(true);
    }

    if (maxIndex < 0 || selectOptions.every((option) => option.isDisabled)) {
      return;
    }

    if (key === 'ArrowUp') {
      // When no index is set or at the first index, focus to the last, otherwise decrement focus index
      if (focusedItemIndex === null || focusedItemIndex === 0) {
        indexToFocus = maxIndex;
      } else {
        indexToFocus = focusedItemIndex - 1;
      }

      // Skip disabled options
      while (selectOptions[indexToFocus].isDisabled) {
        indexToFocus--;
        if (indexToFocus === -1) {
          indexToFocus = maxIndex;
        }
      }
    }

    if (key === 'ArrowDown') {
      // When no index is set or at the last index, focus to the first, otherwise increment focus index
      if (focusedItemIndex === null || focusedItemIndex === maxIndex) {
        indexToFocus = 0;
      } else {
        indexToFocus = focusedItemIndex + 1;
      }

      // Skip disabled options
      while (selectOptions[indexToFocus].isDisabled) {
        indexToFocus++;
        if (indexToFocus > maxIndex) {
          indexToFocus = 0;
        }
      }
    }

    setActiveAndFocusedItem(indexToFocus);
  };

  const onInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    const focusedItem = focusedItemIndex !== null ? selectOptions[focusedItemIndex] : null;

    // eslint-disable-next-line default-case
    switch (event.key) {
      case 'Enter':
        if (
          isOpen &&
          focusedItem &&
          focusedItem.value !== NO_RESULTS &&
          !focusedItem.isAriaDisabled
        ) {
          onSelect(focusedItem.value);
        }

        if (!isOpen) {
          setIsOpen(true);
        }

        break;
      case 'ArrowUp':
      case 'ArrowDown':
        event.preventDefault();
        handleMenuArrowKeys(event.key);
        break;
    }
  };

  const onToggleClick = () => {
    setIsOpen(!isOpen);
    textInputRef?.current?.focus();
  };

  const onClearButtonClick = () => {
    setInputValue('');
    resetActiveAndFocusedItem();
    textInputRef?.current?.focus();
  };

  return (
    <div className={className}>
      <Select
        toggle={(toggleRef: Ref<MenuToggleElement>) => (
          <MenuToggle
            ref={toggleRef}
            variant="typeahead"
            onClick={onToggleClick}
            isExpanded={isOpen}
          >
            <TextInputGroup isPlain>
              <TextInputGroupMain
                value={inputValue}
                onClick={onInputClick}
                onChange={onTextInputChange}
                onKeyDown={onInputKeyDown}
                id="resource-dropdown"
                autoComplete="off"
                innerRef={textInputRef}
                placeholder={placeholder}
                {...(activeItemId && { 'aria-activedescendant': activeItemId })}
                role="combobox"
                isExpanded={isOpen}
                aria-controls="resource-dropdown-listbox"
              />
              <TextInputGroupUtilities {...(!inputValue ? { style: { display: 'none' } } : {})}>
                <Button
                  icon={<TimesIcon aria-hidden />}
                  variant="plain"
                  onClick={onClearButtonClick}
                  aria-label={t('public~Clear input value')}
                />
              </TextInputGroupUtilities>
            </TextInputGroup>
          </MenuToggle>
        )}
        onSelect={(_event, selection) => onSelect(selection as string)}
        selected={selected}
        isOpen={isOpen}
        onOpenChange={(open) => {
          !open && closeMenu();
        }}
        maxMenuHeight="60vh"
        shouldFocusFirstItemOnOpen={false}
        isScrollable
        role="menu"
        className={css('co-type-selector', className)}
      >
        <SelectList isAriaMultiselectable id="resource-dropdown-listbox">
          {renderedOptions()}
        </SelectList>
      </Select>
    </div>
  );
};

interface ExtendedSelectOptionProps extends SelectOptionProps {
  /** Searchable short names for the select options */
  shortNames?: string[];
  /** Pre-computed lowercase text for filtering */
  searchableText?: string;
  /** Pre-computed lowercase short names for filtering */
  searchableShortNames?: string[];
}

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
