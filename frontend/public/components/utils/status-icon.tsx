import * as React from 'react';
import { Icon } from 'patternfly-react';
import {CamelCaseWrap} from './camel-case-wrap';
import * as classNames from 'classnames';

export const StatusIcon: React.FunctionComponent<StatusIconProps> = ({status, spin, iconName, additionalIconClassName}) => {
  const className = classNames(spin && 'fa-spin', additionalIconClassName);

  if (iconName){
    return <Icon type="pf" name={iconName} className={className} />;
  }

  switch (status) {
    case 'New':
      return <Icon type="fa" name="hourglass-1" className={className} />;

    case 'Pending':
      return <Icon type="fa" name="hourglass-half" className={className} />;

    case 'ContainerCreating':
      return <Icon type="pf" name="in-progress" className={className} />;

    case 'In Progress':
    case 'Running':
    case 'Updating':
    case 'Upgrading':
      return <Icon type="fa" name="refresh" className={className} />;

    case 'Cancelled':
    case 'Expired':
    case 'Not Ready':
    case 'Terminating':
      return <Icon type="fa" name="ban" className={className} />;

    case 'Warning':
      return <Icon type="pf" name="warning-triangle-o" className={className} />;

    case 'ContainerCannotRun':
    case 'CrashLoopBackOff':
    case 'Critical':
    case 'Error':
    case 'Failed':
    case 'InstallCheckFailed':
    case 'Lost':
    case 'Rejected':
      return <Icon type="pf" name="error-circle-o" className={className} />;

    case 'Accepted':
    case 'Active':
    case 'Bound':
    case 'Complete':
    case 'Completed':
    case 'Enabled':
    case 'Ready':
    case 'Up to date':
      return <Icon type="pf" name="ok" className={className} />;

    case 'Info':
      return <Icon type="pf" name="info" className={className} />;

    case 'Unknown':
      return <Icon type="pf" name="unknown" className={className} />;

    default:
      return null;
  }
};


export const StatusIconAndText: React.FunctionComponent<StatusIconAndTextProps> = ({status, spin, iconName}) => {
  if (!status){
    return <span>-</span>;
  }

  return <span className="co-icon-and-text"><StatusIcon status={status} spin={spin} additionalIconClassName="co-icon-and-text__icon" iconName={iconName} /><CamelCaseWrap value={status} /></span>;
};

export type StatusIconProps = {
  status?: string;
  additionalIconClassName?: any;
  spin?: boolean;
  iconName?: string;
};

export type StatusIconAndTextProps = {
  status?: string;
  spin?: boolean;
  iconName?: string;
};
