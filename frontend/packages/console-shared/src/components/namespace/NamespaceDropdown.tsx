/* eslint-disable @typescript-eslint/ban-ts-ignore */
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
import fuzzysearch from 'fuzzysearch';
import { useTranslation } from 'react-i18next';
import { useFlag } from '@console/dynamic-plugin-sdk';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { ProjectModel, NamespaceModel } from '@console/internal/models';
import { K8sResourceKind } from '@console/internal/module/k8s';
import {
  useUserSettingsCompatibility,
  ALL_NAMESPACES_KEY,
  NAMESPACE_USERSETTINGS_PREFIX,
  NAMESPACE_LOCAL_STORAGE_KEY,
} from '@console/shared';
import { FLAGS } from '@console/shared/src/constants';
import { isSystemNamespace } from './filters';
import NamespaceMenuToggle from './NamespaceMenuToggle';
import './NamespaceDropdown.scss';

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
          {isProjects
            ? t('console-shared~No projects found')
            : t('console-shared~No namespaces found')}
        </Title>
        <EmptyStateBody>{t('console-shared~No results match the filter criteria.')}</EmptyStateBody>
        <EmptyStatePrimary>
          <Button variant="link" onClick={onClear} className="co-namespace-selector__clear-filters">
            {t('console-shared~Clear filters')}
          </Button>
        </EmptyStatePrimary>
      </EmptyState>
    </>
  );
};

/* ****************************************** */

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
        data-test="dropdown-text-filter"
        autoFocus
        value={filterText}
        aria-label={
          isProject
            ? t('console-shared~Select project...')
            : t('console-shared~Select namespace...')
        }
        iconVariant="search"
        type="search"
        placeholder={
          isProject
            ? t('console-shared~Select project...')
            : t('console-shared~Select namespace...')
        }
        onChange={(value: string) => onFilterChange(value)}
        ref={filterRef}
      />
    </MenuInput>
  );
};

/* ****************************************** */

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
          data-test="showSystemSwitch"
          data-checked-state={isChecked}
          label={
            isProject
              ? t('console-shared~Show default projects')
              : t('console-shared~Show default namespaces')
          }
          isChecked={isChecked}
          onChange={onChange}
          className="pf-c-select__menu-item pf-m-action co-namespace-dropdown__switch"
        />
      </MenuInput>
    </>
  ) : null;
};

/* ****************************************** */

