import * as React from 'react';
import { ModelBadge } from '@console/dynamic-plugin-sdk/src/extensions/resource-metadata';
import DevPreviewBadge from './DevPreviewBadge';
import { InlineDevPreviewBadge, InlineTechPreviewBadge } from './InlineBadge';
import TechPreviewBadge from './TechPreviewBadge';

export enum BadgeType {
  DEV = 'Dev Preview',
  TECH = 'Tech Preview',
}

export const getBadgeFromType = (badge: ModelBadge | BadgeType): React.ReactElement => {
  switch (badge) {
    case ModelBadge.DEV:
    case BadgeType.DEV:
      return <DevPreviewBadge />;
    case ModelBadge.TECH:
    case BadgeType.TECH:
      return <TechPreviewBadge />;
    default:
      return null;
  }
};

export const getInlineBadgeFromType = (badge: ModelBadge | BadgeType): React.ReactElement => {
  switch (badge) {
    case ModelBadge.DEV:
    case BadgeType.DEV:
      return <InlineDevPreviewBadge />;
    case ModelBadge.TECH:
    case BadgeType.TECH:
      return <InlineTechPreviewBadge />;
    default:
      return null;
  }
};
