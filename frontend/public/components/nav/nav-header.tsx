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
import { useActiveCluster, useActiveNamespace, ACM_LINK_ID } from '@console/shared';
import { formatNamespaceRoute } from '@console/internal/actions/ui';
import { detectFeatures, clearSSARFlags } from '@console/internal/actions/features';
import { useTranslation } from 'react-i18next';
import isMultiClusterEnabled from '@console/app/src/utils/isMultiClusterEnabled';
import { useK8sWatchResource } from '@console/dynamic-plugin-sdk/src/utils/k8s/hooks/useK8sWatchResource';
import { K8sResourceKind, referenceForModel } from '@console/internal/module/k8s';
import { ConsoleLinkModel } from '@console/internal/models';
import * as acmIcon from '../../imgs/ACM-icon.svg';

export type NavHeaderProps = {
  onPerspectiveSelected: () => void;
};

type PerspectiveDropdownItemProps = {
  perspective: Perspective;
  activePerspective: string;
  onClick: (perspective: string) => void;
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
        onClick(perspective.properties.id);
      }}
      isHovered={perspective.properties.id === activePerspective}
    >
      <Title headingLevel="h2" size="md" data-test-id="perspective-switcher-menu-option">
        <span className="oc-nav-header__icon">
          <React.Suspense fallback={<>&emsp;</>}>
            <LazyIcon />
          </React.Suspense>
        </span>
        {perspective.properties.name}
      </Title>
    </DropdownItem>
  );
};

const ClusterIcon: React.FC = () => <span className="co-m-resource-icon">C</span>;

const NavHeader: React.FC<NavHeaderProps> = ({ onPerspectiveSelected }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const fireTelemetryEvent = useTelemetry();
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
  const acmPerspectiveExtension = React.useMemo(
    () => perspectiveExtensions?.find((p) => p.properties.id === 'acm'),
    [perspectiveExtensions],
  );
  const showMultiClusterDropdown = acmPerspectiveExtension || isMultiClusterEnabled();

  const onPerspectiveSelect = React.useCallback(
    (perspective: string): void => {
      if (perspective !== activePerspective) {
        setActivePerspective(perspective);
        // Navigate to root and let the default page determine where to go to next
        history.push('/');
        fireTelemetryEvent('Perspective Changed', { perspective });
      }
      setPerspectiveDropdownOpen(false);
      onPerspectiveSelected?.();
    },
    [activePerspective, fireTelemetryEvent, onPerspectiveSelected, setActivePerspective],
  );

  const onClusterSelect = React.useCallback(
    (event, cluster: string): void => {
      event.preventDefault();
      setClusterDropdownOpen(false);
      setActiveCluster(cluster);
      // TODO: Move this logic into `setActiveCluster`?
      dispatch(clearSSARFlags());
      dispatch(detectFeatures());
      if (activePerspective === 'acm') {
        onPerspectiveSelect('admin');
      } else {
        const oldPath = window.location.pathname;
        const newPath = formatNamespaceRoute(
          activeNamespace,
          oldPath,
          window.location,
          true,
          cluster,
        );
        if (newPath !== oldPath) {
          history.pushPath(newPath);
        }
      }
    },
    [activeNamespace, activePerspective, dispatch, onPerspectiveSelect, setActiveCluster],
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
    () => perspectiveExtensions.find((p) => p.properties.id === activePerspective).properties,
    [activePerspective, perspectiveExtensions],
  );

  const LazyIcon = React.useMemo(() => React.lazy(icon), [icon]);

  return (
    <>
      {showMultiClusterDropdown && (
        <div className="oc-nav-header">
          <Dropdown
            isOpen={isClusterDropdownOpen}
            toggle={
              <DropdownToggle onToggle={() => setClusterDropdownOpen(!isClusterDropdownOpen)}>
                <Title headingLevel="h2" size="md">
                  {activePerspective === 'acm' ? (
                    t('public~All Clusters')
                  ) : (
                    <>
                      <ClusterIcon /> {activeCluster}
                    </>
                  )}
                </Title>
              </DropdownToggle>
            }
            dropdownItems={[
              ...(acmPerspectiveExtension
                ? [
                    <DropdownItem
                      key={acmPerspectiveExtension.uid}
                      onClick={() => {
                        onPerspectiveSelect(acmPerspectiveExtension.properties.id);
                        setClusterDropdownOpen(false);
                      }}
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
      {activePerspective !== 'acm' && (
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
            dropdownItems={[
              ...perspectiveItems,
              ...(!acmPerspectiveExtension && acmLink
                ? [
                    <DropdownItem
                      key={ACM_LINK_ID}
                      onClick={() => {
                        window.location.href = acmLink.spec.href;
                      }}
                      isHovered={ACM_LINK_ID === activePerspective}
                    >
                      <Title
                        headingLevel="h2"
                        size="md"
                        data-test-id="perspective-switcher-menu-option"
                      >
                        <span className="oc-nav-header__icon">
                          <img src={acmIcon} height="12em" width="12em" alt="" />
                        </span>
                        {t('public~Advanced Cluster Management')}
                      </Title>
                    </DropdownItem>,
                  ]
                : []),
            ]}
            data-test-id="perspective-switcher-menu"
          />
        </div>
      )}
    </>
  );
};

export default NavHeader;
