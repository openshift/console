import * as React from 'react';
import { AccordionItem, AccordionContent, AccordionToggle } from '@patternfly/react-core';

interface ExpandCollapseProps {
  listTitle: string;
  toggleClassName?: string;
  id?: string;
  isExpanded?: boolean;
  onToggle?: Function;
}

export const ExpandableSection: React.FC<ExpandCollapseProps> = ({
  listTitle,
  children,
  toggleClassName,
  id,
  isExpanded,
  onToggle,
}) => {
  return (
    <AccordionItem>
      <AccordionToggle
        onClick={(event) => {
          onToggle(event, id);
        }}
        isExpanded={isExpanded}
        id={id}
        className={toggleClassName}
      >
        {listTitle}
      </AccordionToggle>
      <AccordionContent isHidden={!isExpanded}>{children}</AccordionContent>
    </AccordionItem>
  );
};
