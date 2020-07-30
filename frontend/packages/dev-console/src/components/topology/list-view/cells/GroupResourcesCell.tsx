import * as React from 'react';
import { DataListCell } from '@patternfly/react-core';
import { Node, observer } from '@patternfly/react-topology';
import { getImageForIconClass } from '@console/internal/components/catalog/catalog-item-icon';
import { ResourceIcon } from '@console/internal/components/utils';
import { isValidUrl } from '@console/shared';
import { labelForNodeKind } from '../list-view-utils';

interface TopologyListViewGroupResourcesCellProps {
  group: Node;
}

const ObservedTopologyListViewGroupResourcesCell: React.FC<TopologyListViewGroupResourcesCellProps> = ({
  group,
}) => {
  const { groupResources } = group.getData();
  const childKindsMap = groupResources.reduce((acc, child) => {
    const kind = child.resourceKind || child.resource?.kind;
    if (!acc[kind]) {
      acc[kind] = 0;
    }
    acc[kind]++;
    return acc;
  }, {});
  const kindKeys = Object.keys(childKindsMap).sort((a, b) =>
    labelForNodeKind(a).localeCompare(labelForNodeKind(b)),
  );
  return (
    <DataListCell key="resources" id={`${group.getId()}_resources`}>
      {kindKeys.map((key) => {
        let itemIcon;
        let imageClass;
        if (imageClass) {
          itemIcon = (
            <image
              className="co-m-resource-icon--md"
              xlinkHref={isValidUrl(imageClass) ? imageClass : getImageForIconClass(imageClass)}
            />
          );
        } else {
          itemIcon = <ResourceIcon className="co-m-resource-icon--md" kind={key} />;
        }
        return (
          <span key={key} className="odc-topology-list-view__group-resource-count">
            {childKindsMap[key]}
            {itemIcon}
          </span>
        );
      })}
    </DataListCell>
  );
};

const GroupResourcesCell = observer(ObservedTopologyListViewGroupResourcesCell);
export { GroupResourcesCell };
