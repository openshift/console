import * as React from 'react';
import { Label } from '@patternfly/react-core';

const TechPreviewBadge: React.FC = () => (
  <Label
    className="tech-preview"
    style={{
      backgroundColor: '#D93F00',
      height: '100%',
      borderRadius: 'var(--pf-global--BorderRadius--sm)',
    }}
  >
    Tech Preview
  </Label>
);

export default TechPreviewBadge;
