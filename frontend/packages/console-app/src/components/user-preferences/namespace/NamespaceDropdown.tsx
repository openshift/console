import * as React from 'react';
import {
  Skeleton,
  EmptyState,
  EmptyStateIcon,
  Title,
  EmptyStateBody,
  Divider,
  Menu,
  MenuItem,
  MenuContent,
  MenuList,
} from '@patternfly/react-core';
import { ExclamationCircleIcon } from '@patternfly/react-icons';
import fuzzysearch from 'fuzzysearch';
import { useTranslation } from 'react-i18next';
import { createProjectModal } from '@console/internal/components/modals';
import { useProjectOrNamespaceModel } from '@console/internal/components/utils';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { ProjectModel } from '@console/internal/models';
import { K8sKind, K8sResourceKind } from '@console/internal/module/k8s';
import {
  Filter,
  Footer,
  NamespaceGroup,
  NoResults,
} from '@console/shared/src/components/namespace/NamespaceDropdown';
import NamespaceMenuToggle from '@console/shared/src/components/namespace/NamespaceMenuToggle';
import { usePreferredNamespace } from './usePreferredNamespace';
import './NamespaceDropdown.scss';

type OptionItem = {
  title: string;
  key: string;
};

const NamespaceDropdown: React.FC = () => {
  const { t } = useTranslation();
  const [model, canCreate] = useProjectOrNamespaceModel() as [K8sKind, boolean];
  const isProject: boolean = model?.kind === ProjectModel.kind;
  const [options, optionsLoaded, optionsLoadError] = useK8sWatchResource<K8sResourceKind[]>({
    kind: model?.kind,
    isList: true,
    optional: true,
  });
  const [
    preferredNamespace,
    setPreferredNamespace,
    preferredNamespaceLoaded,
  ] = usePreferredNamespace();

  const [dropdownOpen, setDropdownOpen] = React.useState(false);
  const [filterText, setFilterText] = React.useState('');
  const menuRef = React.useRef(null);
  const filterRef = React.useRef(null);

  const optionItems: OptionItem[] = React.useMemo(() => {
    if (!optionsLoaded) {
      return [];
    }
    const items: OptionItem[] = options.map((item) => {
      const { name } = item.metadata;
      return { title: name, key: name };
    });
    items.sort((a, b) => a.title.localeCompare(b.title));
    return items;
  }, [options, optionsLoaded]);

  const loaded: boolean = model && preferredNamespaceLoaded && optionsLoaded;

  const filteredOptions: OptionItem[] = React.useMemo(() => {
    const lowerCaseFilterText = filterText.toLowerCase();
    return optionItems.filter((option: OptionItem) =>
      fuzzysearch(lowerCaseFilterText, option.title.toLowerCase()),
    );
  }, [optionItems, filterText]);

  const lastViewedOption: OptionItem = {
    title: t('console-app~Last viewed'),
    key: '##lastViewed##',
  };

  const onCreateNamespace = React.useCallback(
    () =>
      createProjectModal({
        blocking: true,
        onSubmit: (newProject) => {
          setPreferredNamespace(newProject.metadata.name);
        },
      }),
    [setPreferredNamespace],
  );

  const loadErrorDescription: string = isProject
    ? t('console-app~Projects failed to load. Check your connection and reload the page.')
    : t('console-app~Namespaces failed to load. Check your connection and reload the page.');
  const loadErrorState: JSX.Element = optionsLoadError ? (
    <EmptyState data-test={'dropdown console.preferredNamespace error'}>
      <EmptyStateIcon icon={ExclamationCircleIcon} />
      <Title size="md" headingLevel="h4">
        {t('console-app~Unable to load')}
      </Title>
      <EmptyStateBody>{loadErrorDescription}</EmptyStateBody>
    </EmptyState>
  ) : null;

  const emptyState: JSX.Element =
    !optionsLoadError && filteredOptions.length === 0 ? (
      <NoResults
        isProjects={isProject}
        onClear={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setFilterText('');
          filterRef.current?.focus();
        }}
      />
    ) : null;

  const getDropdownLabelForValue = (): string => preferredNamespace || lastViewedOption.title;
  const getDropdownValueForLabel = (selectedLabel: string): string =>
    selectedLabel === lastViewedOption.key ? null : selectedLabel;
  const onToggle = (isOpen: boolean) => setDropdownOpen(isOpen);
  const onSelect = (_, selection: string) => {
    const selectedValue = getDropdownValueForLabel(selection);
    selectedValue !== preferredNamespace && setPreferredNamespace(selectedValue);
    setDropdownOpen(false);
  };

  const selected = getDropdownLabelForValue();

  const lastNamespaceOption: JSX.Element = (
    <MenuList className="co-user-preference__namespace-menu__last-viewed">
      <Divider component="li" key={'divider'} />
      <MenuItem
        key={lastViewedOption.key}
        itemId={lastViewedOption.key}
        isSelected={selected === lastViewedOption.key}
        data-test="dropdown-menu-item-lastViewed"
        translate="no"
      >
        {lastViewedOption.title}
      </MenuItem>
    </MenuList>
  );

  const namespaceMenu: JSX.Element = (
    <Menu
      className="co-namespace-dropdown__menu"
      ref={menuRef}
      onSelect={onSelect}
      activeItemId={selected}
      data-test="dropdown menu console.preferredNamespace"
      onActionClick={() => {}}
      isScrollable
    >
      <MenuContent menuHeight="40vh" maxMenuHeight="40vh" translate="no">
        <Filter
          filterRef={filterRef}
          onFilterChange={setFilterText}
          filterText={filterText}
          isProject={isProject}
        />
        {lastNamespaceOption}
        {loadErrorState || emptyState}
        <NamespaceGroup options={filteredOptions} selectedKey={selected} canFavorite={false} />
      </MenuContent>
      <Footer
        canCreateNew={canCreate}
        isProject={isProject}
        onCreateNew={onCreateNamespace}
        setOpen={setDropdownOpen}
      />
    </Menu>
  );

  return loaded ? (
    <NamespaceMenuToggle
      disabled={false}
      menu={namespaceMenu}
      menuRef={menuRef}
      isOpen={dropdownOpen}
      title={selected}
      onToggle={onToggle}
      data-test={'dropdown console.preferredNamespace'}
      className="co-user-preference__namespace-menu-toggle"
    />
  ) : (
    <Skeleton
      height="30px"
      width="100%"
      data-test={'dropdown skeleton console.preferredNamespace'}
    />
  );
};

export default NamespaceDropdown;
