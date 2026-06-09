/* eslint-disable no-barrel-files/no-barrel-files */
import type { FC } from 'react';
import { Icon } from '@patternfly/react-core';
import {
  ArrowCircleUpIcon,
  ResourcesAlmostFullIcon,
  ResourcesFullIcon,
  RhUiSyncIcon,
  RhUiUnknownIcon,
} from '@patternfly/react-icons';
import type { ColoredIconProps } from '@console/dynamic-plugin-sdk';

export {
  GreenCheckCircleIcon,
  RedExclamationCircleIcon,
  YellowExclamationTriangleIcon,
  BlueInfoCircleIcon,
} from '@console/dynamic-plugin-sdk';

export const GrayUnknownIcon: FC<ColoredIconProps> = ({ className, title, size }) => (
  <Icon size={size}>
    <RhUiUnknownIcon className={className} title={title} />
  </Icon>
);

export const BlueSyncIcon: FC<ColoredIconProps> = ({ className, title, size }) => (
  <Icon status="info" size={size}>
    <RhUiSyncIcon className={className} title={title} />
  </Icon>
);

export const RedResourcesFullIcon: FC<ColoredIconProps> = ({ className, title, size }) => (
  <Icon status="danger" size={size}>
    <ResourcesFullIcon className={className} title={title} />
  </Icon>
);

export const YellowResourcesAlmostFullIcon: FC<ColoredIconProps> = ({ className, title, size }) => (
  <Icon status="warning" size={size}>
    <ResourcesAlmostFullIcon className={className} title={title} />
  </Icon>
);

export const BlueArrowCircleUpIcon: FC<ColoredIconProps> = ({ className, title, size }) => (
  <Icon status="info" size={size}>
    <ArrowCircleUpIcon className={className} title={title} />
  </Icon>
);
