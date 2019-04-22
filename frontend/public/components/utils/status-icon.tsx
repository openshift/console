import * as React from 'react';
import { Icon } from 'patternfly-react';
import {CamelCaseWrap} from './camel-case-wrap';

export const StatusIcon: React.FunctionComponent<StatusIconProps> = ({status}) => {

  if (!status){
    return <span>-</span>;
  }

  switch (status) {
    case 'New':
      return <span className="co-icon-and-text"><Icon type="fa" name="hourglass-1" className="co-icon-and-text__icon" /><span className="co-icon-and-text__text"><CamelCaseWrap value={status} /></span></span>;

    case 'Pending':
      return <span className="co-icon-and-text"><Icon type="fa" name="hourglass-half" className="co-icon-and-text__icon" /><span className="co-icon-and-text__text"><CamelCaseWrap value={status} /></span></span>;

    case 'ContainerCreating':
      return <span className="co-icon-and-text"><Icon type="pf" name="in-progress" className="co-icon-and-text__icon" /><span className="co-icon-and-text__text"><CamelCaseWrap value={status} /></span></span>;

    case 'In Progress':
    case 'Running':
    case 'Updating':
    case 'Upgrading':
      return <span className="co-icon-and-text"><Icon type="fa" name="refresh" className="co-icon-and-text__icon" /><span className="co-icon-and-text__text"><span className="co-icon-and-text__text"><CamelCaseWrap value={status} /></span></span></span>;

    case 'Cancelled':
    case 'Expired':
    case 'Not Ready':
    case 'Terminating':
      return <span className="co-icon-and-text"><Icon type="fa" name="ban" className="co-icon-and-text__icon" /><span className="co-icon-and-text__text"><CamelCaseWrap value={status} /></span></span>;

    case 'Warning':
      return <span className="co-icon-and-text"><Icon type="pf" name="warning-triangle-o" className="co-icon-and-text__icon" /><span className="co-icon-and-text__text"><CamelCaseWrap value={status} /></span></span>;

    case 'ContainerCannotRun':
    case 'CrashLoopBackOff':
    case 'Critical':
    case 'Error':
    case 'Failed':
    case 'InstallCheckFailed':
    case 'Lost':
    case 'Rejected':
      return <span className="co-icon-and-text"><Icon type="pf" name="error-circle-o" className="co-icon-and-text__icon" /><span className="co-icon-and-text__text"><CamelCaseWrap value={status} /></span></span>;

    case 'Accepted':
    case 'Active':
    case 'Bound':
    case 'Complete':
    case 'Completed':
    case 'Enabled':
    case 'Ready':
    case 'Up to date':
      return <span className="co-icon-and-text"><Icon type="pf" name="ok" className="co-icon-and-text__icon" /><span className="co-icon-and-text__text"><CamelCaseWrap value={status} /></span></span>;

    case 'Unknown':
      return <span className="co-icon-and-text"><Icon type="pf" name="unknown" className="co-icon-and-text__icon" /><span className="co-icon-and-text__text"><CamelCaseWrap value={status} /></span></span>;

    default:
      return <span className="co-icon-and-text__text"><CamelCaseWrap value={status} /></span>;
  }
};

/* eslint-disable no-undef */
export type StatusIconProps = {
  status?: string;
};
