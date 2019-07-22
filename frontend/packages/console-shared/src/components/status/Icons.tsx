import * as React from 'react';
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  ExclamationTriangleIcon,
} from '@patternfly/react-icons';
import {
  global_success_color_100 as successColor,
  global_warning_color_100 as warningColor,
  global_danger_color_100 as dangerColor,
} from '@patternfly/react-tokens';

export type ColoredIconProps = {
  className?: string;
};

export const GreenCheckCircleIcon: React.FC<ColoredIconProps> = ({ className }) => {
  return <CheckCircleIcon color={successColor.value} className={className} />;
};

export const RedExclamationCircleIcon: React.FC<ColoredIconProps> = ({ className }) => {
  return <ExclamationCircleIcon color={dangerColor.value} className={className} />;
};

export const YellowExclamationTriangleIcon: React.FC<ColoredIconProps> = ({ className }) => {
  return <ExclamationTriangleIcon color={warningColor.value} className={className} />;
};
