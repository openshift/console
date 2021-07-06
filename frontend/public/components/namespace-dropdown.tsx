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
import { createProjectModal } from './modals';
import { removeQueryArgument } from './utils/router';

import { isSystemNamespace } from './factory/table-filters';
import NamespaceMenuToggle from './namespace-menu-toggle';

/* ******************************************************************* */

const NoResults: React.FC<{
  isProjects: boolean;
  onClear: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
}> = ({ isProjects, onClear }) => {
  const { t } = useTranslation();
  return (
    <>
      <Divider />
      <EmptyState>
        <Title size="md" headingLevel="h4">
          {isProjects ? t('public~No projects found') : t('public~No namespaces found')}
        </Title>
        <EmptyStateBody>{t('public~No results match the filter criteria.')}</EmptyStateBody>
        <EmptyStatePrimary>
          <Button variant="link" onClick={onClear} className="co-namespace-selector__clear-filters">
            {t('Clear filters')}
          </Button>
        </EmptyStatePrimary>
      </EmptyState>
    </>
  );
};
/* ******************************************************************* */
const Filter: React.FC<{
  filterRef: React.Ref<any>;
  onFilterChange: (filterText: string) => void;
  filterText: string;
  isProject: boolean;
}> = ({ filterText, filterRef, onFilterChange, isProject }) => {
  const { t } = useTranslation();
  return (
    // @ts-ignore
    <MenuInput>
      <TextInput
        autoFocus
        value={filterText}
        aria-label={isProject ? t('public~Select project...') : t('public~Select namespace...')}
        iconVariant="search"
        type="search"
        placeholder={isProject ? t('public~Select project...') : t('public~Select namespace...')}
        onChange={(value: string) => onFilterChange(value)}
        className="co-namespace-selector__filter"
        ref={filterRef}
      />
    </MenuInput>
  );
};

/* ******************************************************************* */
const SystemSwitch: React.FC<{
  hasSystemNamespaces: boolean;
  isProject: boolean;
  isChecked: boolean;
  onChange: (isChecked: boolean) => void;
}> = ({ hasSystemNamespaces, isProject, isChecked, onChange }) => {
  const { t } = useTranslation();
  return hasSystemNamespaces ? (
    <>
      <Divider />
      {/*
        //@ts-ignore */}
      <MenuInput>
        <Switch
          id="no-label-switch-on"
          label={isProject ? t('public~Show system projects') : t('public~Show system namespaces')}
          isChecked={isChecked}
          onChange={onChange}
          className="pf-c-select__menu-item pf-m-action co-namespace-selector__switch"
        />
      </MenuInput>
    </>
  ) : null;
};

/* ******************************************************************* */
const NamespaceGroup: React.FC<{
  isFavorites?: boolean;
  options: { key: string; title: string }[];
  selectedKey: string;
  favorites: { [key: string]: boolean }[];
}> = ({ isFavorites, options, selectedKey, favorites }) => {
  const { t } = useTranslation();
  const label = isFavorites ? t('public~Favorites') : t('public~Projects');

  return options.length === 0 ? null : (
    <>
      <Divider />
      {/*
        //@ts-ignore */}
      <MenuGroup label={label}>
        {/*
        //@ts-ignore */}
        <MenuList>
          {options.map((option) => {
            return (
              // @ts-ignore
              <MenuItem
                key={option.key}
                itemId={option.key}
                isFavorited={favorites?.[option.key] ? true : false}
                isSelected={selectedKey === option.key}
              >
                {option.title}
              </MenuItem>
            );
          })}
        </MenuList>
      </MenuGroup>
    </>
  );
};

/* ******************************************************************* */
const Footer: React.FC<{
  canCreateNew: boolean;
  isProject?: boolean;
  setOpen: (isOpen: boolean) => void;
  setActiveNamespace: (name: string) => void;
}> = ({ canCreateNew, isProject, setOpen, setActiveNamespace }) => {
  const { t } = useTranslation();
  return (
    <>
      {canCreateNew ? (
        <MenuFooter className="co-namespace-selector__footer">
          {
            <Button
              variant="secondary"
              onClick={() => {
                setOpen(false);
                createProjectModal({
                  blocking: true,
                  onSubmit: (newProject) => {
                    setActiveNamespace(newProject.metadata.name);
                    removeQueryArgument('project-name');
                  },
                });
              }}
            >
              {isProject ? t('public~Create Project') : t('public~Create Namespace')}
            </Button>
          }
        </MenuFooter>
      ) : null}
    </>
  );
};

/* ******************************************************************* */

