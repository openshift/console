import * as React from 'react';
import * as _ from 'lodash-es';
import { connect } from 'react-redux';
import { Map as ImmutableMap, Set as ImmutableSet } from 'immutable';
import * as classNames from 'classnames';
import { useTranslation } from 'react-i18next';
import { ResourceIcon } from './utils';
import { K8sKind, K8sResourceKindReference, referenceForModel } from '../module/k8s';
import { DiscoveryResources } from '@console/dynamic-plugin-sdk/src/api/common-types';
import { useUserSettings } from '@console/shared/src';
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
  const [isOpen, setIsOpen] = React.useState(false);
  const [clearItems, setClearItems] = React.useState(false);
  const [recentSelected, setRecentSelected] = useUserSettings<string>(
    'console.search.recentlySearched',
    '[]',
    true,
  );
  const [selectedOptions, setSelectedOptions] = React.useState(selected);
  const [initialSelectOptions, setInitialSelectOptions] = React.useState<
    ExtendedSelectOptionProps[]
  >([]);
  const [selectOptions, setSelectOptions] = React.useState<ExtendedSelectOptionProps[]>(
    initialSelectOptions,
  );
  const [inputValue, setInputValue] = React.useState<string>('');
  const [focusedItemIndex, setFocusedItemIndex] = React.useState<number | null>(null);
  const [activeItemId, setActiveItemId] = React.useState<string | null>(null);
  const placeholderTextDefault = t('public~Resources');
  const [placeholder, setPlaceholder] = React.useState(placeholderTextDefault);
  const textInputRef = React.useRef<HTMLInputElement>();

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

  React.useEffect(() => {
    const resourcesToOption: SelectOptionProps[] = resources.toArray().map((resource) => {
      const reference = referenceForModel(resource);
      return { value: reference, children: reference, shortNames: resource.shortNames };
    });
    setInitialSelectOptions(resourcesToOption);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    setClearItems(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, setRecentSelected]);

  React.useEffect(() => {
    let newSelectOptions: SelectOptionProps[] = initialSelectOptions;

    // Filter menu items based on the text input value when one exists
    if (inputValue) {
      newSelectOptions = initialSelectOptions.filter(
        (menuItem) =>
          String(menuItem.children).toLowerCase().includes(inputValue.toLowerCase()) ||
          menuItem.shortNames?.some((shortName) =>
            shortName.toLowerCase().includes(inputValue.toLowerCase()),
          ),
      );

      // Open the menu when the input value changes and the new value is not empty
      if (!isOpen) {
        setIsOpen(true);
      }
    }

    setSelectOptions(newSelectOptions);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputValue, initialSelectOptions]);

  React.useEffect(() => {
    setPlaceholder(
      selectedOptions.length > 0
        ? t('public~Resources ({{total}})', { total: selectedOptions.length })
        : placeholderTextDefault,
    );
  }, [placeholderTextDefault, selectedOptions, t]);

  const createItemId = (value: any) => `resource-dropdown-${value.replace(' ', '-')}`;
  // Track duplicate names so we know when to show the group.
  const kinds = resources.groupBy((m) => m.kind);
  const isDup = (kind) => kinds.get(kind).size > 1;

  const items = selectOptions.map((option: SelectOptionProps, index) => {
    const model = resources.toArray().find((resource: K8sKind) => {
      return option.value === referenceForModel(resource);
    });

    return (
      <SelectOption
        key={referenceForModel(model)}
        value={referenceForModel(model)}
        hasCheckbox
        isSelected={selected.includes(referenceForModel(model))}
        isFocused={focusedItemIndex === index}
        id={createItemId(referenceForModel(model))}
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
      </SelectOption>
    );
  });

  const recentSearches: JSX.Element[] =
    !_.isEmpty(recentSelectedList(recentSelected)) &&
    recentSelectedList(recentSelected)
      .splice(0, RECENT_SEARCH_ITEMS)
      .map((modelRef: K8sResourceKindReference) => {
        const model: K8sKind = resources.find((m) => referenceForModel(m) === modelRef);
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
                    <div className="co-resource-item__resource-api text-muted co-truncate co-nowrap small">
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
    setClearItems(true);
    setRecentSelected(JSON.stringify([]));
  };
  const NO_RESULTS = 'no results';

  const renderedOptions = () => {
    const options: JSX.Element[] = [];
    if (!_.isEmpty(recentSelectedList(recentSelected)) && !!recentList) {
      options.push(
        <Tooltip position="right" content={t('public~Clear history')} key="clear-history">
          <CloseButton
            additionalClassName="co-select-group-close-button"
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
    options.push(
      <React.Fragment key="resource-items">
        {items.length > 0
          ? items
          : [
              <SelectOption
                value={NO_RESULTS}
                key="select-multi-typeahead-no-results"
                isAriaDisabled={true}
              >
                {t('public~No results found')}
              </SelectOption>,
            ]}
      </React.Fragment>,
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

  const onTextInputChange = (_event: React.FormEvent<HTMLInputElement>, value: string) => {
    setInputValue(value);
    resetActiveAndFocusedItem();
  };

  const onSelect = (value: string) => {
    if (value && value !== NO_RESULTS) {
      setSelectedOptions(
        selected.includes(value)
          ? selected.filter((selection) => selection !== value)
          : [...selected, value],
      );
      onChange(value);
    }

    textInputRef.current?.focus();
  };

  const handleMenuArrowKeys = (key: string) => {
    let indexToFocus = 0;

    if (!isOpen) {
      setIsOpen(true);
    }

    if (selectOptions.every((option) => option.isDisabled)) {
      return;
    }

    if (key === 'ArrowUp') {
      // When no index is set or at the first index, focus to the last, otherwise decrement focus index
      if (focusedItemIndex === null || focusedItemIndex === 0) {
        indexToFocus = selectOptions.length - 1;
      } else {
        indexToFocus = focusedItemIndex - 1;
      }

      // Skip disabled options
      while (selectOptions[indexToFocus].isDisabled) {
        indexToFocus--;
        if (indexToFocus === -1) {
          indexToFocus = selectOptions.length - 1;
        }
      }
    }

    if (key === 'ArrowDown') {
      // When no index is set or at the last index, focus to the first, otherwise increment focus index
      if (focusedItemIndex === null || focusedItemIndex === selectOptions.length - 1) {
        indexToFocus = 0;
      } else {
        indexToFocus = focusedItemIndex + 1;
      }

      // Skip disabled options
      while (selectOptions[indexToFocus].isDisabled) {
        indexToFocus++;
        if (indexToFocus === selectOptions.length) {
          indexToFocus = 0;
        }
      }
    }

    setActiveAndFocusedItem(indexToFocus);
  };

  const onInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
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
        toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
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
        className={classNames('co-type-selector', className)}
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
