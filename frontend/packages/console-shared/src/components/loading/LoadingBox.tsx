import * as React from 'react';
import { ConsoleEmptyState } from '../empty-state';
import { Loading } from './Loading';

export const LoadingBox: React.FC = ({ children }) => (
  <ConsoleEmptyState data-test="loading-box" isFullHeight>
    <Loading />
    {children}
  </ConsoleEmptyState>
);
LoadingBox.displayName = 'LoadingBox';
