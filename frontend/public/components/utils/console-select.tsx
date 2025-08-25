import * as _ from 'lodash-es';
import * as React from 'react';
import { useUserSettingsCompatibility } from '@console/shared/src/hooks/useUserSettingsCompatibility';
import {
  Divider,
  SelectGroup,
  SelectOption,
  SelectList,
  MenuSearch,
  MenuSearchInput,
  MenuToggle,
  MenuToggleElement,
  SearchInput,
  Select,
} from '@patternfly/react-core';
import { css } from '@patternfly/react-styles';

export type ActionItem = {
  actionKey: string;
  actionTitle: string;
};

export type ConsoleSelectProps = {
  /** Action items to be displayed at the top of the dropdown */
  actionItems?: ActionItem[];
  /** Whether the dropdown is open by default */
  active?: boolean;
  /** Aria label for the dropdown toggle */
  ariaLabel?: string;
  /** Filter function for autocomplete */
  autocompleteFilter?: (text: string, item: any, key: string) => boolean;
  /** Placeholder for the autocomplete search box */
  autocompletePlaceholder?: string;
  /** Class name for the menu toggle button */
  buttonClassName?: string;
  /** Class name for the dropdown wrapper */
  className?: string;
  /** Data test attribute for the menu toggle */
  dataTest?: string;
  /** aria-describedby attribute for the menu toggle */
  describedBy?: string;
  /** Whether the dropdown is disabled */
  disabled?: boolean;
  /** Header items to be displayed before the dropdown items */
  headerBefore?: Record<string, string>;
  /** Unique identifier for the dropdown */
  id?: string;
  /** Whether the dropdown should take full width */
  isFullWidth?: boolean;
  /** The items to be displayed in the dropdown */
  items: Record<string, React.ReactNode>;
  /** Class name for the dropdown menu */
  menuClassName?: string;
  /** Callback when an item is selected */
  onChange?: (key: string, e: React.MouseEvent) => void;
  /** Wether the dropdown is a required field */
  required?: boolean;
  /** The currently selected key */
  selectedKey?: string;
  /** Where to place spacers in the dropdown */
  spacerBefore?: Set<string>;
  /** Key for storing bookmarks in user settings */
  storageKey?: string;
  /** Style for the dropdown */
  style?: React.CSSProperties;
  /** Title displayed in the dropdown toggle. Will always be shown regardless of state */
  title?: React.ReactNode;
  /** Prefix for the title in the dropdown toggle */
  titlePrefix?: string;
  /** User settings id prefix for bookmarks */
  userSettingsPrefix?: string;
  /** By default, the title prop is shown as the placeholder for when no item is selected. This prop forces the title to always be shown */
  alwaysShowTitle?: boolean;
  /** Whether to render the dropdown inline */
  renderInline?: boolean;
};

const ConsoleSelectItem: React.FCC<{
  itemKey: string;
  content: React.ReactNode;
  selected: boolean;
  isBookmarked?: boolean;
}> = ({ itemKey, content, selected, isBookmarked }) => (
  <SelectOption
    data-test-dropdown-menu={itemKey}
    data-test="console-select-item"
    id={`${itemKey}-link`}
    isFavorited={isBookmarked}
    isSelected={selected}
    itemId={itemKey}
    key={itemKey}
  >
    {content}
  </SelectOption>
);

/** Returns true if the given `ref` is inside of the legacy modal container */
const useInsideLegacyModal = (ref: React.RefObject<HTMLElement>) => {
  const [insideLegacyModal, setInsideLegacyModal] = React.useState(false);

  React.useEffect(() => {
    const modal = ref.current?.closest('#modal-container');
    setInsideLegacyModal(!!modal);
  }, [ref]);

  return insideLegacyModal;
};

/**
 * A Select is a dropdown that indicates state.
 *
 * Due to this components complexity, prefer `@patternfly/react-templates` components when possible.
 */
