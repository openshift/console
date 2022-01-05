import * as React from 'react';
import { observer } from '@patternfly/react-topology';
import { getImageForIconClass } from '@console/internal/components/catalog/catalog-item-icon';
import { ResourceIcon } from '@console/internal/components/utils';
import { isValidUrl } from '@console/shared';

interface TypedResourceBadgeCellProps {
  kind: string;
  imageClass?: string;
  typeIconClass?: string;
  typeIcon?: React.ReactNode;
}

const TypedResourceBadgeCell: React.FC<TypedResourceBadgeCellProps> = ({
  typeIconClass,
  typeIcon,
  imageClass,
  kind,
}) => {
  let itemIcon: React.ReactNode;
  let iconType: React.ReactNode;
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
  if (typeIconClass) {
    iconType = (
      <span className="odc-topology-list-view__type-icon-bg">
        <img
          className="odc-topology-list-view__type-icon"
          alt={kind}
          src={isValidUrl(typeIconClass) ? typeIconClass : getImageForIconClass(typeIconClass)}
        />
      </span>
    );
  } else if (typeIcon) {
    iconType = (
      <span className="odc-topology-list-view__type-icon-bg">
        <foreignObject className="odc-topology-list-view__type-icon">{typeIcon}</foreignObject>
      </span>
    );
  } else {
    iconType = null;
  }

  return (
    <span className="odc-topology-list-view__resource-icon__container">
      {itemIcon}
      {iconType}
    </span>
  );
};

export default observer(TypedResourceBadgeCell);
