import * as React from 'react';
import { Expandable } from '@patternfly/react-core';

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
  const ontoggle: any = (event: MouseEvent) => {
    // TODO: Remove this when https://github.com/patternfly/patternfly-react/issues/2339 is fixed
    event.preventDefault();
    toggleExpandCollapse(!isExpanded);
  };
  return (
    <Expandable
      toggleText={isExpanded ? textExpanded : textCollapsed}
      onToggle={ontoggle}
      isExpanded={isExpanded}
    >
      {children}
    </Expandable>
  );
};
