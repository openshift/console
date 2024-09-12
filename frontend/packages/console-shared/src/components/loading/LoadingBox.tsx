import * as React from 'react';
import { ConsoleEmptyState } from '../empty-state';
import { Loading } from './Loading';

export const LoadingBox: React.FC = ({ children }) => (
  <ConsoleEmptyState>
    <Loading />
    {children}
  </ConsoleEmptyState>
);
LoadingBox.displayName = 'LoadingBox';
