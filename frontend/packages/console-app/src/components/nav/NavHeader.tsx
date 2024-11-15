import * as React from 'react';
import {
  MenuToggle,
  MenuToggleElement,
  Select,
  SelectList,
  SelectOption,
  Title,
} from '@patternfly/react-core';
import * as cx from 'classnames';
import { useTranslation } from 'react-i18next';
import { Perspective, useActivePerspective } from '@console/dynamic-plugin-sdk';
import { useK8sWatchResource } from '@console/dynamic-plugin-sdk/src/utils/k8s/hooks/useK8sWatchResource';
import acmIcon from '@console/internal/imgs/ACM-icon.svg';
import { ConsoleLinkModel } from '@console/internal/models';
import { K8sResourceKind, referenceForModel } from '@console/internal/module/k8s';
import { ACM_LINK_ID, usePerspectiveExtension, usePerspectives } from '@console/shared';
import { ACM_PERSPECTIVE_ID } from '../../consts';
import './NavHeader.scss';

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
  const { t } = useTranslation();
  const [activePerspective, setActivePerspective] = useActivePerspective();
  const [isPerspectiveDropdownOpen, setPerspectiveDropdownOpen] = React.useState(false);
  const perspectiveExtensions = usePerspectives();
  const acmPerspectiveExtension = usePerspectiveExtension(ACM_PERSPECTIVE_ID);
  const [consoleLinks] = useK8sWatchResource<K8sResourceKind[]>({
    isList: true,
    kind: referenceForModel(ConsoleLinkModel),
    optional: true,
  });

  const togglePerspectiveOpen = React.useCallback(() => {
    setPerspectiveDropdownOpen((isOpen) => !isOpen);
  }, []);

  const acmLink = React.useMemo(
    () =>
      consoleLinks.find(
        (link: K8sResourceKind) =>
          link.spec.location === 'ApplicationMenu' && link.metadata.name === ACM_LINK_ID,
      ),
    [consoleLinks],
  );

  const onPerspectiveSelect = React.useCallback(
    (perspective: string): void => {
      setActivePerspective(perspective);
      setPerspectiveDropdownOpen(false);
      onPerspectiveSelected?.();
    },
    [onPerspectiveSelected, setActivePerspective],
  );

  const perspectiveItems = perspectiveExtensions.reduce(
    (acc, perspective) =>
      perspective.uid === acmPerspectiveExtension?.uid
        ? acc
        : [
            ...acc,
            <PerspectiveDropdownItem
              key={perspective.uid}
              perspective={perspective}
              activePerspective={activePerspective}
              onClick={onPerspectiveSelect}
            />,
          ],
    [],
  );

  const { icon, name } = React.useMemo(
    () =>
      perspectiveExtensions.find((p) => p?.properties?.id === activePerspective)?.properties ??
      perspectiveExtensions[0]?.properties ?? { icon: null, name: null },
    [activePerspective, perspectiveExtensions],
  );

  const LazyIcon = React.useMemo(() => icon && React.lazy(icon), [icon]);
  const perspectiveDropdownItems = [
    ...perspectiveItems,
    ...(!acmPerspectiveExtension && acmLink
      ? [
          <SelectOption
            key={ACM_LINK_ID}
            onClick={() => {
              window.location.href = acmLink.spec.href;
            }}
          >
            <Title headingLevel="h2" size="md" data-test-id="perspective-switcher-menu-option">
              <span className="oc-nav-header__icon">
                <img src={acmIcon} height="12em" width="12em" alt="" />
              </span>
              {t('console-app~Advanced Cluster Management')}
            </Title>
          </SelectOption>,
        ]
      : []),
  ];

  return (
    <>
      {activePerspective !== ACM_PERSPECTIVE_ID && (
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
                onClick={() => (perspectiveItems.length === 1 ? null : togglePerspectiveOpen())}
                className={cx({
                  'oc-nav-header__menu-toggle--is-empty': perspectiveItems.length === 1,
                })}
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
              appendTo: () =>
                document.querySelector("[data-test-id='perspective-switcher-toggle']"),
            }}
          >
            <SelectList>{perspectiveDropdownItems}</SelectList>
          </Select>
        </div>
      )}
    </>
  );
};

export default NavHeader;
