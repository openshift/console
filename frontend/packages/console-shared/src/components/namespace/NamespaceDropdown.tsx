import {
  FC,
  useMemo,
  useState,
  MouseEvent as ReactMouseEvent,
  Ref,
  MutableRefObject,
  useRef,
  useCallback,
  ChangeEvent,
} from 'react';
import {
  Button,
  Divider,
  EmptyState,
  EmptyStateBody,
  Menu,
  MenuContent,
  MenuFooter,
  MenuGroup,
  MenuSearch,
  MenuSearchInput,
  MenuItem,
  MenuList,
  Switch,
  TextInput,
  EmptyStateActions,
  EmptyStateFooter,
} from '@patternfly/react-core';
import fuzzysearch from 'fuzzysearch';
import { useTranslation } from 'react-i18next';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { ProjectModel, NamespaceModel } from '@console/internal/models';
import { K8sResourceKind } from '@console/internal/module/k8s';
import {
  ALL_NAMESPACES_KEY,
  NAMESPACE_USERSETTINGS_PREFIX,
  NAMESPACE_LOCAL_STORAGE_KEY,
  FLAGS,
} from '@console/shared/src/constants';
import { useFlag } from '@console/shared/src/hooks/flag';
import { useUserSettingsCompatibility } from '@console/shared/src/hooks/useUserSettingsCompatibility';
import { alphanumericCompare } from '@console/shared/src/utils';
import { isSystemNamespace } from './filters';
import NamespaceMenuToggle from './NamespaceMenuToggle';
import './NamespaceDropdown.scss';

export const NoResults: FC<{
  isProjects: boolean;
  onClear: (event: ReactMouseEvent<HTMLButtonElement, MouseEvent>) => void;
}> = ({ isProjects, onClear }) => {
  const { t } = useTranslation();
  return (
    <>
      <Divider />
      <EmptyState
        headingLevel="h4"
        titleText={
          <>
            {isProjects
              ? t('console-shared~No projects found')
              : t('console-shared~No namespaces found')}
          </>
        }
      >
        <EmptyStateBody>{t('console-shared~No results match the filter criteria.')}</EmptyStateBody>
        <EmptyStateFooter>
          <EmptyStateActions>
            <Button
              variant="link"
              onClick={onClear}
              className="co-namespace-selector__clear-filters"
            >
              {t('console-shared~Clear filters')}
            </Button>
          </EmptyStateActions>
        </EmptyStateFooter>
      </EmptyState>
    </>
  );
};

/* ****************************************** */

export const Filter: FC<{
  filterRef: Ref<any>;
  onFilterChange: (filterText: string) => void;
  filterText: string;
  isProject: boolean;
}> = ({ filterText, filterRef, onFilterChange, isProject }) => {
  const { t } = useTranslation();
  return (
    <MenuSearch>
      <MenuSearchInput>
        <TextInput
          data-test="dropdown-text-filter"
          autoFocus
          value={filterText}
          aria-label={
            isProject
              ? t('console-shared~Select project...')
              : t('console-shared~Select namespace...')
          }
          type="search"
          placeholder={
            isProject
              ? t('console-shared~Select project...')
              : t('console-shared~Select namespace...')
          }
          onChange={(_, value: string) => onFilterChange(value)}
          ref={filterRef}
        />
      </MenuSearchInput>
    </MenuSearch>
  );
};

/* ****************************************** */

const SystemSwitch: FC<{
  hasSystemNamespaces: boolean;
  isProject: boolean;
  isChecked: boolean;
  onChange: (isChecked: boolean) => void;
}> = ({ hasSystemNamespaces, isProject, isChecked, onChange }) => {
  const { t } = useTranslation();
  return hasSystemNamespaces ? (
    <>
      <Divider />
      <MenuSearch>
        <MenuSearchInput>
          <Switch
            data-test="showSystemSwitch"
            data-checked-state={isChecked}
            label={
              isProject
                ? t('console-shared~Show default projects')
                : t('console-shared~Show default namespaces')
            }
            isChecked={isChecked}
            onChange={(_, value) => onChange(value)}
            className="pf-v6-c-select__menu-item pf-m-action"
            isReversed
          />
        </MenuSearchInput>
      </MenuSearch>
    </>
  ) : null;
};

/* ****************************************** */

