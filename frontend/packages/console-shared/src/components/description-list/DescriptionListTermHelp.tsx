import type { FC } from 'react';
import type {
  DescriptionListTermHelpTextProps,
  DescriptionListTermHelpTextButtonProps,
  PopoverProps,
} from '@patternfly/react-core';
import {
  DescriptionListTermHelpText,
  DescriptionListTermHelpTextButton,
  Popover,
} from '@patternfly/react-core';

type AnyProps = {
  /** Additional unknown prop types */
  [key: string]: any;
};

type DescriptionListTermHelpProps = {
  /** The term to be displayed */
  text: string | React.ReactNode;
  /** The description of the term */
  textHelp: string | React.ReactNode;
  /** The description of the term */
  customHeaderContent?: string | React.ReactNode;

  /** Props to pass to the DescriptionListTermHelpText */
  helpTextProps?: Partial<DescriptionListTermHelpTextProps> & AnyProps;
  /** Props to pass to the DescriptionListTermHelpTextButton */
  helpTextButtonProps?: Partial<DescriptionListTermHelpTextButtonProps> & AnyProps;
  /** Props to pass to the Popover */
  popoverProps?: Partial<PopoverProps> & AnyProps;
};

/**
 * A wrapper around PatternFly's `DescriptionListTermHelpText` component to
 * display a `DescriptionListTerm` with a popover for the description.
 */
export const DescriptionListTermHelp: FC<DescriptionListTermHelpProps> = ({
  text,
  textHelp,
  customHeaderContent,
  helpTextProps,
  helpTextButtonProps,
  popoverProps,
}) => (
  <DescriptionListTermHelpText {...helpTextProps}>
    <Popover headerContent={customHeaderContent ?? text} bodyContent={textHelp} {...popoverProps}>
      <DescriptionListTermHelpTextButton {...helpTextButtonProps}>
        {text}
      </DescriptionListTermHelpTextButton>
    </Popover>
  </DescriptionListTermHelpText>
);
