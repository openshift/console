import * as React from 'react';
import { EmptyState, EmptyStateBody } from '@patternfly/react-core';
import { Loading } from './Loading';

export const LoadingBox: React.FC = ({ children }) => (
  <EmptyState data-test="loading-box">
    <EmptyStateBody>
      <Loading />
      {children}
    </EmptyStateBody>
  </EmptyState>
);
LoadingBox.displayName = 'LoadingBox';