export const NamespaceGroup: FC<{
  isProjects: boolean;
  isFavorites?: boolean;
  options: { key: string; title: string }[];
  selectedKey: string;
  favorites?: { [key: string]: boolean }[];
  canFavorite?: boolean;
}> = ({ isProjects, isFavorites, options, selectedKey, favorites, canFavorite = true }) => {
  const { t } = useTranslation();
  let label = isProjects ? t('console-shared~Projects') : t('console-shared~Namespaces');
  if (isFavorites) {
    label = t('console-shared~Favorites');
  }

  return options.length === 0 ? null : (
    <>
      <Divider />
      <MenuGroup label={label}>
        <MenuList>
          {options.map((option) => {
            return (
              <MenuItem
                key={option.key}
                itemId={option.key}
                isFavorited={canFavorite ? !!favorites?.[option.key] : undefined}
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

export const Footer: FC<{
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

const NamespaceMenu: FC<{
  setOpen: (isOpen: boolean) => void;
  onSelect: (event: ReactMouseEvent, itemId: string) => void;
  selected?: string;
  isProjects: boolean;
  allNamespacesTitle: string;
  onCreateNew: () => void;
  menuRef: MutableRefObject<HTMLDivElement>;
}> = ({ setOpen, onSelect, selected, isProjects, allNamespacesTitle, onCreateNew, menuRef }) => {
  const filterRef = useRef(null);

  const [filterText, setFilterText] = useState('');

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
  const canCreate: boolean = useFlag(isProjects ? FLAGS.CAN_CREATE_PROJECT : FLAGS.CAN_CREATE_NS);
  const [options, optionsLoaded] = useK8sWatchResource<K8sResourceKind[]>({
    isList: true,
    kind: isProjects ? ProjectModel.kind : NamespaceModel.kind,
    optional: true,
  });

  const optionItems = useMemo(() => {
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
    items.sort((a, b) => alphanumericCompare(a.title, b.title));

    if (canList) {
      items.unshift({ title: allNamespacesTitle, key: ALL_NAMESPACES_KEY });
    }
    return items;
  }, [allNamespacesTitle, canList, options, optionsLoaded, selected]);

  const hasSystemNamespaces = useMemo(
    () => optionItems.some((option) => isSystemNamespace(option)),
    [optionItems],
  );

  const onSetFavorite = useCallback(
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

  const isFavorite = useCallback((option) => !!favorites?.[option.key], [favorites]);

  const isOptionShown = useCallback(
    (option, checkIsFavorite: boolean) => {
      const containsFilterText = fuzzysearch(filterText.toLowerCase(), option.title.toLowerCase());

      if (checkIsFavorite) {
        return containsFilterText && isFavorite(option);
      }
      return (
        containsFilterText &&
        (systemNamespaces || !isSystemNamespace(option)) &&
        (!checkIsFavorite || isFavorite(option))
      );
    },
    [filterText, isFavorite, systemNamespaces],
  );

  const { filteredOptions, filteredFavorites } = useMemo(
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
      onSelect={(event: ReactMouseEvent, itemId: string) => {
        setOpen(false);
        onSelect(event, itemId);
      }}
      onActionClick={(event: ReactMouseEvent, itemID: string) => {
        const isCurrentFavorite = favorites?.[itemID];
        onSetFavorite(itemID, !isCurrentFavorite);
      }}
      activeItemId={selected}
      data-test="namespace-dropdown-menu"
      isScrollable
    >
      <MenuContent maxMenuHeight="60vh" className="co-namespace-dropdown__menu-content">
        <Filter
          filterRef={filterRef}
          onFilterChange={setFilterText}
          filterText={filterText}
          isProject={isProjects}
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
          isProjects={isProjects}
          isFavorites
          options={filteredFavorites}
          selectedKey={selected}
          favorites={favorites}
        />
        <SystemSwitch
          hasSystemNamespaces={hasSystemNamespaces}
          isProject={isProjects}
          isChecked={systemNamespaces}
          onChange={setSystemNamespaces}
        />
        <NamespaceGroup
          isProjects={isProjects}
          options={filteredOptions}
          selectedKey={selected}
          favorites={favorites}
        />
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

export const NamespaceDropdown: FC<NamespaceDropdownProps> = ({
  disabled,
  isProjects,
  onSelect,
  selected,
  onCreateNew,
  shortCut,
}) => {
  const { t } = useTranslation();
  const menuRef = useRef(null);
  const [isOpen, setOpen] = useState(false);
  const allNamespacesTitle = isProjects
    ? t('console-shared~All Projects')
    : t('console-shared~All Namespaces');

  const title = selected === ALL_NAMESPACES_KEY ? allNamespacesTitle : selected;

  const menuProps = {
    setOpen,
    onSelect,
    selected,
    isProjects,
    allNamespacesTitle,
    onCreateNew,
    menuRef,
    children: <></>,
  };

  return (
    <div className="co-namespace-dropdown">
      <NamespaceMenuToggle
        disabled={disabled}
        menu={<NamespaceMenu {...menuProps} />}
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
  onSelect?: (event: ReactMouseEvent | ChangeEvent, value: string) => void;
  onCreateNew?: () => void;
  shortCut?: string;
  selected?: string;
};
