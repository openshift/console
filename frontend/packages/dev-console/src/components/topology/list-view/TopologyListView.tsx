import * as React from 'react';
import * as classNames from 'classnames';
import { DataList } from '@patternfly/react-core';
import { isGraph, Node, isNode, Visualization, GraphElement } from '@patternfly/react-topology';
import { useDeepCompareMemoize } from '@console/shared/src';
import { setQueryArgument, removeQueryArgument } from '@console/internal/components/utils';
import { TYPE_APPLICATION_GROUP } from '../components';
import { getTopologySearchQuery, TOPOLOGY_SEARCH_FILTER_KEY } from '../filters';
import { TopologyListViewAppGroup } from './TopologyListViewAppGroup';
import { getChildKinds, sortGroupChildren } from './list-view-utils';
import { TopologyListViewUnassignedGroup } from './TopologyListViewUnassignedGroup';

import './TopologyListView.scss';

export const FILTER_ACTIVE_CLASS = 'odc-m-filter-active';

interface TopologyListViewProps {
  visualization: Visualization;
  application: string;
  namespace: string;
  selectedIds: string[];
  onSelect: (ids: string[]) => void;
}

const TopologyListView: React.FC<TopologyListViewProps> = ({
  visualization,
  selectedIds,
  onSelect,
}) => {
  const searchParams = window.location.search;
  const selectedId = selectedIds[0];
  const [searchClass, setSearchClass] = React.useState<string>(
    getTopologySearchQuery() ? 'is-list-view-filtered' : '',
  );
  const [applicationGroups, setApplicationGroups] = React.useState<Node[]>();
  const [unassignedItems, setUnassignedItems] = React.useState<Node[]>();

  const nodes = useDeepCompareMemoize(
    visualization.getElements().filter((e) => isNode(e)) as Node[],
  );

  React.useEffect(() => {
    const appGroups = nodes.filter((n) => n.getType() === TYPE_APPLICATION_GROUP);
    appGroups.sort((a, b) => a.getLabel().localeCompare(b.getLabel()));
    const items = nodes.filter(
      (n) => n.getType() !== TYPE_APPLICATION_GROUP && isGraph(n.getParent()),
    );
    setApplicationGroups(appGroups);
    setUnassignedItems(items);
  }, [nodes]);

  React.useEffect(() => {
    if (selectedId) {
      const element = document.getElementById(selectedId);
      if (element) {
        element.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedId]);

  const onSearchChange = (searchQuery) => {
    if (searchQuery.length > 0) {
      setQueryArgument(TOPOLOGY_SEARCH_FILTER_KEY, searchQuery);
      document.body.classList.add(FILTER_ACTIVE_CLASS);
    } else {
      removeQueryArgument(TOPOLOGY_SEARCH_FILTER_KEY);
      document.body.classList.remove(FILTER_ACTIVE_CLASS);
    }
  };

  React.useEffect(() => {
    const searchQuery = getTopologySearchQuery();
    searchQuery && onSearchChange(searchQuery);
    setSearchClass(searchQuery ? 'is-list-view-filtered' : '');
  }, [searchParams]);

  React.useEffect(() => {
    const getFlattenedItems = (): Node[] => {
      const flattened = [];
      const addFlattenedNode = (node: Node) => {
        if (node) {
          flattened.push(node);
          const childNodes = sortGroupChildren(node.getChildren());
          childNodes.forEach((child) => {
            if (isNode(child)) {
              addFlattenedNode(child);
            }
          });
        }
      };

      const addFlattenedKinds = (children: GraphElement[]) => {
        const { kindsMap, kindKeys } = getChildKinds(children);
        kindKeys.forEach((key) => {
          kindsMap[key]
            .sort((a, b) => a.getLabel().localeCompare(b.getLabel()))
            .forEach((child) => {
              addFlattenedNode(child);
            });
        });
      };

      applicationGroups.forEach((appGroup) => {
        flattened.push(appGroup);
        addFlattenedKinds(appGroup.getChildren());
      });
      addFlattenedKinds(unassignedItems);
      return flattened;
    };

    const selectPrevious = () => {
      const flattenedItems = getFlattenedItems();
      const index = flattenedItems.findIndex((item) => selectedId === item.getId());
      if (index > 0) {
        onSelect([flattenedItems[index - 1].getId()]);
      }
    };

    const selectNext = () => {
      const flattenedItems = getFlattenedItems();
      const index = flattenedItems.findIndex((item) => selectedId === item.getId());
      if (index < flattenedItems.length - 1) {
        onSelect([flattenedItems[index + 1].getId()]);
      }
    };

    const stopEvent = (e: KeyboardEvent) => {
      document.activeElement instanceof HTMLElement && document.activeElement.blur();
      e.stopPropagation();
      e.preventDefault();
    };

    const onKeyDown = (e: KeyboardEvent) => {
      const { nodeName } = e.target as Element;
      if (nodeName === 'INPUT' || nodeName === 'TEXTAREA') {
        return;
      }

      switch (e.key) {
        case 'Escape':
          stopEvent(e);
          onSelect([]);
          break;
        case 'k':
        case 'ArrowUp':
          stopEvent(e);
          selectPrevious();
          break;
        case 'j':
        case 'ArrowDown':
          stopEvent(e);
          selectNext();
          break;
        default:
          break;
      }
    };

    if (visualization) {
      window.addEventListener('keydown', onKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [visualization, selectedId, applicationGroups, unassignedItems, onSelect]);

  if (!applicationGroups || !unassignedItems) {
    return null;
  }

  const classes = classNames('odc-topology-list-view', searchClass);
  return (
    <div className={classes}>
      <DataList
        aria-label="Topology List View"
        className="odc-topology-list-view__data-list"
        selectedDataListItemId={selectedIds[0]}
        onSelectDataListItem={(id) => onSelect(selectedIds[0] === id ? [] : [id])}
      >
        {applicationGroups.map((g) => (
          <TopologyListViewAppGroup
            key={g.getId()}
            appGroup={g}
            selectedIds={selectedIds}
            onSelect={onSelect}
          />
        ))}
        {unassignedItems.length > 0 ? (
          <TopologyListViewUnassignedGroup
            key="unassigned"
            items={unassignedItems}
            selectedIds={selectedIds}
            onSelect={onSelect}
          />
        ) : null}
      </DataList>
    </div>
  );
};

export default TopologyListView;
