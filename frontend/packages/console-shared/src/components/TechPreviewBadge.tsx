import * as React from 'react';
import { Label } from '@patternfly/react-core';

const TechPreviewBadge: React.FC = () => (
  <Label style={{ backgroundColor: 'var(--pf-global--warning-color--100)' }}>Tech Preview</Label>
);

export default TechPreviewBadge;
