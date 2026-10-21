import type { FC } from 'react';
import { Label, Tooltip } from '@patternfly/react-core';
import type { CatalogItemBadge } from '@console/dynamic-plugin-sdk/src/extensions';
import './CatalogBadges.scss';

type CatalogBadgesProps = {
  badges: CatalogItemBadge[];
};

const Badge = ({ color, icon, variant, text, tooltip }: CatalogItemBadge) => {
  const badge = (
    <Label
      className="odc-catalog-badges__label"
      color={color}
      icon={icon}
      variant={variant}
      data-test={`${text}-badge`}
    >
      {text}
    </Label>
  );
  return tooltip ? <Tooltip content={tooltip}>{badge}</Tooltip> : badge;
};

const CatalogBadges: FC<CatalogBadgesProps> = ({ badges }) => (
  <div className="odc-catalog-badges">
    {badges?.map((badge) => (
      <Badge key={badge.text} {...badge} />
    ))}
  </div>
);

export default CatalogBadges;
