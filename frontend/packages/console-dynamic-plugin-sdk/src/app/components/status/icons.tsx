import type { FC } from 'react';
import type { IconSize } from '@patternfly/react-core';
import { Icon } from '@patternfly/react-core';
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  ExclamationTriangleIcon,
  InfoCircleIcon,
} from '@patternfly/react-icons';
import { css } from '@patternfly/react-styles';

import './icons.scss';

export type ColoredIconProps = {
  className?: string;
  title?: string;
  size?: IconSize;
  dataTest?: string;
};

/**
 * Component for displaying a green check mark circle icon.
 * @param {string} [className] - (optional) additional class name for the component
 * @param {string} [title] - (optional) icon title
 * @param {string} [size] - (optional) icon size: ('sm', 'md', 'lg', 'xl', '2xl', '3xl', 'headingSm', 'headingMd', 'headingLg', 'headingXl', 'heading_2xl', 'heading_3xl', 'bodySm', 'bodyDefault', 'bodyLg')
 * @example
 * ```tsx
 * <GreenCheckCircleIcon title="Healthy" />
 * ```
 */
export const GreenCheckCircleIcon: FC<ColoredIconProps> = ({ className, title, size }) => {
  const icon = (
    <CheckCircleIcon
      data-test="success-icon"
      className={css('dps-icons__green-check-icon', className)}
      title={title}
    />
  );
  if (size) {
    return <Icon size={size}>{icon}</Icon>;
  }
  return icon;
};

/**
 * Component for displaying a red exclamation mark circle icon.
 * @param {string} [className] - (optional) additional class name for the component
 * @param {string} [title] - (optional) icon title
 * @param {string} [size] - (optional) icon size: ('sm', 'md', 'lg', 'xl')
 * @example
 * ```tsx
 * <RedExclamationCircleIcon title="Failed" />
 * ```
 */
export const RedExclamationCircleIcon: FC<ColoredIconProps> = ({ className, title, size }) => {
  const icon = (
    <ExclamationCircleIcon
      className={css('dps-icons__red-exclamation-icon', className)}
      title={title}
    />
  );

  if (size) {
    return <Icon size={size}>{icon}</Icon>;
  }
  return icon;
};

/**
 * Component for displaying a yellow triangle exclamation icon.
 * @param {string} [className] - (optional) additional class name for the component
 * @param {string} [title] - (optional) icon title
 * @param {string} [size] - (optional) icon size: ('sm', 'md', 'lg', 'xl')
 * @param {string} [dataTest] - (optional) icon test id
 * @example
 * ```tsx
 * <YellowExclamationTriangleIcon title="Warning" />
 * ```
 */
export const YellowExclamationTriangleIcon: FC<ColoredIconProps> = ({
  className,
  title,
  size,
  dataTest,
}) => {
  const icon = (
    <ExclamationTriangleIcon
      className={css('dps-icons__yellow-exclamation-icon', className)}
      title={title}
      data-test={dataTest}
    />
  );

  if (size) {
    return <Icon size={size}>{icon}</Icon>;
  }
  return icon;
};

/**
 * Component for displaying a blue info circle icon.
 * @param {string} [className] - (optional) additional class name for the component
 * @param {string} [title] - (optional) icon title
 * @param {string} [size] - (optional) icon size: ('sm', 'md', 'lg', 'xl')
 * @example
 * ```tsx
 * <BlueInfoCircleIcon title="Info" />
 * ```
 */
export const BlueInfoCircleIcon: FC<ColoredIconProps> = ({ className, title, size }) => {
  const icon = (
    <InfoCircleIcon className={css('dps-icons__blue-info-icon', className)} title={title} />
  );

  if (size) {
    return <Icon size={size}>{icon}</Icon>;
  }
  return icon;
};
