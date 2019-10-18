import * as React from 'react';
import DevPreviewBadge from './DevPreviewBadge';
import TechPreviewBadge from './TechPreviewBadge';

export enum BadgeType {
  DEV = 'DevPreview',
  TECH = 'TechPreview',
}

export const getBadgeFromType = (badge: BadgeType): React.ReactElement => {
  switch (badge) {
    case BadgeType.DEV:
      return <DevPreviewBadge />;
    case BadgeType.TECH:
      return <TechPreviewBadge />;
    default:
      return null;
  }
};