const NamespaceMenu: React.FC<{
  setOpen: (isOpen: boolean) => void;
  onSelect: (event: React.MouseEvent, itemId: string) => void;
  selected?: string;
  isProjects: boolean;
  options: { title: string; key: string }[];
  canCreateNew?: boolean;
}> = ({ setOpen, onSelect, selected, isProjects, options, canCreateNew }) => {
  const menuRef = React.useRef(null);
  const filterRef = React.useRef(null);

  const USERSETTINGS_PREFIX = 'console';
  const userSettingsPrefix = `${USERSETTINGS_PREFIX}.namespace`;
  const NAMESPACE_LOCAL_STORAGE_KEY = 'dropdown-storage-namespaces';
  const [filterText, setFilterText] = React.useState('');

  // Bookmarking / favorites (note in <= 4.8 this feature was known as bookmarking)
  const favoritesUserSettingsKey = userSettingsPrefix
    ? `${userSettingsPrefix}.bookmarks`
    : undefined;

  const systemNamespacesSettingsKey = userSettingsPrefix
    ? `${userSettingsPrefix}.systemNamespace`
    : undefined;

  const favoriteStorageKey = NAMESPACE_LOCAL_STORAGE_KEY
    ? `${NAMESPACE_LOCAL_STORAGE_KEY}-bookmarks`
    : undefined;
  const systemNamespaceKey = NAMESPACE_LOCAL_STORAGE_KEY
    ? `${NAMESPACE_LOCAL_STORAGE_KEY}-systemNamespace`
    : undefined;

  const [favorites, setFavorites] = useUserSettingsCompatibility(
    favoritesUserSettingsKey,
    favoriteStorageKey,
    undefined,
    true,
  );

  const hasSystemNamespaces = React.useMemo(
    () => options.some((option) => isSystemNamespace(option)),
    [options],
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

  const [systemNamespaces, setSystemNamespaces] = useUserSettingsCompatibility(
    systemNamespacesSettingsKey,
    systemNamespaceKey,
    false,
    true,
  );

  const isFavorite = React.useCallback((option) => (favorites?.[option.key] ? true : false), [
    favorites,
  ]); // undefined cannot be an option

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
  return (
    <Menu
      className="co-namespace-selector__menu"
      ref={menuRef}
      onSelect={(event: React.MouseEvent, itemId: string) => {
        setOpen(false);
        onSelect(event, itemId);
      }}
      onActionClick={(event, itemID: string) => {
        const isCurrentFavorite = favorites?.[itemID];
        onSetFavorite(itemID, !isCurrentFavorite);
      }}
      activeItemId={selected}
    >
      {/*
        //@ts-ignore */}
      <MenuContent>
        <Filter
          filterRef={filterRef}
          onFilterChange={setFilterText}
          filterText={filterText}
          isProject={isProjects}
        />
        <SystemSwitch
          hasSystemNamespaces={hasSystemNamespaces}
          isProject={isProjects}
          isChecked={systemNamespaces}
          onChange={setSystemNamespaces}
        />
        {filteredOptions.length === 0 ? (
          <NoResults
            isProjects={isProjects}
            onClear={(event) => {
              event.preventDefault();
              event.stopPropagation();
              setFilterText('');
              filterRef.current?.focus();
            }}
          />
        ) : null}
        <NamespaceGroup
          isFavorites
          options={filteredFavorites}
          selectedKey={selected}
          favorites={favorites}
        />
        <NamespaceGroup options={filteredOptions} selectedKey={selected} favorites={favorites} />
      </MenuContent>
      <Footer
        canCreateNew={canCreateNew}
        isProject={isProjects}
        setActiveNamespace={() => {}} //KKD: CHANGE THIS TO BEING PASSED FROM PARENT
        setOpen={setOpen}
      />
    </Menu>
  );
};

/* ******************************************************************* */

const NamespaceBarDropdown: React.FC<NamespaceBarDropdownProps> = ({
  canCreateNew,
  disabled,
  isProjects,
  onSelect,
  options,
  selected,
  shortCut,
  title,
}) => {
  const { t } = useTranslation();

  const [isOpen, setOpen] = React.useState(false);

  return (
    <div className="co-namespace-selector co-namespace-project-selector">
      <NamespaceMenuToggle
        disabled={disabled}
        menu={
          <NamespaceMenu
            setOpen={setOpen}
            onSelect={onSelect}
            selected={selected}
            isProjects={isProjects}
            options={options}
            canCreateNew={canCreateNew}
          />
        }
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
  title?: string;
  canCreateNew?: boolean;
};

export default NamespaceBarDropdown;
