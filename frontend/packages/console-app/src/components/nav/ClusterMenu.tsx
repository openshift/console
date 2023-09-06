import * as React from 'react';
import { Menu, MenuContent, MenuItem, MenuList } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { useActivePerspective } from '@console/dynamic-plugin-sdk';
import { useActiveCluster, usePerspectiveExtension } from '@console/shared';
import { ACM_PERSPECTIVE_ID } from '../../consts';
import ClusterMenuToggle from './ClusterMenuToggle';

const ClusterGroup: React.FC<{
  clusters: ClusterMenuItem[];
}> = ({ clusters }) => {
  const [activeCluster] = useActiveCluster();
  const [activePerspective] = useActivePerspective();

  return clusters.length === 0 ? null : (
    <MenuList>
      {clusters.map((cluster) => (
        <MenuItem
          translate="no"
          data-test-id="cluster-dropdown-item"
          key={cluster.key}
          itemId={cluster.key}
          isSelected={
            activePerspective === ACM_PERSPECTIVE_ID
              ? cluster.key === ACM_PERSPECTIVE_ID
              : cluster.key === activeCluster
          }
          onClick={(e) => {
            e.preventDefault();
            cluster.onClick();
          }}
        >
          {cluster.title}
        </MenuItem>
      ))}
    </MenuList>
  );
};

// TODO remove multicluster
const ClusterMenu = () => {
  const { t } = useTranslation();
  const menuRef = React.useRef(null);
  const [activePerspective, setActivePerspective] = useActivePerspective();
  const acmPerspectiveExtension = usePerspectiveExtension(ACM_PERSPECTIVE_ID);
  const [activeCluster, setActiveCluster] = useActiveCluster();
  const [dropdownOpen, setDropdownOpen] = React.useState(false);

  const onClusterClick = React.useCallback(
    (cluster: string): void => {
      setActiveCluster(cluster);
      setDropdownOpen(false);
    },
    [setActiveCluster],
  );

  const onAllClustersClick = React.useCallback(() => {
    setActivePerspective(ACM_PERSPECTIVE_ID);
    setDropdownOpen(false);
  }, [setActivePerspective]);

  const optionItems = React.useMemo<ClusterMenuItem[]>(
    () => [
      ...(acmPerspectiveExtension
        ? [
            {
              key: ACM_PERSPECTIVE_ID,
              title: 'All Clusters',
              onClick: onAllClustersClick,
            },
          ]
        : []),
      {
        key: 'local-cluster',
        title: 'local-cluster',
        onClick: () => onClusterClick('local-cluster'),
      },
    ],
    [acmPerspectiveExtension, onAllClustersClick, onClusterClick],
  );

  const clusterMenu: JSX.Element = (
    <Menu ref={menuRef} isScrollable activeItemId={activeCluster} className="co-cluster-menu">
      <MenuContent maxMenuHeight="60vh" translate="no">
        <ClusterGroup clusters={optionItems} />
      </MenuContent>
    </Menu>
  );

  return (
    <ClusterMenuToggle
      disabled={false}
      menu={clusterMenu}
      menuRef={menuRef}
      isOpen={dropdownOpen}
      onToggle={setDropdownOpen}
      title={
        `${activePerspective}` === ACM_PERSPECTIVE_ID
          ? t('console-app~All Clusters')
          : activeCluster
      }
    />
  );
};

type ClusterMenuItem = {
  key: string;
  title: string;
  onClick: () => void;
};

export default ClusterMenu;
