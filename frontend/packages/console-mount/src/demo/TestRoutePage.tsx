import * as React from 'react';
import { EmptyState, EmptyStateIcon, EmptyStateBody, Title } from '@patternfly/react-core';
import { UnityIcon } from '@patternfly/react-icons';
import { Link } from 'react-router-dom';

const TestRoutePage: React.FC = () => {
  return (
    <EmptyState>
      <EmptyStateIcon icon={UnityIcon} />
      <Title headingLevel="h4" size="lg">
        Test Route
      </Title>
      <EmptyStateBody>
        <p>
          This is a test route. Nothing to see here, <Link to="/">go home</Link>.
        </p>
      </EmptyStateBody>
    </EmptyState>
  );
};

export default TestRoutePage;
