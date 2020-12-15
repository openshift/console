import * as React from 'react';
import {
  Title,
  EmptyState,
  EmptyStateBody,
  EmptyStateIcon,
  EmptyStateVariant,
} from '@patternfly/react-core';
import { InfoCircleIcon } from '@patternfly/react-icons';

const HelmReleaseNotesEmptyState: React.FC = () => (
  <EmptyState variant={EmptyStateVariant.full}>
    <EmptyStateIcon icon={InfoCircleIcon} />
    <Title size="md">No Release Notes Available</Title>
    <EmptyStateBody>Release Notes are not available for this Helm Chart.</EmptyStateBody>
  </EmptyState>
);

export default HelmReleaseNotesEmptyState;
