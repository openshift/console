import * as React from 'react';
import { DataList } from '@patternfly/react-core';
import {
  observer,
  isGraph,
  Node,
  isNode,
  Visualization,
  GraphElement,
} from '@patternfly/react-topology';
import { useDeepCompareMemoize } from '@console/shared';
import { TYPE_APPLICATION_GROUP } from '../components';
import { TopologyListViewAppGroup } from './TopologyListViewAppGroup';
import { getChildKinds, sortGroupChildren } from './list-view-utils';
import { TopologyListViewUnassignedGroup } from './TopologyListViewUnassignedGroup';

import './TopologyListView.scss';

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
  const selectedId = selectedIds[0];
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

  return (
    <div className="odc-topology-list-view">
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

export default observer(TopologyListView);
