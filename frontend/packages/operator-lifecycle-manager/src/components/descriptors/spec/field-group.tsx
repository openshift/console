import * as React from 'react';
import { ExpandableSection } from '@console/internal/components/utils/expandable-section';

export const FieldGroup: React.FC<FieldGroupProps> = ({
  groupName,
  defaultExpand = false,
  children,
}) => {
  const [expand, setExpand] = React.useState<boolean>(defaultExpand);

  const onExpandableSectionToggle = (event) => {
    event.preventDefault();
    setExpand(!expand);
  };

  return (
    <div className="co-field-group">
      <ExpandableSection
        id={groupName}
        key={groupName}
        isExpanded={expand}
        listTitle={groupName}
        onToggle={onExpandableSectionToggle}
      >
        {children}
      </ExpandableSection>
    </div>
  );
};
FieldGroup.displayName = 'FieldGroup';

export type FieldGroupProps = {
  defaultExpand?: boolean;
  groupName: string;
};
