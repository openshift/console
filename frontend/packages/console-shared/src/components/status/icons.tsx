import * as React from 'react';
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  ExclamationTriangleIcon,
  InfoCircleIcon,
  UnknownIcon,
  SyncAltIcon,
  ResourcesAlmostFullIcon,
  ResourcesFullIcon,
} from '@patternfly/react-icons';
import {
  global_warning_color_100 as warningColor,
  global_danger_color_100 as dangerColor,
  global_success_color_200 as okColor,
  global_info_color_100 as blueInfoColor,
  global_disabled_color_100 as disabledColor,
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

export type ColoredIconProps = {
  className?: string;
  alt?: string;
};
