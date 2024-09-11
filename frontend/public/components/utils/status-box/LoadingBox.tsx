import * as React from 'react';
import { Loading } from './Loading';
import { ConsoleEmptyState } from './ConsoleEmptyState';

export const LoadingBox: React.FC = ({ children }) => (
  <ConsoleEmptyState>
    <Loading />
    {children}
  </ConsoleEmptyState>
);
LoadingBox.displayName = 'LoadingBox';
