import type { FC } from 'react';
import type { ButtonProps } from '@patternfly/react-core';
import { Button } from '@patternfly/react-core';
import { RhUiEditIcon } from '@patternfly/react-icons';

export type InlineEditButtonProps = Pick<ButtonProps, 'children' | 'isDisabled' | 'onClick'> & {
  testId?: string;
};

export const InlineEditButton: FC<InlineEditButtonProps> = ({
  children,
  isDisabled,
  onClick,
  testId,
}) => (
  <Button
    icon={<RhUiEditIcon />}
    iconPosition="end"
    type="button"
    variant="link"
    isInline
    onClick={onClick}
    isDisabled={isDisabled}
    data-test={testId}
  >
    {children}
  </Button>
);

InlineEditButton.displayName = 'InlineEditButton';
