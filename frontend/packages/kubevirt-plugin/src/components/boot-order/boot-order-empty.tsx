import * as React from 'react';
import {
  Alert,
  Button,
  EmptyState,
  EmptyStateBody,
  EmptyStateVariant,
  EmptyStateHeader,
  EmptyStateFooter,
} from '@patternfly/react-core';

// Display and empty with a Call to add new source if no sources are defined.
export const BootOrderEmpty: React.FC<BootOrderEmptyProps> = ({
  title,
  message,
  addItemMessage,
  addItemIsDisabled,
  addItemDisabledMessage,
  onClick,
}) => (
  <EmptyState variant={EmptyStateVariant.full}>
    <EmptyStateHeader titleText={<>{title}</>} headingLevel="h5" />
    <EmptyStateBody>{message}</EmptyStateBody>
    <EmptyStateFooter>
      {!addItemIsDisabled ? (
        <Button
          variant="secondary"
          onClick={onClick}
          className="kubevirt-boot-order__boot-order-empty-btn"
        >
          {addItemMessage}
        </Button>
      ) : (
        <Alert variant="info" title={addItemDisabledMessage} />
      )}
    </EmptyStateFooter>
  </EmptyState>
);

export type BootOrderEmptyProps = {
  title: string;
  message: string;
  addItemMessage: string;
  addItemIsDisabled: boolean;
  addItemDisabledMessage?: string;
  onClick: () => void;
};
