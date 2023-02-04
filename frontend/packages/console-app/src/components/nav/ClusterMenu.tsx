import * as React from 'react';
import {
  Button,
  Divider,
  EmptyState,
  EmptyStateBody,
  EmptyStateSecondaryActions,
  Menu,
  MenuContent,
  MenuGroup,
  MenuInput,
  MenuItem,
  MenuList,
  TextInput,
  Title,
} from '@patternfly/react-core';
import fuzzysearch from 'fuzzysearch';
import { useTranslation } from 'react-i18next';
import { useActivePerspective } from '@console/dynamic-plugin-sdk';
import {
  alphanumericCompare,
  HUB_CLUSTER_NAME,
  useActiveCluster,
  usePerspectiveExtension,
} from '@console/shared';
import { ACM_PERSPECTIVE_ID } from '../../consts';
import ClusterMenuToggle from './ClusterMenuToggle';

const ClusterCIcon: React.FC = () => <span className="co-m-resource-icon">C</span>;

const NoResults: React.FC<{
  onClear: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
}> = ({ onClear }) => {
  const { t } = useTranslation();
  return (
    <EmptyState>
      <Title size="md" headingLevel="h4">
        {t('console-app~No cluster found')}
      </Title>
      <EmptyStateBody>{t('console-app~No results match the filter criteria.')}</EmptyStateBody>
      <EmptyStateSecondaryActions>
        <Button variant="link" onClick={onClear}>
          {t('console-app~Clear filter')}
        </Button>
      </EmptyStateSecondaryActions>
    </EmptyState>
  );
};

const ClusterFilter: React.FC<{
  filterRef: React.Ref<any>;
  onFilterChange: (filterText: string) => void;
  filterText: string;
}> = ({ filterText, filterRef, onFilterChange }) => {
  const { t } = useTranslation();
  return (
    <MenuInput translate="no">
      <TextInput
        autoFocus
        placeholder={t('console-app~Find a cluster...')}
        aria-label={t('console-app~Find a cluster...')}
        iconVariant="search"
        type="search"
        value={filterText}
        onChange={onFilterChange}
        ref={filterRef}
      />
    </MenuInput>
  );
};

const ClusterGroup: React.FC<{
  clusters: ClusterMenuItem[];
}> = ({ clusters }) => {
  const [activeCluster] = useActiveCluster();

  return clusters.length === 0 ? null : (
    <MenuGroup translate="no" label="Clusters">
      <MenuList>
        {clusters.map((cluster) => (
          <MenuItem
            translate="no"
            data-test-id="cluster-dropdown-item"
            key={cluster.key}
            itemId={cluster.key}
            isSelected={activeCluster === cluster.key}
            onClick={(e) => {
              e.preventDefault();
              cluster.onClick();
            }}
          >
            {cluster.showIcon && <ClusterCIcon />}
            {cluster.title}
          </MenuItem>
        ))}
      </MenuList>
    </MenuGroup>
  );
};

const ClusterMenu = () => {
  const { t } = useTranslation();
  const [filterText, setFilterText] = React.useState('');
  const filterRef = React.useRef(null);
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
      ...window.SERVER_FLAGS.clusters
        .sort((a, b) => {
          if (a === HUB_CLUSTER_NAME) {
            return -1;
          }
          if (b === HUB_CLUSTER_NAME) {
            return 1;
          }
          return alphanumericCompare(a, b);
        })
        .map((cluster) => ({
          key: cluster,
          title: cluster,
          showIcon: true,
          onClick: () => onClusterClick(cluster),
        })),
    ],
    [acmPerspectiveExtension, onAllClustersClick, onClusterClick],
  );

  const isOptionShown = React.useCallback(
    (option: ClusterMenuItem): boolean =>
      fuzzysearch(filterText.toLowerCase(), option.title.toLowerCase()),
    [filterText],
  );

  const filteredOptions = React.useMemo(() => optionItems.filter(isOptionShown), [
    isOptionShown,
    optionItems,
  ]);

  const emptyState: JSX.Element =
    filteredOptions.length === 0 ? (
      <NoResults
        onClear={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setFilterText('');
          filterRef.current?.focus();
        }}
      />
    ) : null;

  const clusterMenu: JSX.Element = (
    <Menu ref={menuRef} isScrollable activeItemId={activeCluster} className="co-cluster-menu">
      <MenuContent maxMenuHeight="60vh" translate="no">
        <ClusterFilter
          filterText={filterText}
          filterRef={filterRef}
          onFilterChange={setFilterText}
        />
        <Divider />
        {emptyState}
        <ClusterGroup clusters={filteredOptions} />
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
        `${activePerspective}` === ACM_PERSPECTIVE_ID ? (
          t('console-app~All Clusters')
        ) : (
          <>
            <ClusterCIcon /> {activeCluster}
          </>
        )
      }
    />
  );
};

type ClusterMenuItem = {
  key: string;
  title: string;
  showIcon?: boolean;
  onClick: () => void;
};

export default ClusterMenu;
