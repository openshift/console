import type { FC } from 'react';
import { Icon } from '@patternfly/react-core';
import {
  ArrowCircleUpIcon,
  ResourcesAlmostFullIcon,
  ResourcesFullIcon,
  SyncAltIcon,
  UnknownIcon,
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
    <UnknownIcon className={className} title={title} />
  </Icon>
);

export const BlueSyncIcon: FC<ColoredIconProps> = ({ className, title, size }) => (
  <Icon status="info" size={size}>
    <SyncAltIcon className={className} title={title} />
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
