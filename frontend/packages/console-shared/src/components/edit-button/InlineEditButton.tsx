import type { FC } from 'react';
import type { ButtonProps } from '@patternfly/react-core';
import { Button } from '@patternfly/react-core';
import { RhUiEditIcon } from '@patternfly/react-icons';

export interface InlineEditButtonProps extends Pick<
  ButtonProps,
  'children' | 'isDisabled' | 'onClick'
> {
  dataTest?: string;
}

export const InlineEditButton: FC<InlineEditButtonProps> = ({
  children,
  isDisabled,
  onClick,
  dataTest,
}) => (
  <Button
    icon={<RhUiEditIcon />}
    iconPosition="end"
    type="button"
    variant="link"
    isInline
    onClick={onClick}
    isDisabled={isDisabled}
    data-test={dataTest ? `${dataTest}-details-item__edit-button` : 'details-item__edit-button'}
  >
    {children}
  </Button>
);
