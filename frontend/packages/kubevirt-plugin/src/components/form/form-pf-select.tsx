import * as React from 'react';
import {
  Select as SelectDeprecated,
  SelectProps as SelectPropsDeprecated,
} from '@patternfly/react-core/deprecated';

export const FormPFSelect: React.FC<FormPFSelectProps> = ({
  onSelect,
  children,
  menuAppendTo = 'parent',
  closeOnSelect = true,
  ...props
}) => {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <SelectDeprecated
      menuAppendTo={menuAppendTo}
      isOpen={isOpen}
      onToggle={(_event, isExpanded) => setIsOpen(isExpanded)}
      onSelect={(e, v, i) => {
        onSelect(e, v, i);
        closeOnSelect && setIsOpen(false);
      }}
      {...props}
    >
      {children}
    </SelectDeprecated>
  );
};

type FormPFSelectProps = Omit<SelectPropsDeprecated, 'onToggle' | 'isOpen'> & {
  closeOnSelect?: boolean;
};
