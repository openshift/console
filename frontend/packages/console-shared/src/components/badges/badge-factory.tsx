import * as React from 'react';
import DevPreviewBadge from './DevPreviewBadge';
import { InlineDevPreviewBadge, InlineTechPreviewBadge } from './InlineBadge';
import TechPreviewBadge from './TechPreviewBadge';

import { BadgeType } from '@console/dynamic-plugin-sdk/src/extensions/console-types'
export { BadgeType } from '@console/dynamic-plugin-sdk/src/extensions/console-types'

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

export const getInlineBadgeFromType = (badge: BadgeType): React.ReactElement => {
  switch (badge) {
    case BadgeType.DEV:
      return <InlineDevPreviewBadge />;
    case BadgeType.TECH:
      return <InlineTechPreviewBadge />;
    default:
      return null;
  }
};
