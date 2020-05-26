import * as React from 'react';
import { Title, EmptyState, EmptyStateIcon, EmptyStateBody, Spinner } from '@patternfly/react-core';
import { PlugIcon } from '@patternfly/react-icons';
import './vm-console-empty-state.scss';

export interface ConsoleEmptyStateProps {
  isKubevirt: boolean;
}

export const ConsoleEmptyState: React.SFC<ConsoleEmptyStateProps> = ({ isKubevirt }) => (
  <div className="kv-cloud-vm-console-empty">
    <EmptyState>
      {isKubevirt === undefined ? (
        <>
          <EmptyStateIcon variant="container" component={Spinner} />
          <Title size="lg" headingLevel="h4">
            Loading
          </Title>
        </>
      ) : (
        <>
          <EmptyStateIcon icon={PlugIcon} />
          <Title size="lg" headingLevel="h4">
            Kubevirt Plugin was not found
          </Title>
          <EmptyStateBody>
            Accessing the VNC Console is not possible. Please install Kubevirt
          </EmptyStateBody>
        </>
      )}
    </EmptyState>
  </div>
);
