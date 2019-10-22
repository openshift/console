import * as React from 'react';
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  ExclamationTriangleIcon,
  InfoCircleIcon,
} from '@patternfly/react-icons';
import {
  global_warning_color_100 as warningColor,
  global_danger_color_100 as dangerColor,
  global_success_color_200 as okColor,
  global_info_color_100 as blueInfoColor,
} from '@patternfly/react-tokens';

export const GreenCheckCircleIcon: React.FC<ColoredIconProps> = ({ className, alt }) => (
  <CheckCircleIcon color={okColor.value} className={className} alt={alt} />
);

export const RedExclamationCircleIcon: React.FC<ColoredIconProps> = ({ className, alt }) => (
  <ExclamationCircleIcon color={dangerColor.value} className={className} alt={alt} />
);

export const YellowExclamationTriangleIcon: React.FC<ColoredIconProps> = ({ className, alt }) => (
  <ExclamationTriangleIcon color={warningColor.value} className={className} alt={alt} />
);

export const BlueInfoCircleIcon: React.FC<ColoredIconProps> = ({ className, alt }) => (
  <InfoCircleIcon color={blueInfoColor.value} className={className} alt={alt} />
);

type ColoredIconProps = {
  className?: string;
  alt?: string;
};
