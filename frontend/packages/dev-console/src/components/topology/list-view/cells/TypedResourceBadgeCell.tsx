import * as React from 'react';
import { DataListCell } from '@patternfly/react-core';
import { observer } from '@patternfly/react-topology';
import { isValidUrl } from '@console/shared';
import { getImageForIconClass } from '@console/internal/components/catalog/catalog-item-icon';
import { ResourceIcon } from '@console/internal/components/utils';

interface TypedResourceBadgeCellProps {
  kind: string;
  imageClass?: string;
  typeIconClass?: string;
}

const ObservedTypedResourceBadgeCell: React.FC<TypedResourceBadgeCellProps> = ({
  typeIconClass,
  imageClass,
  kind,
}) => {
  let itemIcon;
  if (imageClass) {
    itemIcon = (
      <image
        className="odc-topology-list-view__resource-icon co-m-resource-icon--md"
        xlinkHref={isValidUrl(imageClass) ? imageClass : getImageForIconClass(imageClass)}
      />
    );
  } else {
    itemIcon = (
      <ResourceIcon
        className="odc-topology-list-view__resource-icon co-m-resource-icon--md"
        kind={kind}
      />
    );
  }

  const typeIcon = typeIconClass ? (
    <img
      className="odc-topology-list-view__type-icon"
      alt={kind}
      src={isValidUrl(typeIconClass) ? typeIconClass : getImageForIconClass(typeIconClass)}
    />
  ) : null;

  return (
    <DataListCell isIcon className="odc-topology-list-view__resource-icon-cell">
      <span className="odc-topology-list-view__resource-icon__container">
        {itemIcon}
        {typeIcon}
      </span>
    </DataListCell>
  );
};

const TypedResourceBadgeCell = observer(ObservedTypedResourceBadgeCell);
export { TypedResourceBadgeCell };
