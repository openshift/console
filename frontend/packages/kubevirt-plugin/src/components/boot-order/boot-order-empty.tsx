import * as React from 'react';
import {
  Alert,
  Button,
  EmptyState,
  EmptyStateBody,
  EmptyStateVariant,
  Title,
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
    <Title headingLevel="h5" size="lg">
      {title}
    </Title>
    <EmptyStateBody>{message}</EmptyStateBody>
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
