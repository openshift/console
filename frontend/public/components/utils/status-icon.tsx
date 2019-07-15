import * as React from 'react';
import {
  BanIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ExclamationTriangleIcon,
  HourglassHalfIcon,
  HourglassStartIcon,
  InfoCircleIcon,
  InProgressIcon,
  SyncAltIcon,
  UnknownIcon,
} from '@patternfly/react-icons';

import {CamelCaseWrap} from './camel-case-wrap';
import * as classNames from 'classnames';

export const GreenCheckCircleIcon: React.FunctionComponent<ColoredIconProps> = ({className}) => {
  return <CheckCircleIcon color="var(--pf-global--success-color--100)" className={className} />;
};

export const RedExclamationCircleIcon: React.FunctionComponent<ColoredIconProps> = ({className}) => {
  return <ExclamationCircleIcon color="var(--pf-global--danger-color--100)" className={className} />;
};

export const YellowExclamationTriangleIcon: React.FunctionComponent<ColoredIconProps> = ({className}) => {
  return <ExclamationTriangleIcon color="var(--pf-global--warning-color--100)" className={className} />;
};

export const StatusIcon: React.FunctionComponent<StatusIconProps> = ({status, spin, icon, additionalIconClassName}) => {
  const className = classNames(spin && 'fa-spin', additionalIconClassName);

  if (icon) {
    return React.cloneElement(icon, {className});
  }

  switch (status) {
    case 'New':
      return <HourglassStartIcon className={className} />;

    case 'Pending':
      return <HourglassHalfIcon className={className} />;

    case 'ContainerCreating':
      return <InProgressIcon className={className} />;

    case 'In Progress':
    case 'Running':
    case 'Updating':
    case 'Upgrading':
      return <SyncAltIcon className={className} />;

    case 'Cancelled':
    case 'Expired':
    case 'Not Ready':
    case 'Terminating':
      return <BanIcon className={className} />;

    case 'Warning':
      return <YellowExclamationTriangleIcon className={className} />;

    case 'ContainerCannotRun':
    case 'CrashLoopBackOff':
    case 'Critical':
    case 'Error':
    case 'Failed':
    case 'InstallCheckFailed':
    case 'Lost':
    case 'Rejected':
      return <RedExclamationCircleIcon className={className} />;

    case 'Accepted':
    case 'Active':
    case 'Bound':
    case 'Complete':
    case 'Succeeded':
    case 'Completed':
    case 'Enabled':
    case 'Ready':
    case 'Up to date':
      return <GreenCheckCircleIcon className={className} />;

    case 'Info':
      return <InfoCircleIcon className={className} />;

    case 'Unknown':
      return <UnknownIcon className={className} />;

    default:
      return null;
  }
};

export const StatusIconAndText: React.FunctionComponent<StatusIconAndTextProps> = ({status, spin, icon}) => {
  if (!status){
    return <span>-</span>;
  }

  return <span className="co-icon-and-text"><StatusIcon status={status} spin={spin} additionalIconClassName="co-icon-and-text__icon" icon={icon} /><CamelCaseWrap value={status} /></span>;
};

export type ColoredIconProps = {
  className?: string;
};

export type StatusIconProps = {
  status?: string;
  additionalIconClassName?: any;
  spin?: boolean;
  icon?: React.ReactElement;
};

export type StatusIconAndTextProps = {
  status?: string;
  spin?: boolean;
  icon?: React.ReactElement;
};
