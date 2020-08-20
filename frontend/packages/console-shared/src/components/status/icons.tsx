import * as React from 'react';
import {
  ArrowCircleUpIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ExclamationTriangleIcon,
  InfoCircleIcon,
  UnknownIcon,
  SyncAltIcon,
  ResourcesAlmostFullIcon,
  ResourcesFullIcon,
} from '@patternfly/react-icons';
import { global_danger_color_100 as dangerColor } from '@patternfly/react-tokens/dist/js/global_danger_color_100';
import { global_default_color_200 as blueDefaultColor } from '@patternfly/react-tokens/dist/js/global_default_color_200';
import { global_disabled_color_100 as disabledColor } from '@patternfly/react-tokens/dist/js/global_disabled_color_100';
import { global_palette_blue_300 as blueInfoColor } from '@patternfly/react-tokens/dist/js/global_palette_blue_300';
import { global_palette_green_500 as okColor } from '@patternfly/react-tokens/dist/js/global_palette_green_500';
import { global_warning_color_100 as warningColor } from '@patternfly/react-tokens/dist/js/global_warning_color_100';

export const GreenCheckCircleIcon: React.FC<ColoredIconProps> = ({ className, alt, size }) => (
  <CheckCircleIcon size={size} color={okColor.value} className={className} alt={alt} />
);

export const RedExclamationCircleIcon: React.FC<ColoredIconProps> = ({ className, alt, size }) => (
  <ExclamationCircleIcon size={size} color={dangerColor.value} className={className} alt={alt} />
);

export const YellowExclamationTriangleIcon: React.FC<ColoredIconProps> = ({
  className,
  alt,
  size,
}) => (
  <ExclamationTriangleIcon size={size} color={warningColor.value} className={className} alt={alt} />
);

export const BlueInfoCircleIcon: React.FC<ColoredIconProps> = ({ className, alt }) => (
  <InfoCircleIcon color={blueInfoColor.value} className={className} alt={alt} />
);

export const GrayUnknownIcon: React.FC<ColoredIconProps> = ({ className, alt }) => (
  <UnknownIcon color={disabledColor.value} className={className} alt={alt} />
);

export const BlueSyncIcon: React.FC<ColoredIconProps> = ({ className, alt }) => (
  <SyncAltIcon color={blueInfoColor.value} className={className} alt={alt} />
);

export const RedResourcesFullIcon: React.FC<ColoredIconProps> = ({ className, alt }) => (
  <ResourcesFullIcon color={dangerColor.value} className={className} alt={alt} />
);

export const YellowResourcesAlmostFullIcon: React.FC<ColoredIconProps> = ({ className, alt }) => (
  <ResourcesAlmostFullIcon color={warningColor.value} className={className} alt={alt} />
);

export const BlueArrowCircleUpIcon: React.FC<ColoredIconProps> = ({ className, alt }) => (
  <ArrowCircleUpIcon color={blueDefaultColor.value} className={className} alt={alt} />
);

export type ColoredIconProps = {
  className?: string;
  alt?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
};
