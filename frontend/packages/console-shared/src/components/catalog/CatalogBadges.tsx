import type { FC, ReactNode } from 'react';
import { Label, Tooltip } from '@patternfly/react-core';
import type { CatalogItemBadge } from '@console/dynamic-plugin-sdk/src/extensions';
import './CatalogBadges.scss';

type CatalogBadgesProps = {
  badges: CatalogItemBadge[];
};

type CatalogHeaderBadgesProps = CatalogBadgesProps & {
  typeLabel?: ReactNode;
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

export const CatalogBadges: FC<CatalogBadgesProps> = ({ badges }) => (
  <div className="odc-catalog-badges" data-test="catalog-badges">
    {badges?.map((badge) => (
      <Badge key={badge.text} {...badge} />
    ))}
  </div>
);

/**
 * Catalog type label followed by any `placement: 'header'` badges, stacked vertically. Rendered in
 * the header of both the catalog tile and the catalog item details modal.
 */
export const CatalogHeaderBadges: FC<CatalogHeaderBadgesProps> = ({ typeLabel, badges }) => (
  <div
    className="odc-catalog-badges odc-catalog-badges--vertical"
    data-test="catalog-header-badges"
  >
    {typeLabel && (
      <Label className="odc-catalog-badges__label" color="grey" data-test="catalog-type-label">
        {typeLabel}
      </Label>
    )}
    {badges?.map((badge) => (
      <Badge key={badge.text} {...badge} />
    ))}
  </div>
);
