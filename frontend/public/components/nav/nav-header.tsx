import * as React from 'react';
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
import { useDispatch } from 'react-redux';
import { Dropdown, DropdownItem, DropdownToggle, Title } from '@patternfly/react-core';
import { CaretDownIcon } from '@patternfly/react-icons';
import { Perspective, isPerspective, useActivePerspective } from '@console/dynamic-plugin-sdk';
import { useExtensions } from '@console/plugin-sdk';
import { history } from '../utils';
import { useTelemetry } from '@console/shared/src/hooks/useTelemetry';
import { ACM_LINK_ID, useActiveCluster, useActiveNamespace } from '@console/shared';
import { formatNamespaceRoute } from '@console/internal/actions/ui';
import { detectFeatures, clearSSARFlags } from '@console/internal/actions/features';
import { K8sResourceKind, referenceForModel } from '../../module/k8s';
import { ConsoleLinkModel } from '../../models';
import { useK8sWatchResource } from '../utils/k8s-watch-hook';
import { useTranslation } from 'react-i18next';
import isMultiClusterEnabled from '@console/app/src/utils/isMultiClusterEnabled';

export type NavHeaderProps = {
  onPerspectiveSelected: () => void;
};

type PerspectiveDropdownItemProps = {
  perspective: Perspective;
  activePerspective: string;
  onClick: (perspective: Perspective) => void;
};

const PerspectiveDropdownItem: React.FC<PerspectiveDropdownItemProps> = ({
  perspective,
  activePerspective,
  onClick,
}) => {
  const LazyIcon = React.useMemo(() => React.lazy(perspective.properties.icon), [
    perspective.properties.icon,
  ]);
  return (
    <DropdownItem
      key={perspective.properties.id}
      onClick={(e: React.MouseEvent<HTMLLinkElement>) => {
        e.preventDefault();
        onClick(perspective);
      }}
      isHovered={perspective.properties.id === activePerspective}
    >
      <Title headingLevel="h2" size="md" data-test-id="perspective-switcher-menu-option">
        <span className="oc-nav-header__icon">
          <LazyIcon />
        </span>
        {perspective.properties.name}
      </Title>
    </DropdownItem>
  );
};

const ClusterIcon: React.FC<{}> = () => <span className="co-m-resource-icon">C</span>;

const NavHeader: React.FC<NavHeaderProps> = ({ onPerspectiveSelected }) => {
  const dispatch = useDispatch();
  const [activeCluster, setActiveCluster] = useActiveCluster();
  const [activeNamespace] = useActiveNamespace();
  const [activePerspective, setActivePerspective] = useActivePerspective();
  const [isClusterDropdownOpen, setClusterDropdownOpen] = React.useState(false);
  const [isPerspectiveDropdownOpen, setPerspectiveDropdownOpen] = React.useState(false);
  const perspectiveExtensions = useExtensions<Perspective>(isPerspective);
  const [consoleLinks] = useK8sWatchResource<K8sResourceKind[]>({
    isList: true,
    kind: referenceForModel(ConsoleLinkModel),
    optional: true,
  });
  const acmLink = consoleLinks.find(
    (link: K8sResourceKind) =>
      link.spec.location === 'ApplicationMenu' && link.metadata.name === ACM_LINK_ID,
  );
  const { t } = useTranslation();
  const togglePerspectiveOpen = React.useCallback(() => {
    setPerspectiveDropdownOpen((isOpen) => !isOpen);
  }, []);
  const fireTelemetryEvent = useTelemetry();

  const onClusterSelect = (event, cluster: string): void => {
    event.preventDefault();
    setClusterDropdownOpen(false);
    setActiveCluster(cluster);
    // TODO: Move this logic into `setActiveCluster`?
    dispatch(clearSSARFlags());
    dispatch(detectFeatures());
    const oldPath = window.location.pathname;
    const newPath = formatNamespaceRoute(activeNamespace, oldPath, window.location, true);
    if (newPath !== oldPath) {
      history.pushPath(newPath);
    }
  };

  const onPerspectiveSelect = React.useCallback(
    (perspective: Perspective): void => {
      if (perspective.properties.id !== activePerspective) {
        setActivePerspective(perspective.properties.id);
        // Navigate to root and let the default page determine where to go to next
        history.push('/');
        fireTelemetryEvent('Perspective Changed', {
          perspective: perspective.properties.id,
        });
      }
      setPerspectiveDropdownOpen(false);
      onPerspectiveSelected && onPerspectiveSelected();
    },
    [activePerspective, fireTelemetryEvent, onPerspectiveSelected, setActivePerspective],
  );

  const clusterItems = (window.SERVER_FLAGS.clusters ?? []).map((managedCluster: string) => (
    <DropdownItem
      key={managedCluster}
      component="button"
      onClick={(e) => onClusterSelect(e, managedCluster)}
      title={managedCluster}
    >
      <ClusterIcon />
      {managedCluster}
    </DropdownItem>
  ));

  const perspectiveItems = perspectiveExtensions.map((nextPerspective) => (
    <PerspectiveDropdownItem
      key={nextPerspective.uid}
      perspective={nextPerspective}
      activePerspective={activePerspective}
      onClick={onPerspectiveSelect}
    />
  ));

  const { icon, name } = React.useMemo(
    () => perspectiveExtensions.find((p) => p.properties.id === activePerspective).properties,
    [activePerspective, perspectiveExtensions],
  );

  const LazyIcon = React.useMemo(() => React.lazy(icon), [icon]);

  return (
    <>
      {isMultiClusterEnabled() && (
        <div className="oc-nav-header">
          <Dropdown
            isOpen={isClusterDropdownOpen}
            toggle={
              <DropdownToggle onToggle={() => setClusterDropdownOpen(!isClusterDropdownOpen)}>
                <Title headingLevel="h2" size="md">
                  <ClusterIcon />
                  {activePerspective === ACM_LINK_ID ? t('public~All Clusters') : activeCluster}
                </Title>
              </DropdownToggle>
            }
            dropdownItems={[
              ...(acmLink
                ? [
                    <DropdownItem
                      key={ACM_LINK_ID}
                      onClick={() =>
                        (window.location.href = acmLink?.spec?.href ?? window.location.href)
                      }
                    >
                      {t('public~All Clusters')}
                    </DropdownItem>,
                  ]
                : []),
              ...clusterItems,
            ]}
          />
        </div>
      )}
      <div
        className="oc-nav-header"
        data-tour-id="tour-perspective-dropdown"
        data-quickstart-id="qs-perspective-switcher"
      >
        <Dropdown
          isOpen={isPerspectiveDropdownOpen}
          toggle={
            <DropdownToggle
              isOpen={isPerspectiveDropdownOpen}
              onToggle={togglePerspectiveOpen}
              toggleIndicator={CaretDownIcon}
              data-test-id="perspective-switcher-toggle"
            >
              <Title headingLevel="h2" size="md">
                <span className="oc-nav-header__icon">{<LazyIcon />}</span>
                {name}
              </Title>
            </DropdownToggle>
          }
          dropdownItems={perspectiveItems}
          data-test-id="perspective-switcher-menu"
        />
      </div>
    </>
  );
};

export default NavHeader;