export const ConsoleSelect: React.FCC<ConsoleSelectProps> = ({
  actionItems,
  active,
  ariaLabel,
  autocompleteFilter,
  autocompletePlaceholder,
  buttonClassName,
  className,
  dataTest = 'console-select-menu-toggle',
  describedBy,
  disabled,
  headerBefore = {},
  id,
  isFullWidth,
  menuClassName,
  onChange,
  spacerBefore = new Set(),
  storageKey,
  style,
  title,
  alwaysShowTitle = false,
  titlePrefix,
  userSettingsPrefix,
  renderInline = false,
  ...props
}) => {
  const [expanded, setExpanded] = React.useState(active ?? false);
  const [selectedKey, setSelectedKey] = React.useState<string>(props.selectedKey ?? '');
  const [autocompleteText, setAutocompleteText] = React.useState<string>('');
  const [items, setItems] = React.useState<Record<string, React.ReactNode>>(props.items);

  /* Dropdown bookmark state and helpers */
  // Should be undefined so that we don't save undefined-xxx.
  const bookmarkUserSettingsKey = userSettingsPrefix
    ? `${userSettingsPrefix}.bookmarks`
    : undefined;
  const bookmarkStorageKey = storageKey ? `${storageKey}-bookmarks` : undefined;

  const enableBookmarks = !!bookmarkUserSettingsKey || !!bookmarkStorageKey;

  const [bookmarks, setBookmarks] = useUserSettingsCompatibility(
    bookmarkUserSettingsKey,
    bookmarkStorageKey,
    {},
    true,
  );

  const onBookmark = React.useCallback(
    (key: string, isBookmarked: boolean) => {
      setBookmarks((oldBookmarks: Record<string, boolean>) => ({
        ...oldBookmarks,
        [key]: isBookmarked ? true : undefined,
      }));
    },
    [setBookmarks],
  );

  /* Component refs */
  const dropdownWrapperRef = React.useRef<HTMLDivElement>(null);

  const insideLegacyModal = useInsideLegacyModal(dropdownWrapperRef);

  /* Event handlers */
  const onClick = React.useCallback(
    (e: React.MouseEvent, clickedKey: string) => {
      onChange && onChange(clickedKey, e);

      if (!actionItems || !_.some(actionItems, { actionKey: clickedKey })) {
        setSelectedKey(clickedKey);
      }

      setExpanded(false);
    },
    [onChange, actionItems],
  );

  const applyTextFilter = React.useCallback(
    (text: string, itemsToFilter: Record<string, React.ReactNode>) => {
      let filteredItems = itemsToFilter;
      if (autocompleteFilter && !_.isEmpty(text)) {
        filteredItems = _.pickBy(itemsToFilter, (item, key) => autocompleteFilter(text, item, key));
      }
      setAutocompleteText(text);
      setItems(filteredItems);
    },
    [autocompleteFilter],
  );

  // Update state when props change
  const { selectedKey: propsSelectedKey, items: propsItems } = props;

  React.useEffect(() => {
    if (propsSelectedKey && propsSelectedKey !== selectedKey) {
      setSelectedKey(propsSelectedKey);
    }
  }, [propsSelectedKey, selectedKey]);

  React.useEffect(() => {
    applyTextFilter(autocompleteText, propsItems);
  }, [propsItems, applyTextFilter, autocompleteText]);

  // Clear filter when opening dropdown
  React.useEffect(() => {
    if (expanded) {
      applyTextFilter('', propsItems);
    }
  }, [expanded, applyTextFilter, propsItems]);

  /* Menu content */
  const renderedActionItems = React.useMemo(() => {
    if (!actionItems) {
      return null;
    }

    return (
      <>
        {actionItems.map((ai) => (
          <ConsoleSelectItem
            key={`${ai.actionKey}-${ai.actionTitle}`}
            itemKey={ai.actionKey}
            content={ai.actionTitle}
            selected={ai.actionKey === selectedKey}
          />
        ))}
        <Divider component="li" />
      </>
    );
  }, [actionItems, selectedKey]);

  const { rows, bookmarkRows } = React.useMemo(() => {
    const accRows: React.ReactNode[] = [];
    const accBookmarkRows: React.ReactNode[] = [];

    Object.entries(items).forEach(([key, content]) => {
      const selected = key === selectedKey;

      if (enableBookmarks && bookmarks[key]) {
        accBookmarkRows.push(
          <ConsoleSelectItem
            key={key}
            itemKey={key}
            content={content}
            selected={selected}
            isBookmarked
          />,
        );
        return;
      }

      if (spacerBefore.has(key)) {
        accRows.push(<Divider component="li" />);
      }

      if (headerBefore[key]) {
        accRows.push(
          <li key={`${key}-header`}>
            <div className="pf-v6-c-menu__group-title">{headerBefore[key]}</div>
          </li>,
        );
      }

      accRows.push(
        <ConsoleSelectItem
          key={key}
          itemKey={key}
          content={content}
          selected={selected}
          isBookmarked={enableBookmarks && bookmarks ? bookmarks[key] ?? false : undefined}
        />,
      );
    });

    return { rows: accRows, bookmarkRows: accBookmarkRows };
  }, [bookmarks, enableBookmarks, headerBefore, items, selectedKey, spacerBefore]);

  return (
    <div className={className} ref={dropdownWrapperRef}>
      <Select
        isOpen={expanded}
        onOpenChange={setExpanded}
        onOpenChangeKeys={autocompleteFilter ? ['Escape'] : ['Escape', 'Tab']} // tab is used to access the search input
        onSelect={onClick}
        selected={selectedKey}
        shouldFocusToggleOnSelect
        toggle={(toggleRef: React.RefObject<MenuToggleElement>) => (
          <MenuToggle
            aria-describedby={describedBy}
            aria-label={ariaLabel}
            className={buttonClassName}
            data-test={dataTest}
            id={id}
            isDisabled={disabled}
            isExpanded={expanded}
            isFullWidth={isFullWidth}
            onClick={() => {
              setExpanded((prev) => !prev);
            }}
            ref={toggleRef}
          >
            {titlePrefix && `${titlePrefix}: `}
            {alwaysShowTitle ? title : selectedKey ? items[selectedKey] ?? title : title}
          </MenuToggle>
        )}
        zIndex={9999}
        popperProps={{
          preventOverflow: menuClassName === 'prevent-overflow',
          appendTo: renderInline || insideLegacyModal ? 'inline' : undefined,
        }}
        isScrollable
        style={style}
        // Bookmarking is the only action, so we do not need to check the action
        onActionClick={(e, itemId: string) => {
          e.stopPropagation();
          e.preventDefault();
          onBookmark?.(itemId, !bookmarks[itemId]);
        }}
      >
        {autocompleteFilter && (
          <>
            <MenuSearch>
              <MenuSearchInput>
                <SearchInput
                  data-test="console-select-search-input"
                  inputProps={{
                    autoCapitalize: 'none',
                    autoFocus: true,
                  }}
                  onChange={(_e, value) => applyTextFilter(value, props.items)}
                  onClick={(e) => e.stopPropagation()}
                  placeholder={autocompletePlaceholder}
                  value={autocompleteText ?? ''}
                />
              </MenuSearchInput>
            </MenuSearch>
            <Divider />
          </>
        )}

        <SelectList
          className={css(menuClassName, { 'pf-v6-u-pt-0': autocompleteFilter })}
          data-test="console-select-menu-list"
        >
          {bookmarkRows.length ? (
            <>
              <SelectGroup label="Favorites" labelHeadingLevel="h3">
                {bookmarkRows}
              </SelectGroup>
              {renderedActionItems || rows.length ? <Divider component="li" /> : null}
            </>
          ) : null}

          {renderedActionItems || rows.length ? (
            <>
              {renderedActionItems}
              {rows}
            </>
          ) : null}
        </SelectList>
      </Select>
    </div>
  );
};

ConsoleSelect.displayName = 'ConsoleSelect';
