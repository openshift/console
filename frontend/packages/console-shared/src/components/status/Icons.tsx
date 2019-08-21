import * as React from 'react';
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  ExclamationTriangleIcon,
} from '@patternfly/react-icons';
import {
  global_warning_color_100 as warningColor,
  global_danger_color_100 as dangerColor,
} from '@patternfly/react-tokens';

export type ColoredIconProps = {
  className?: string;
  alt?: string;
};

export const GreenCheckCircleIcon: React.FC<ColoredIconProps> = ({ className, alt }) => {
  return (
    <CheckCircleIcon color="var(--pf-chart-color-green-400)" className={className} alt={alt} />
  );
};

export const RedExclamationCircleIcon: React.FC<ColoredIconProps> = ({ className, alt }) => {
  return <ExclamationCircleIcon color={dangerColor.value} className={className} alt={alt} />;
};

export const YellowExclamationTriangleIcon: React.FC<ColoredIconProps> = ({ className, alt }) => {
  return <ExclamationTriangleIcon color={warningColor.value} className={className} alt={alt} />;
};
