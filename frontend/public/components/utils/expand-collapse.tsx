import * as React from 'react';
import { ExpandableSection } from '@patternfly/react-core';

interface ExpandCollapseProps {
  textExpanded: string;
  textCollapsed: string;
  onToggle?: (isExpanded: boolean) => void;
}

export const ExpandCollapse: React.FC<ExpandCollapseProps> = ({
  textCollapsed,
  textExpanded,
  onToggle,
  children,
}) => {
  const [isExpanded, toggleExpandCollapse] = React.useState(false);
  return (
    <ExpandableSection
      toggleTextExpanded={textExpanded}
      toggleTextCollapsed={textCollapsed}
      onToggle={() => {
        onToggle?.(!isExpanded);
        toggleExpandCollapse(!isExpanded);
      }}
    >
      {children}
    </ExpandableSection>
  );
};
