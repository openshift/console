import * as React from 'react';
import { Badge } from '@patternfly/react-core';
import './Badge.scss';

export const InlineTechPreviewBadge = () => (
  <Badge className="ocs-badge__inline" isRead>
    Tech Preview
  </Badge>
);
export const InlineDevPreviewBadge = () => (
  <Badge className="ocs-badge__inline" isRead>
    Dev Preview
  </Badge>
);
