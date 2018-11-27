import * as React from 'react';
import { Icon } from 'patternfly-react';
import {CamelCaseWrap} from './camel-case-wrap';

export const StatusIcon: React.FunctionComponent<StatusIconProps> = ({status}) => {

  if (!status){
    return <span>-</span>;
  }

  switch (status) {

    case 'Pending':
      return <span><Icon type="fa" name="hourglass-half" /> <CamelCaseWrap value={status} /></span>;

    case 'Expired':
    case 'Cancelled':
    case 'Not Ready':
    case 'Terminating':
      return <span><Icon type="fa" name="ban" /> <CamelCaseWrap value={status} /></span>;

    case 'Warning':
      return <span><Icon type="pf" name="warning-triangle-o" /> <CamelCaseWrap value={status} /></span>;

    case 'Running':
      return <span><Icon type="fa" name="refresh" /> <CamelCaseWrap value={status} /></span>;

    case 'ContainerCreating':
    case 'Updating':
    case 'Upgrading':
    case 'In Progress':
      return <span><Icon type="pf" name="in-progress" /> <CamelCaseWrap value={status} /></span>;

    case 'ContainerCannotRun':
    case 'CrashLoopBackOff':
    case 'Critical':
    case 'Error':
    case 'Failed':
    case 'InstallCheckFailed':
    case 'Lost':
    case 'Rejected':
      return <span><Icon type="pf" name="error-circle-o" /> <CamelCaseWrap value={status} /></span>;

    case 'Accepted':
    case 'Active':
    case 'Bound':
    case 'Complete':
    case 'Completed':
    case 'Enabled':
    case 'Ready':
    case 'Up to date':
      return <span><Icon type="pf" name="ok" /> <CamelCaseWrap value={status} /></span>;

    case 'Unknown':
      return <span><Icon type="pf" name="unknown" /> <CamelCaseWrap value={status} /></span>;

    case 'New':
      return <span><Icon type="fa" name="hourglass-1" /> <CamelCaseWrap value={status} /></span>;

    default:
      return <span><CamelCaseWrap value={status} /></span>;
  }
};

/* eslint-disable no-undef */
export type StatusIconProps = {
  status?: string;
};
