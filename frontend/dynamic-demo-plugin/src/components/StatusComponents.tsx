import * as React from 'react';
import {
  Status,
  GenericStatus,
  ErrorStatus,
  SuccessStatus,
  PendingStatus,
  ProgressStatus,
  InfoIcon,
  SuccessIcon,
  ErrorIcon,
  WarningIcon,
  StatusIconAndText,
} from '@console/dynamic-plugin-sdk/api';

const MockIcon: React.ComponentType<{ title?: string }> = ({ title }) => (
  <div id="mock-icon">{title}</div>
);

const StatusComponentsDemo: React.FC = () => {
  return (
    <div>
      <h2>StatusComponents from Dynamic Plugin SDK</h2>
      <div>
        <Status title="status" status="status" />
        <GenericStatus Icon={MockIcon} title="status" />
        <ErrorStatus title="error" />
        <SuccessStatus title="success" />
        <PendingStatus title="pending" />
        <ProgressStatus title="progress" />
        <InfoIcon title="info" />
        <SuccessIcon title="success" />
        <ErrorIcon title="error" />
        <WarningIcon title="warning" />
        <StatusIconAndText title="info" spin />
      </div>
    </div>
  );
};

export default StatusComponentsDemo;
