import * as React from 'react';
import { ConsoleEmptyState } from '@console/internal/components/utils/status-box/ConsoleEmptyState';
import { Loading } from './Loading';

export const LoadingBox: React.FC = ({ children }) => (
  <ConsoleEmptyState>
    <Loading />
    {children}
  </ConsoleEmptyState>
);
LoadingBox.displayName = 'LoadingBox';
