import type { ReactNode, FC } from 'react';
import { useState } from 'react';
import { ExpandableSection } from '@patternfly/react-core';

interface ExpandCollapseProps {
  children?: ReactNode;
  textExpanded: string;
  textCollapsed: string;
  onToggle?: (isExpanded: boolean) => void;
  dataTest?: string;
}

export const ExpandCollapse: FC<ExpandCollapseProps> = ({
  textCollapsed,
  textExpanded,
  onToggle,
  dataTest,
  children,
}) => {
  const [isExpanded, toggleExpandCollapse] = useState(false);
  return (
    <ExpandableSection
      toggleTextExpanded={textExpanded}
      toggleTextCollapsed={textCollapsed}
      onToggle={() => {
        onToggle?.(!isExpanded);
        toggleExpandCollapse(!isExpanded);
      }}
      data-test={dataTest}
    >
      {children}
    </ExpandableSection>
  );
};
