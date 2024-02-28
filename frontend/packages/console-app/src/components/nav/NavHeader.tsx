import * as React from 'react';
import { Title } from '@patternfly/react-core';
import {
  Dropdown as DropdownDeprecated,
  DropdownItem as DropdownItemDeprecated,
  DropdownToggle as DropdownToggleDeprecated,
} from '@patternfly/react-core/deprecated';
import { CaretDownIcon } from '@patternfly/react-icons/dist/esm/icons/caret-down-icon';
import * as cx from 'classnames';
import { useTranslation } from 'react-i18next';
import { Perspective, useActivePerspective } from '@console/dynamic-plugin-sdk';
import { useK8sWatchResource } from '@console/dynamic-plugin-sdk/src/utils/k8s/hooks/useK8sWatchResource';
import * as acmIcon from '@console/internal/imgs/ACM-icon.svg';
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
    <DropdownItemDeprecated
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
    </DropdownItemDeprecated>
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
          <DropdownItemDeprecated
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
          </DropdownItemDeprecated>,
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
          <DropdownDeprecated
            isOpen={isPerspectiveDropdownOpen}
            toggle={
              <DropdownToggleDeprecated
                className={cx({
                  'oc-nav-header__dropdown-toggle--is-empty': perspectiveItems.length === 1,
                })}
                isOpen={isPerspectiveDropdownOpen}
                onToggle={() => (perspectiveItems.length === 1 ? null : togglePerspectiveOpen())}
                toggleIndicator={perspectiveItems.length === 1 ? null : CaretDownIcon}
                data-test-id="perspective-switcher-toggle"
                icon={<LazyIcon />}
              >
                {name && (
                  <Title headingLevel="h2" size="md">
                    {name}
                  </Title>
                )}
              </DropdownToggleDeprecated>
            }
            dropdownItems={perspectiveDropdownItems}
            data-test-id="perspective-switcher-menu"
          />
        </div>
      )}
    </>
  );
};

export default NavHeader;
