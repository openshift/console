import * as React from 'react';
import {
  CheckCircleIcon,
  InfoCircleIcon,
  ExclamationCircleIcon,
  ExclamationTriangleIcon,
} from '@patternfly/react-icons';
import { global_danger_color_100 as dangerColor } from '@patternfly/react-tokens/dist/js/global_danger_color_100';
import { global_palette_blue_300 as blueInfoColor } from '@patternfly/react-tokens/dist/js/global_palette_blue_300';
import { global_palette_green_500 as okColor } from '@patternfly/react-tokens/dist/js/global_palette_green_500';
import { global_warning_color_100 as warningColor } from '@patternfly/react-tokens/dist/js/global_warning_color_100';

export type ColoredIconProps = {
  className?: string;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
};

export const GreenCheckCircleIcon: React.FC<ColoredIconProps> = ({ className, title, size }) => (
  <CheckCircleIcon
    data-test="success-icon"
    size={size}
    color={okColor.value}
    className={className}
    title={title}
  />
);

export const RedExclamationCircleIcon: React.FC<ColoredIconProps> = ({
  className,
  title,
  size,
}) => (
  <ExclamationCircleIcon
    size={size}
    color={dangerColor.value}
    className={className}
    title={title}
  />
);

export const YellowExclamationTriangleIcon: React.FC<ColoredIconProps> = ({
  className,
  title,
  size,
}) => (
  <ExclamationTriangleIcon
    size={size}
    color={warningColor.value}
    className={className}
    title={title}
  />
);

export const BlueInfoCircleIcon: React.FC<ColoredIconProps> = ({ className, title }) => (
  <InfoCircleIcon color={blueInfoColor.value} className={className} title={title} />
);
