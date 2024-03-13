import * as React from 'react';
import { CloseButton as CloseButtonPF } from '@patternfly/react-component-groups';

type CloseButtonProps = {
  additionalClassName?: string;
  ariaLabel?: string;
  dataTestID?: string;
  onClick: (e: any) => void;
};

/**
 * @deprecated Do not use deprecated CloseButton import; the component has been moved to @patternfly/react-component-groups
 */
const CloseButton: React.FC<CloseButtonProps> = ({ additionalClassName, ariaLabel, ...rest }) => (
  <CloseButtonPF className={additionalClassName} aria-label={ariaLabel} {...rest} />
);

export default CloseButton;
