import type { FC, MouseEvent, Ref } from 'react';
import { useMemo, useState, useCallback } from 'react';
import type { MenuToggleElement } from '@patternfly/react-core';
import {
  MenuToggle,
  Select,
  SelectList,
  SelectOption,
  Title,
  Skeleton,
} from '@patternfly/react-core';
import type { Perspective } from '@console/dynamic-plugin-sdk';
import { useActivePerspective } from '@console/dynamic-plugin-sdk';
import { AsyncComponent } from '@console/internal/components/utils/async';
import { useForcedPerspectiveContext } from '@console/shared/src/hooks/forcedPerspectiveContext';
import { usePerspectives } from '@console/shared/src/hooks/usePerspectives';

type NavHeaderProps = {
  onPerspectiveSelected: () => void;
  selected?: string;
};

type PerspectiveDropdownItemProps = {
  perspective: Perspective;
  activePerspective: string;
  onClick: (perspective: string) => void;
};

const IconLoadingComponent: FC = () => <>&emsp;</>;

const PerspectiveIcon: FC<{
  icon?: Perspective['properties']['icon'];
}> = ({ icon }) =>
  icon ? (
    <AsyncComponent
      loader={() => icon().then((m) => m.default)}
      LoadingComponent={IconLoadingComponent}
    />
  ) : (
    <Skeleton />
  );

const PerspectiveDropdownItem: FC<PerspectiveDropdownItemProps> = ({ perspective, onClick }) => {
  return (
    <SelectOption
      key={perspective.properties.id}
      data-test-id="perspective-switcher-menu-option"
      onClick={(e: MouseEvent<HTMLLinkElement>) => {
        e.preventDefault();
        onClick(perspective.properties.id);
      }}
      icon={<PerspectiveIcon icon={perspective.properties.icon} />}
    >
      <Title headingLevel="h2" size="md">
        {perspective.properties.name}
      </Title>
    </SelectOption>
  );
};

const NavHeader: FC<NavHeaderProps> = ({ onPerspectiveSelected }) => {
  const [activePerspective, setActivePerspective] = useActivePerspective();
  const [isPerspectiveDropdownOpen, setPerspectiveDropdownOpen] = useState(false);
  const perspectiveExtensions = usePerspectives();
  const forcedPerspective = useForcedPerspectiveContext();
  const displayedPerspective = useMemo(() => {
    const targetId = forcedPerspective.perspectiveId || activePerspective;
    return (
      perspectiveExtensions.find((p) => p?.properties?.id === targetId) ?? perspectiveExtensions[0]
    );
  }, [forcedPerspective.perspectiveId, activePerspective, perspectiveExtensions]);

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

  return perspectiveDropdownItems.length > 1 && !forcedPerspective.perspectiveId ? (
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
            icon={<PerspectiveIcon icon={icon ?? undefined} />}
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
    <div
      data-test-id="perspective-switcher-toggle"
      id={
        forcedPerspective.perspectiveId ||
        displayedPerspective?.properties?.id ||
        'core-platform-perspective'
      }
    >
      <Title headingLevel="h2" size="md">
        <PerspectiveIcon icon={displayedPerspective?.properties?.icon} />{' '}
        {displayedPerspective?.properties?.name ?? <Skeleton />}
      </Title>
    </div>
  );
};

export default NavHeader;
