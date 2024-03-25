import * as React from 'react';
import { Menu, MenuContent, MenuItem, MenuList } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { useActivePerspective } from '@console/dynamic-plugin-sdk';
import { usePerspectiveExtension } from '@console/shared';
import { ACM_PERSPECTIVE_ID } from '../../consts';
import ClusterMenuToggle from './ClusterMenuToggle';

const ClusterGroup: React.FC<{
  clusters: ClusterMenuItem[];
}> = ({ clusters }) => {
  const [activePerspective] = useActivePerspective();

  return clusters.length === 0 ? null : (
    <MenuList>
      {clusters.map((cluster) => (
        <MenuItem
          data-test-id="cluster-dropdown-item"
          key={cluster.key}
          itemId={cluster.key}
          isSelected={
            activePerspective === ACM_PERSPECTIVE_ID
              ? cluster.key === ACM_PERSPECTIVE_ID
              : cluster.key === 'local-cluster'
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

const ClusterMenu = () => {
  const { t } = useTranslation();
  const menuRef = React.useRef(null);
  const [activePerspective, setActivePerspective] = useActivePerspective();
  const acmPerspectiveExtension = usePerspectiveExtension(ACM_PERSPECTIVE_ID);
  const [selection, setSelection] = React.useState('local-cluster');
  const [dropdownOpen, setDropdownOpen] = React.useState(false);

  const onLocalClusterClick = React.useCallback((): void => {
    setActivePerspective('admin');
    setSelection('local-cluster');
    setDropdownOpen(false);
  }, [setActivePerspective]);

  const onAllClustersClick = React.useCallback(() => {
    setActivePerspective(ACM_PERSPECTIVE_ID);
    setSelection(ACM_PERSPECTIVE_ID);
    setDropdownOpen(false);
  }, [setActivePerspective]);

  const items = React.useMemo<ClusterMenuItem[]>(
    () => [
      ...(acmPerspectiveExtension
        ? [
            {
              key: ACM_PERSPECTIVE_ID,
              title: t('console-app~All Clusters'),
              onClick: onAllClustersClick,
            },
          ]
        : []),
      {
        key: 'local-cluster',
        title: t('console-app~local-cluster'),
        onClick: () => onLocalClusterClick(),
      },
    ],
    [t, acmPerspectiveExtension, onAllClustersClick, onLocalClusterClick],
  );

  const clusterMenu: JSX.Element = (
    <Menu ref={menuRef} isScrollable activeItemId={selection} className="co-cluster-menu">
      <MenuContent maxMenuHeight="60vh">
        <ClusterGroup clusters={items} />
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
        activePerspective === ACM_PERSPECTIVE_ID ? t('console-app~All Clusters') : 'local-cluster'
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