const NamespaceGroup: React.FC<{
  isFavorites?: boolean;
  options: { key: string; title: string }[];
  selectedKey: string;
  favorites: { [key: string]: boolean }[];
}> = ({ isFavorites, options, selectedKey, favorites }) => {
  const { t } = useTranslation();
  const label = isFavorites ? t('console-shared~Favorites') : t('console-shared~Projects');

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
                isFavorited={!!favorites?.[option.key]}
                isSelected={selectedKey === option.key}
                data-test="dropdown-menu-item-link"
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

/* ****************************************** */

// The items in the footer are not accessible via the keyboard.
// This is being tracked in: https://github.com/patternfly/patternfly-react/issues/6031

const Footer: React.FC<{
  canCreateNew: boolean;
  isProject?: boolean;
  setOpen: (isOpen: boolean) => void;
  onCreateNew: () => void;
}> = ({ canCreateNew, isProject, setOpen, onCreateNew }) => {
  const { t } = useTranslation();
  return (
    <>
      {canCreateNew ? (
        <MenuFooter className="co-namespace-dropdown__footer">
          {
            <Button
              variant="secondary"
              onClick={() => {
                setOpen(false);
                onCreateNew();
              }}
              data-test-dropdown-menu="#CREATE_RESOURCE_ACTION#"
            >
              {isProject
                ? t('console-shared~Create Project')
                : t('console-shared~Create Namespace')}
            </Button>
          }
        </MenuFooter>
      ) : null}
    </>
  );
};

/* ****************************************** */

const NamespaceMenu: React.FC<{
  setOpen: (isOpen: boolean) => void;
  onSelect: (event: React.MouseEvent, itemId: string) => void;
  selected?: string;
  isProjects: boolean;
  allNamespacesTitle: string;
  onCreateNew: () => void;
  menuRef: React.MutableRefObject<HTMLDivElement>;
}> = ({ setOpen, onSelect, selected, isProjects, allNamespacesTitle, onCreateNew, menuRef }) => {
  // const menuRef = React.useRef(null);
  const filterRef = React.useRef(null);

  const [filterText, setFilterText] = React.useState('');

  // Bookmarking / favorites (note in <= 4.8 this feature was known as bookmarking)
  const favoritesUserSettingsKey = `${NAMESPACE_USERSETTINGS_PREFIX}.bookmarks`;
  const systemNamespacesSettingsKey = `${NAMESPACE_USERSETTINGS_PREFIX}.systemNamespace`;
  const favoriteStorageKey = `${NAMESPACE_LOCAL_STORAGE_KEY}-bookmarks`;
  const systemNamespaceKey = `${NAMESPACE_LOCAL_STORAGE_KEY}-systemNamespace`;
  const [favorites, setFavorites] = useUserSettingsCompatibility(
    favoritesUserSettingsKey,
    favoriteStorageKey,
    undefined,
    true,
  );

  const canList: boolean = useFlag(FLAGS.CAN_LIST_NS);
  const canCreate: boolean = useFlag(FLAGS.CAN_CREATE_PROJECT);
  const [options, optionsLoaded] = useK8sWatchResource<K8sResourceKind[]>({
    isList: true,
    kind: isProjects ? ProjectModel.kind : NamespaceModel.kind,
    optional: true,
  });

  const optionItems = React.useMemo(() => {
    if (!optionsLoaded) {
      return [];
    }
    const items = options.map((item) => {
      const { name } = item.metadata;
      return { title: name, key: name };
    });
    if (!items.some((option) => option.title === selected) && selected !== ALL_NAMESPACES_KEY) {
      items.push({ title: selected, key: selected }); // Add current namespace if it isn't included
    }
    items.sort((a, b) => a.title.localeCompare(b.title));

    if (canList) {
      items.unshift({ title: allNamespacesTitle, key: ALL_NAMESPACES_KEY });
    }
    return items;
  }, [allNamespacesTitle, canList, options, optionsLoaded, selected]);

  const hasSystemNamespaces = React.useMemo(
    () => optionItems.some((option) => isSystemNamespace(option)),
    [optionItems],
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

  const isFavorite = React.useCallback((option) => !!favorites?.[option.key], [favorites]);

  const isOptionShown = React.useCallback(
    (option, checkIsFavorite: boolean) => {
      const containsFilterText = fuzzysearch(filterText.toLowerCase(), option.title.toLowerCase());

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
      optionItems.reduce(
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
    [isOptionShown, optionItems],
  );

  return (
    <Menu
      className="co-namespace-dropdown__menu"
      ref={menuRef}
      onSelect={(event: React.MouseEvent, itemId: string) => {
        setOpen(false);
        onSelect(event, itemId);
      }}
      onActionClick={(event: React.MouseEvent, itemID: string) => {
        const isCurrentFavorite = favorites?.[itemID];
        onSetFavorite(itemID, !isCurrentFavorite);
      }}
      activeItemId={selected}
      data-test="namespace-dropdown-menu"
    >
      {/*
        //@ts-ignore */}
      <MenuContent menuHeight="60vh">
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
        canCreateNew={canCreate}
        isProject={isProjects}
        onCreateNew={onCreateNew}
        setOpen={setOpen}
      />
    </Menu>
  );
};

/* ****************************************** */

const NamespaceDropdown: React.FC<NamespaceDropdownProps> = ({
  disabled,
  isProjects,
  onSelect,
  selected,
  onCreateNew,
  shortCut,
}) => {
  const { t } = useTranslation();
  const menuRef = React.useRef(null);
  const [isOpen, setOpen] = React.useState(false);
  const allNamespacesTitle = isProjects
    ? t('console-shared~All Projects')
    : t('console-shared~All Namespaces');

  const title = selected === ALL_NAMESPACES_KEY ? allNamespacesTitle : selected;

  const NamespaceMenuProps = {
    setOpen,
    onSelect,
    selected,
    isProjects,
    allNamespacesTitle,
    onCreateNew,
    menuRef,
  };

  return (
    <div className="co-namespace-dropdown">
      <NamespaceMenuToggle
        disabled={disabled}
        menu={<NamespaceMenu {...NamespaceMenuProps} />}
        menuRef={menuRef}
        isOpen={isOpen}
        title={`${
          isProjects ? t('console-shared~Project') : t('console-shared~Namespace')
        }: ${title}`}
        onToggle={(menuState) => {
          setOpen(menuState);
        }}
        shortCut={shortCut}
      />
    </div>
  );
};

type NamespaceDropdownProps = {
  disabled?: boolean;
  isProjects?: boolean; // Does this drop down contain projects.  If not, assuming namespaces
  onSelect?: (event: React.MouseEvent | React.ChangeEvent, value: string) => void;
  onCreateNew?: () => void;
  shortCut?: string;
  selected?: string;
};

export default NamespaceDropdown;
