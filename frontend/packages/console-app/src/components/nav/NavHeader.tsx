import * as React from 'react';
import {
  MenuToggle,
  MenuToggleElement,
  Select,
  SelectList,
  SelectOption,
  Title,
} from '@patternfly/react-core';
import { CogsIcon } from '@patternfly/react-icons/dist/esm/icons/cogs-icon';
import { t } from 'i18next';
import { Perspective, useActivePerspective } from '@console/dynamic-plugin-sdk';
import { usePerspectives } from '@console/shared/src/hooks/perspective-utils';

export type NavHeaderProps = {
  onPerspectiveSelected: () => void;
  selected?: string;
};

type PerspectiveDropdownItemProps = {
  perspective: Perspective;
  activePerspective: string;
  onClick: (perspective: string) => void;
};

const PerspectiveDropdownItem: React.FC<PerspectiveDropdownItemProps> = ({
  perspective,
  onClick,
}) => {
  const LazyIcon = React.useMemo(() => React.lazy(perspective.properties.icon), [
    perspective.properties.icon,
  ]);
  return (
    <SelectOption
      key={perspective.properties.id}
      onClick={(e: React.MouseEvent<HTMLLinkElement>) => {
        e.preventDefault();
        onClick(perspective.properties.id);
      }}
      icon={
        <React.Suspense fallback={<>&emsp;</>}>
          <LazyIcon />
        </React.Suspense>
      }
    >
      <Title headingLevel="h2" size="md" data-test-id="perspective-switcher-menu-option">
        {perspective.properties.name}
      </Title>
    </SelectOption>
  );
};

const NavHeader: React.FC<NavHeaderProps> = ({ onPerspectiveSelected }) => {
  const [activePerspective, setActivePerspective] = useActivePerspective();
  const [isPerspectiveDropdownOpen, setPerspectiveDropdownOpen] = React.useState(false);
  const perspectiveExtensions = usePerspectives();

  const togglePerspectiveOpen = React.useCallback(() => {
    setPerspectiveDropdownOpen((isOpen) => !isOpen);
  }, []);

  const onPerspectiveSelect = React.useCallback(
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

  const { icon, name } = React.useMemo(
    () =>
      perspectiveExtensions.find((p) => p?.properties?.id === activePerspective)?.properties ??
      perspectiveExtensions[0]?.properties ?? { icon: null, name: null },
    [activePerspective, perspectiveExtensions],
  );

  const LazyIcon = React.useMemo(() => icon && React.lazy(icon), [icon]);

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
        toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
          <MenuToggle
            isFullWidth
            data-test-id="perspective-switcher-toggle"
            isExpanded={isPerspectiveDropdownOpen}
            ref={toggleRef}
            onClick={() => togglePerspectiveOpen()}
            icon={<LazyIcon />}
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
