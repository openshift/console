import * as React from 'react';
import { Select, SelectProps } from '@patternfly/react-core';

export const FormPFSelect: React.FC<FormPFSelectProps> = ({
  onSelect,
  children,
  menuAppendTo = 'parent',
  ...props
}) => {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <Select
      menuAppendTo={menuAppendTo}
      isOpen={isOpen}
      onToggle={(isExpanded) => setIsOpen(isExpanded)}
      onSelect={(e, v, i) => {
        onSelect(e, v, i);
        setIsOpen(false);
      }}
      {...props}
    >
      {children}
    </Select>
  );
};

type FormPFSelectProps = Omit<SelectProps, 'onToggle' | 'isOpen'>;
