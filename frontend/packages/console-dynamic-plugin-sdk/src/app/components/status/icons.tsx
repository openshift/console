import * as React from 'react';
import {
  CheckCircleIcon,
  InfoCircleIcon,
  ExclamationCircleIcon,
  ExclamationTriangleIcon,
} from '@patternfly/react-icons';
import * as classNames from 'classnames';

import './icons.scss';

export type ColoredIconProps = {
  className?: string;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
};

export const GreenCheckCircleIcon: React.FC<ColoredIconProps> = ({ className, title, size }) => (
  <CheckCircleIcon
    data-test="success-icon"
    size={size}
    className={classNames('dps-icons__green-check-icon', className)}
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
    className={classNames('dps-icons__red-exclamation-icon', className)}
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
    className={classNames('dps-icons__yellow-exclamation-icon', className)}
    title={title}
  />
);

export const BlueInfoCircleIcon: React.FC<ColoredIconProps> = ({ className, title }) => (
  <InfoCircleIcon className={classNames('dps-icons__blue-info-icon', className)} title={title} />
);
