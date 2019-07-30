import * as React from 'react';
import { OutlinedCheckCircleIcon } from '@patternfly/react-icons';
import { global_success_color_100 as successColor } from '@patternfly/react-tokens';

export type BuildSuccessIconProps = {
  className?: string;
};

const BuildSuccessIcon: React.FC<BuildSuccessIconProps> = ({ className }) => (
  <OutlinedCheckCircleIcon color={successColor.value} className={className} />
);

export default BuildSuccessIcon;
