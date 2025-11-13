import * as React from 'react';
import type { ReactNode } from 'react';
import { ConsoleEmptyState } from '../empty-state';
import { Loading } from './Loading';

interface LoadingBoxProps {
  children?: ReactNode;
}

export const LoadingBox: React.FCC<LoadingBoxProps> = ({ children }) => (
  <ConsoleEmptyState data-test="loading-box" isFullHeight>
    <Loading />
    {children}
  </ConsoleEmptyState>
);
LoadingBox.displayName = 'LoadingBox';
