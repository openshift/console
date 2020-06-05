import * as React from 'react';
import { Expandable } from '@patternfly/react-core';

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
    <Expandable
      toggleTextExpanded={textExpanded}
      toggleTextCollapsed={textCollapsed}
      onToggle={() => {
        onToggle?.(!isExpanded);
        toggleExpandCollapse(!isExpanded);
      }}
    >
      {children}
    </Expandable>
  );
};
