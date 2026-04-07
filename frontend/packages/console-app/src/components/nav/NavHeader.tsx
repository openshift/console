import type { FC, MouseEvent, Ref } from 'react';
import { useMemo, useState, useCallback } from 'react';
import type { MenuToggleElement } from '@patternfly/react-core';
import { MenuToggle, Select, SelectList, SelectOption, Title } from '@patternfly/react-core';
import { CogsIcon } from '@patternfly/react-icons';
import { t } from 'i18next';
import type { Perspective } from '@console/dynamic-plugin-sdk';
import { useActivePerspective } from '@console/dynamic-plugin-sdk';
import { AsyncComponent } from '@console/internal/components/utils/async';
import { usePerspectives } from '@console/shared/src/hooks/usePerspectives';

export type NavHeaderProps = {
  onPerspectiveSelected: () => void;
  selected?: string;
};

type PerspectiveDropdownItemProps = {
  perspective: Perspective;
  activePerspective: string;
  onClick: (perspective: string) => void;
};

const IconLoadingComponent: FC = () => <>&emsp;</>;

const PerspectiveDropdownItem: FC<PerspectiveDropdownItemProps> = ({ perspective, onClick }) => {
  return (
    <SelectOption
      key={perspective.properties.id}
      onClick={(e: MouseEvent<HTMLLinkElement>) => {
        e.preventDefault();
        onClick(perspective.properties.id);
      }}
      icon={
        <AsyncComponent
          loader={() => perspective.properties.icon().then((m) => m.default)}
          LoadingComponent={IconLoadingComponent}
        />
      }
    >
      <Title headingLevel="h2" size="md" data-test-id="perspective-switcher-menu-option">
        {perspective.properties.name}
      </Title>
    </SelectOption>
  );
};

const NavHeader: FC<NavHeaderProps> = ({ onPerspectiveSelected }) => {
  const [activePerspective, setActivePerspective] = useActivePerspective();
  const [isPerspectiveDropdownOpen, setPerspectiveDropdownOpen] = useState(false);
  const perspectiveExtensions = usePerspectives();

  const togglePerspectiveOpen = useCallback(() => {
    setPerspectiveDropdownOpen((isOpen) => !isOpen);
  }, []);

  const onPerspectiveSelect = useCallback(
    (perspective: string): void => {
      setActivePerspective(perspective);
      setPerspectiveDropdownOpen(false);
      onPerspectiveSelected?.();
    },
    [onPerspectiveSelected, setActivePerspective],
  );

  const perspectiveDropdownItems = perspectiveExtensions.map((perspective) => (
    <PerspectiveDropdownItem
      key={perspective.uid}
      perspective={perspective}
      activePerspective={activePerspective}
      onClick={onPerspectiveSelect}
    />
  ));

  const { icon, name } = useMemo(
    () =>
      perspectiveExtensions.find((p) => p?.properties?.id === activePerspective)?.properties ??
      perspectiveExtensions[0]?.properties ?? { icon: null, name: null },
    [activePerspective, perspectiveExtensions],
  );

  return perspectiveDropdownItems.length > 1 ? (
    <div
      className="oc-nav-header"
      data-tour-id="tour-perspective-dropdown"
      data-quickstart-id="qs-perspective-switcher"
    >
      <Select
        isOpen={isPerspectiveDropdownOpen}
        data-test-id="perspective-switcher-menu"
        onOpenChange={(open) => setPerspectiveDropdownOpen(open)}
        toggle={(toggleRef: Ref<MenuToggleElement>) => (
          <MenuToggle
            isFullWidth
            data-test-id="perspective-switcher-toggle"
            isExpanded={isPerspectiveDropdownOpen}
            ref={toggleRef}
            onClick={() => togglePerspectiveOpen()}
            icon={
              icon && (
                <AsyncComponent
                  loader={() => icon().then((m) => m.default)}
                  LoadingComponent={IconLoadingComponent}
                />
              )
            }
          >
            {name && (
              <Title headingLevel="h2" size="md">
                {name}
              </Title>
            )}
          </MenuToggle>
        )}
        popperProps={{
          appendTo: () => document.querySelector("[data-test-id='perspective-switcher-toggle']"),
        }}
      >
        <SelectList>{perspectiveDropdownItems}</SelectList>
      </Select>
    </div>
  ) : (
    <div data-test-id="perspective-switcher-toggle" id="core-platform-perspective">
      <Title headingLevel="h2" size="md">
        <CogsIcon /> {t('console-app~Core platform')}
      </Title>
    </div>
  );
};

export default NavHeader;
