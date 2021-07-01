import * as React from 'react';
import {
  Button,
  Divider,
  EmptyState,
  EmptyStateBody,
  EmptyStatePrimary,
  Menu,
  MenuContent,
  MenuFooter,
  MenuGroup,
  MenuInput,
  MenuItem,
  MenuList,
  Switch,
  TextInput,
  Title,
} from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { useUserSettingsCompatibility } from '@console/shared';
import { isSystemNamespace } from './factory/table-filters';
import NamespaceMenuToggle from './namespace-menu-toggle';

const NamespaceBarDropdown: React.FC<NamespaceBarDropdownProps> = ({
  canCreateNew,
  disabled,
  isProjects,
  onCreateNew,
  onSelect,
  options,
  selected,
  shortCut,
  storageKey,
  title,
  userSettingsPrefix,
}) => {
  const { t } = useTranslation();

  const filterRef = React.useRef(null);
  const menuRef = React.useRef(null);

  const [isOpen, setOpen] = React.useState(false);
  const [filterText, setFilterText] = React.useState('');

  React.useEffect(() => {
    // This is necessary until fixed in PatternFly Menu item
    // see https://github.com/patternfly/patternfly-react/issues/5915
    // Ensures that menu is always available via keyboard
    const buttons = menuRef.current?.querySelectorAll('button');
    if (buttons?.[0]) {
      (buttons[0] as HTMLElement).tabIndex = 0;
    }
  }, [filterText]);

  // Bookmarking / favorites (note in <= 4.8 this feature was known as bookmarking)
  const favoritesUserSettingsKey = userSettingsPrefix
    ? `${userSettingsPrefix}.bookmarks`
    : undefined;

  const systemNamespacesSettingsKey = userSettingsPrefix
    ? `${userSettingsPrefix}.systemNamespace`
    : undefined;

  const favoriteStorageKey = storageKey ? `${storageKey}-bookmarks` : undefined;
  const systemNamespaceKey = storageKey ? `${storageKey}-systemNamespace` : undefined;

  const [favorites, setFavorites] = useUserSettingsCompatibility(
    favoritesUserSettingsKey,
    favoriteStorageKey,
    undefined,
    true,
  );

  const [systemNamespaces, setSystemNamespaces] = useUserSettingsCompatibility(
    systemNamespacesSettingsKey,
    systemNamespaceKey,
    false,
    true,
  );

  const onSetFavorite = React.useCallback(
    (key, active) => {
      setFavorites((oldFavorites) => ({
        ...oldFavorites,
        [key]: active ? true : undefined,
      }));
    },
    [setFavorites],
  );

  const hasSystemNamespaces = React.useMemo(
    () => options.some((option) => isSystemNamespace(option)),
    [options],
  );

  React.useEffect(() => {
    if (isOpen) {
      setFilterText('');
    }
  }, [isOpen]);

  const onFavorite = (event: any, itemID: string) => {
    const isCurrentFavorite = favorites?.[itemID];
    onSetFavorite(itemID, !isCurrentFavorite);
  };

  const showSystemSwitch = hasSystemNamespaces ? (
    <>
      <Divider />
      {/* NOTE: All Menu components throw type errors if translate isn't added */}
      {/* @ts-ignore */}
      <MenuInput>
        <Switch
          id="no-label-switch-on"
          label={isProjects ? t('public~Show system projects') : t('public~Show system namespaces')}
          isChecked={systemNamespaces}
          onChange={(isChecked: boolean) => {
            setSystemNamespaces(isChecked);
          }}
          className="pf-c-select__menu-item pf-m-action co-namespace-selector__switch"
        />
      </MenuInput>
    </>
  ) : null;

  const filter = (
    // @ts-ignore
    <MenuInput>
      <TextInput
        autoFocus
        value={filterText}
        aria-label={isProjects ? t('public~Select project...') : t('public~Select namespace...')}
        iconVariant="search"
        type="search"
        placeholder={isProjects ? t('public~Select project...') : t('public~Select namespace...')}
        onChange={(value: string) => setFilterText(value)}
        className="co-namespace-selector__filter"
        ref={filterRef}
      />
    </MenuInput>
  );

  const isFavorite = React.useCallback((option) => (favorites?.[option.key] ? true : false), [
    favorites,
  ]); // undefined cannot be an option

  const noResults = (
    <>
      <Divider />
      <EmptyState>
        <Title size="md" headingLevel="h4">
          {isProjects ? t('public~No projects found') : t('public~No namespaces found')}
        </Title>
        <EmptyStateBody>{t('public~No results match the filter criteria.')}</EmptyStateBody>
        <EmptyStatePrimary>
          <Button
            variant="link"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              setFilterText('');
              filterRef.current?.focus();
            }}
            className="co-namespace-selector__clear-filters"
          >
            {t('Clear filters')}
          </Button>
        </EmptyStatePrimary>
      </EmptyState>
    </>
  );

  const isOptionShown = React.useCallback(
    (option, checkIsFavorite: boolean) => {
      const containsFilterText = option.title.toLowerCase().includes(filterText.toLowerCase());

      return (
        containsFilterText &&
        (systemNamespaces || !isSystemNamespace(option)) &&
        (!checkIsFavorite || isFavorite(option))
      );
    },
    [filterText, isFavorite, systemNamespaces],
  );

  const { filteredOptions, filteredFavorites } = React.useMemo(
    () =>
      options.reduce(
        (filtered, option) => {
          if (isOptionShown(option, false)) {
            filtered.filteredOptions.push(option);
          }
          if (isOptionShown(option, true)) {
            filtered.filteredFavorites.push(option);
          }
          return filtered;
        },
        { filteredOptions: [], filteredFavorites: [] },
      ),
    [isOptionShown, options],
  );

  const menuGroup = (isFavorites?: boolean) => {
    const label = isFavorites ? t('public~Favorites') : t('public~Projects');

    if (!isFavorites && filteredOptions.length === 0) {
      return noResults;
    }
    if (isFavorites && filteredFavorites.length === 0) {
      return null;
    }

    const optionsToDisplay = isFavorites ? filteredFavorites : filteredOptions;

    const menuItems = optionsToDisplay.map((option) => {
      return (
        // @ts-ignore
        <MenuItem
          key={option.key}
          itemId={option.key}
          isFavorited={isFavorite(option)}
          isSelected={selected === option.key}
        >
          {option.title}
        </MenuItem>
      );
    });
    return (
      <>
        <Divider />
        {/* @ts-ignore */}
        <MenuGroup label={label}>
          {/* @ts-ignore */}
          <MenuContent>
            {/* @ts-ignore */}
            <MenuList>{menuItems}</MenuList>
          </MenuContent>
        </MenuGroup>
      </>
    );
  };

  const footer = canCreateNew ? (
    <MenuFooter className="co-namespace-selector__footer">
      {
        <Button
          variant="secondary"
          onClick={() => {
            setOpen(false);
            onCreateNew();
          }}
        >
          {isProjects ? t('public~Create Project') : t('public~Create Namespace')}
        </Button>
      }
    </MenuFooter>
  ) : null;

  const NamespaceChildSelect = (
    <Menu
      className="co-namespace-selector__menu"
      ref={menuRef}
      onSelect={(event: React.MouseEvent, itemId: string) => {
        setOpen(false);
        onSelect(event, itemId);
      }}
      onActionClick={onFavorite}
      activeItemId={selected}
    >
      {filter}
      {menuGroup(true)} {/* favorites/bookmarks */}
      {showSystemSwitch}
      {menuGroup()} {/* all options */}
      {footer}
    </Menu>
  );

  return (
    <div className="co-namespace-selector co-namespace-project-selector">
      <NamespaceMenuToggle
        disabled={disabled}
        menu={NamespaceChildSelect}
        isOpen={isOpen}
        title={`${isProjects ? t('public~Project') : t('public~Namespace')}: ${title}`}
        onToggle={(menuState) => {
          setOpen(menuState);
        }}
        shortCut={shortCut}
      />
    </div>
  );
};

type NamespaceBarDropdownProps = {
  options: { title: string; key: string }[];
  disabled?: boolean;
  isProjects?: boolean; // Does this drop down contain projects.  If not, assuming namespaces
  onSelect?: (event: React.MouseEvent | React.ChangeEvent, value: string) => void;
  shortCut?: string;
  selected?: string;
  storageKey?: string;
  title?: string;
  userSettingsPrefix?: string;
  onCreateNew?: () => void;
  canCreateNew?: boolean;
};

export default NamespaceBarDropdown;
