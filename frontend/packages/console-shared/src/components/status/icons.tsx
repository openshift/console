import * as React from 'react';
import { ArrowCircleUpIcon } from '@patternfly/react-icons/dist/esm/icons/arrow-circle-up-icon';
import { ResourcesAlmostFullIcon } from '@patternfly/react-icons/dist/esm/icons/resources-almost-full-icon';
import { ResourcesFullIcon } from '@patternfly/react-icons/dist/esm/icons/resources-full-icon';
import { SyncAltIcon } from '@patternfly/react-icons/dist/esm/icons/sync-alt-icon';
import { UnknownIcon } from '@patternfly/react-icons/dist/esm/icons/unknown-icon';
import * as ReactTokens from '@patternfly/react-tokens';
import { ColoredIconProps } from '@console/dynamic-plugin-sdk';

export {
  GreenCheckCircleIcon,
  RedExclamationCircleIcon,
  YellowExclamationTriangleIcon,
  BlueInfoCircleIcon,
} from '@console/dynamic-plugin-sdk';

export const GrayUnknownIcon: React.FC<ColoredIconProps> = ({ className, title }) => (
  <UnknownIcon
    color={ReactTokens.global_disabled_color_100.value}
    className={className}
    title={title}
  />
);

export const BlueSyncIcon: React.FC<ColoredIconProps> = ({ className, title }) => (
  <SyncAltIcon
    color={ReactTokens.global_palette_blue_300.value}
    className={className}
    title={title}
  />
);

export const RedResourcesFullIcon: React.FC<ColoredIconProps> = ({ className, title }) => (
  <ResourcesFullIcon
    color={ReactTokens.global_danger_color_100.value}
    className={className}
    title={title}
  />
);

export const YellowResourcesAlmostFullIcon: React.FC<ColoredIconProps> = ({ className, title }) => (
  <ResourcesAlmostFullIcon
    color={ReactTokens.global_warning_color_100.value}
    className={className}
    title={title}
  />
);

export const BlueArrowCircleUpIcon: React.FC<ColoredIconProps> = ({ className, title }) => (
  <ArrowCircleUpIcon
    color={ReactTokens.global_Color_200.value}
    className={className}
    title={title}
  />
);
