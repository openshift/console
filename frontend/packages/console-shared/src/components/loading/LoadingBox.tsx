import type { ReactNode } from 'react';
import { ConsoleEmptyState } from '../empty-state';
import { Loading } from './Loading';

// We do not use react-router here as LoadingBox may be used outside the router context scope
// This const will only be evaluated once on first load. We mess with the query params a lot
// so this would be easily lost otherwise.
const IS_BLAME_ENABLED = new URLSearchParams(window.location.search).has('crp-blame');

interface LoadingBoxProps {
  /**
   * The name of the component or feature that is loading. Will be
   * shown only if the `crp-blame` query param is set. No i18n is
   * needed as this is for debugging purposes only.
   */
  blame?: string;
  children?: ReactNode;
}

export const LoadingBox: Snail.FCC<LoadingBoxProps> = ({ blame = 'LoadingBox', children }) => {
  return (
    <ConsoleEmptyState
      data-test="loading-box"
      isFullHeight
      title={IS_BLAME_ENABLED ? blame : undefined}
    >
      <Loading />
      {children}
    </ConsoleEmptyState>
  );
};
LoadingBox.displayName = 'LoadingBox';
