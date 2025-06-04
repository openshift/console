import {
  DescriptionListTermHelpText,
  DescriptionListTermHelpTextProps,
  DescriptionListTermHelpTextButton,
  DescriptionListTermHelpTextButtonProps,
  Popover,
  PopoverProps,
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
export const DescriptionListTermHelp = ({
  text,
  textHelp,
  customHeaderContent,
  helpTextProps,
  helpTextButtonProps,
  popoverProps,
}: DescriptionListTermHelpProps) => (
  <DescriptionListTermHelpText {...helpTextProps}>
    <Popover headerContent={customHeaderContent ?? text} bodyContent={textHelp} {...popoverProps}>
      <DescriptionListTermHelpTextButton {...helpTextButtonProps}>
        {text}
      </DescriptionListTermHelpTextButton>
    </Popover>
  </DescriptionListTermHelpText>
);
