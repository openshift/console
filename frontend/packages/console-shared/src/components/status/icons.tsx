import * as React from 'react';
import {
  ArrowCircleUpIcon,
  UnknownIcon,
  SyncAltIcon,
  ResourcesAlmostFullIcon,
  ResourcesFullIcon,
} from '@patternfly/react-icons';
import { global_danger_color_100 as dangerColor } from '@patternfly/react-tokens/dist/js/global_danger_color_100';
import { global_default_color_200 as blueDefaultColor } from '@patternfly/react-tokens/dist/js/global_default_color_200';
import { global_disabled_color_100 as disabledColor } from '@patternfly/react-tokens/dist/js/global_disabled_color_100';
import { global_palette_blue_300 as blueInfoColor } from '@patternfly/react-tokens/dist/js/global_palette_blue_300';
import { global_warning_color_100 as warningColor } from '@patternfly/react-tokens/dist/js/global_warning_color_100';
import { ColoredIconProps } from '@console/dynamic-plugin-sdk';

export {
  ColoredIconProps,
  GreenCheckCircleIcon,
  RedExclamationCircleIcon,
  YellowExclamationTriangleIcon,
  BlueInfoCircleIcon,
} from '@console/dynamic-plugin-sdk';

export const GrayUnknownIcon: React.FC<ColoredIconProps> = ({ className, title }) => (
  <UnknownIcon color={disabledColor.value} className={className} title={title} />
);

export const BlueSyncIcon: React.FC<ColoredIconProps> = ({ className, title }) => (
  <SyncAltIcon color={blueInfoColor.value} className={className} title={title} />
);

export const RedResourcesFullIcon: React.FC<ColoredIconProps> = ({ className, title }) => (
  <ResourcesFullIcon color={dangerColor.value} className={className} title={title} />
);

export const YellowResourcesAlmostFullIcon: React.FC<ColoredIconProps> = ({ className, title }) => (
  <ResourcesAlmostFullIcon color={warningColor.value} className={className} title={title} />
);

export const BlueArrowCircleUpIcon: React.FC<ColoredIconProps> = ({ className, title }) => (
  <ArrowCircleUpIcon color={blueDefaultColor.value} className={className} title={title} />
);
