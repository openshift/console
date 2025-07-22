import * as _ from 'lodash-es';
import * as React from 'react';
import { useUserSettingsCompatibility } from '@console/shared/src/hooks/useUserSettingsCompatibility';
import {
  Divider,
  Menu,
  MenuContainer,
  MenuContent,
  MenuGroup,
  MenuItem,
  MenuList,
  MenuSearch,
  MenuSearchInput,
  MenuToggle,
  SearchInput,
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
};

const ConsoleSelectItem: React.FCC<{
  itemKey: string;
  content: React.ReactNode;
  onclick: (key: string, e: React.MouseEvent) => void;
  selected: boolean;
  isBookmarked?: boolean;
}> = ({ itemKey, content, onclick, selected, isBookmarked }) => (
  <MenuItem
    data-test-dropdown-menu={itemKey}
    data-test-id="dropdown-menu"
    data-test="dropdown-menu-item-link"
    id={`${itemKey}-link`}
    isFavorited={isBookmarked}
    isSelected={selected}
    itemId={itemKey}
    key={itemKey}
    onClick={(e) => onclick(itemKey, e)}
    role="option"
  >
    {content}
  </MenuItem>
);

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
 * @deprecated Due to this components complexity, prefer `@patternfly/react-templates` components when possible.
 */
export const ConsoleSelect: React.FCC<ConsoleSelectProps> = ({
  actionItems,
  active,
  ariaLabel,
  autocompleteFilter,
  autocompletePlaceholder,
  buttonClassName,
  className,
  dataTest,
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
  ...props
}) => {
  /* Dropdown state */
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
  const dropdownMenuRef = React.useRef<HTMLDivElement>(null);
  const dropdownToggleRef = React.useRef<HTMLButtonElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const insideLegacyModal = useInsideLegacyModal(dropdownWrapperRef);

  /* Event handlers */
  const onClick = React.useCallback(
    (clickedKey: string, e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      e.nativeEvent?.stopImmediatePropagation?.();

      onChange && onChange(clickedKey, e);

      if (!actionItems || !_.some(actionItems, { actionKey: clickedKey })) {
        setSelectedKey(clickedKey);
      }

      setExpanded(false);
    },
    [onChange, props.items, actionItems],
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
  React.useEffect(() => {
    if (props.selectedKey && props.selectedKey !== selectedKey) {
      setSelectedKey(props.selectedKey);
    }
  }, [props.selectedKey, selectedKey]);

  React.useEffect(() => {
    applyTextFilter(autocompleteText, props.items);
  }, [props.items, applyTextFilter, autocompleteText]);

  // Clear filter when opening dropdown
  React.useEffect(() => {
    if (expanded && inputRef.current) {
      applyTextFilter('', props.items);
    }
  }, [expanded, applyTextFilter]);

  /* Menu toggle button */
  const toggleButton = (
    <MenuToggle
      aria-describedby={describedBy}
      aria-label={ariaLabel}
      className={buttonClassName}
      data-test-id="dropdown-button"
      data-test={dataTest}
      id={id}
      isDisabled={disabled}
      isExpanded={expanded}
      isFullWidth={isFullWidth}
      onClick={() => {
        setExpanded((prev) => !prev);
      }}
      ref={dropdownToggleRef}
    >
      {titlePrefix && `${titlePrefix}: `}
      {alwaysShowTitle ? title : selectedKey ? items[selectedKey] ?? title : title}
    </MenuToggle>
  );

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
            onclick={onClick}
            selected={ai.actionKey === selectedKey}
          />
        ))}
        <Divider component="li" />
      </>
    );
  }, [actionItems, onClick, selectedKey]);

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
            onclick={onClick}
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
          onclick={onClick}
          selected={selected}
          isBookmarked={enableBookmarks && bookmarks ? bookmarks[key] ?? false : undefined}
        />,
      );
    });

    return { rows: accRows, bookmarkRows: accBookmarkRows };
  }, [
    bookmarks,
    enableBookmarks,
    headerBefore,
    items,
    onClick,
    selectedKey,
    spacerBefore,
    storageKey,
  ]);

  const menu = (
    <Menu
      isScrollable
      ref={dropdownMenuRef}
      style={style}
      // Bookmarking is the only action, so we do not need to check the action
      onActionClick={(e, itemId: string) => {
        e.stopPropagation();
        e.preventDefault();
        onBookmark?.(itemId, !bookmarks[itemId]);
      }}
    >
      <MenuContent style={{ maxHeight: '60vh' }}>
        {autocompleteFilter && (
          <>
            <MenuSearch>
              <MenuSearchInput>
                <SearchInput
                  data-test-id="dropdown-text-filter"
                  inputProps={{
                    autoCapitalize: 'none',
                    autoFocus: true,
                  }}
                  onChange={(_e, value) => applyTextFilter(value, props.items)}
                  onClick={(e) => e.stopPropagation()}
                  placeholder={autocompletePlaceholder}
                  ref={inputRef}
                  value={autocompleteText ?? ''}
                />
              </MenuSearchInput>
            </MenuSearch>
            <Divider />
          </>
        )}

        <MenuList
          className={css(menuClassName, { 'pf-v6-u-pt-0': autocompleteFilter })}
          role="listbox"
        >
          {bookmarkRows.length ? (
            <>
              <MenuGroup label="Favorites" labelHeadingLevel="h3">
                {bookmarkRows}
              </MenuGroup>
              {renderedActionItems || rows.length ? <Divider component="li" /> : null}
            </>
          ) : null}

          {renderedActionItems || rows.length ? (
            <>
              {renderedActionItems}
              {rows}
            </>
          ) : null}
        </MenuList>
      </MenuContent>
    </Menu>
  );

  return (
    <div className={className} ref={dropdownWrapperRef}>
      <MenuContainer
        isOpen={expanded}
        menu={menu}
        menuRef={dropdownMenuRef}
        onOpenChange={setExpanded}
        onOpenChangeKeys={['Escape']}
        toggle={toggleButton}
        toggleRef={dropdownToggleRef}
        zIndex={9999}
        popperProps={{
          preventOverflow: menuClassName === 'prevent-overflow',
          // @ts-expect-error This is a popper prop which PatternFly doesn't type
          appendTo: insideLegacyModal ? 'inline' : undefined,
        }}
      />
    </div>
  );
};

ConsoleSelect.displayName = 'ConsoleSelect';
