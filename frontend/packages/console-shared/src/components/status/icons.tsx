import * as React from 'react';
import { Icon } from '@patternfly/react-core';
import { ArrowCircleUpIcon } from '@patternfly/react-icons/dist/esm/icons/arrow-circle-up-icon';
import { ResourcesAlmostFullIcon } from '@patternfly/react-icons/dist/esm/icons/resources-almost-full-icon';
import { ResourcesFullIcon } from '@patternfly/react-icons/dist/esm/icons/resources-full-icon';
import { SyncAltIcon } from '@patternfly/react-icons/dist/esm/icons/sync-alt-icon';
import { UnknownIcon } from '@patternfly/react-icons/dist/esm/icons/unknown-icon';
import { ColoredIconProps } from '@console/dynamic-plugin-sdk';

export {
  GreenCheckCircleIcon,
  RedExclamationCircleIcon,
  YellowExclamationTriangleIcon,
  BlueInfoCircleIcon,
} from '@console/dynamic-plugin-sdk';

export const GrayUnknownIcon: React.FC<ColoredIconProps> = ({ className, title, size }) => (
  <Icon size={size}>
    <UnknownIcon className={className} title={title} />
  </Icon>
);

export const BlueSyncIcon: React.FC<ColoredIconProps> = ({ className, title, size }) => (
  <Icon status="info" size={size}>
    <SyncAltIcon className={className} title={title} />
  </Icon>
);

export const RedResourcesFullIcon: React.FC<ColoredIconProps> = ({ className, title, size }) => (
  <Icon status="danger" size={size}>
    <ResourcesFullIcon className={className} title={title} />
  </Icon>
);

export const YellowResourcesAlmostFullIcon: React.FC<ColoredIconProps> = ({
  className,
  title,
  size,
}) => (
  <Icon status="warning" size={size}>
    <ResourcesAlmostFullIcon className={className} title={title} />
  </Icon>
);

export const BlueArrowCircleUpIcon: React.FC<ColoredIconProps> = ({ className, title, size }) => (
  <Icon status="info" size={size}>
    <ArrowCircleUpIcon className={className} title={title} />
  </Icon>
);
