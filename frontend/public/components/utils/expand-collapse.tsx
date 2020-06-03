import * as React from 'react';
import { ExpandableSection } from '@patternfly/react-core';

interface ExpandCollapseProps {
  textExpanded: string;
  textCollapsed: string;
}

export const ExpandCollapse: React.FC<ExpandCollapseProps> = ({
  textCollapsed,
  textExpanded,
  children,
}) => {
  const [isExpanded, toggleExpandCollapse] = React.useState(false);
  return (
    <ExpandableSection
      toggleText={isExpanded ? textExpanded : textCollapsed}
      onToggle={() => toggleExpandCollapse(!isExpanded)}
    >
      {children}
    </ExpandableSection>
  );
};
