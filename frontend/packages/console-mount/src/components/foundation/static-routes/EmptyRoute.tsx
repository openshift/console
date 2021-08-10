import * as React from 'react';
import { EmptyState, EmptyStateIcon, EmptyStateBody, Title } from '@patternfly/react-core';
import CubesIcon from '@patternfly/react-icons/dist/js/icons/cubes-icon';

const EmptyRoute: React.FC = () => {
  return (
    <EmptyState>
      <EmptyStateIcon icon={CubesIcon} />
      <Title headingLevel="h4" size="lg">
        Empty Route
      </Title>
      <EmptyStateBody>
        <p>Nothing to see here.</p>
      </EmptyStateBody>
    </EmptyState>
  );
};

export default EmptyRoute;
